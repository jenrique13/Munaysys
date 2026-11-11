from datetime import datetime
from typing import Optional
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork
from app.core.security import get_password_hash
import secrets
import string

class MembershipUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def _apply_amenity_template(self, membership: models.Membership):
        """Identifies and applies the amenity template based on the space."""
        if not membership.office_id:
            return

        office = self.uow.offices.get(membership.office_id)
        if not office:
            return

        # Try to find a template for this space category
        template = self.uow.amenity_templates.get_by_space_category(
            space_type="office", 
            category_name=office.category,
            branch_id=office.branch_id
        )

        if not template:
            return

        for item in template.items:
            # Fetch service to get name/category
            service = self.uow.services.get(item.service_id)
            if not service: continue

            # Calculate total quantity based on office capacity
            total_quantity = item.quantity * (office.capacity or 1)

            # Create Amenity for the client
            db_amenity = models.Amenity(
                name=service.name,
                branch_id=office.branch_id,
                client_id=membership.client_id,
                membership_id=membership.id,
                service_id=item.service_id,
                quantity=total_quantity,
                monthly_quota=total_quantity,
                is_recurring=True,
                is_active=True,
                unit="hora" if "hora" in service.name.lower() or service.is_room_rate else "unidad",
                category="hours" if "hora" in service.name.lower() or service.is_room_rate else "general"
            )
            self.uow.db.add(db_amenity)

    def _auto_provision_portal_user(self, client: models.Client):
        """Creates a portal user for the client if one doesn't already exist."""
        if not client or not client.email:
            return  # Can't create user without email

        # Skip if user already exists
        existing = self.uow.users.get_by_email(client.email)
        if existing:
            if not existing.is_active:
                existing.is_active = True  # Reactivate if disabled
            return

        # Get Coworker role
        role = self.uow.db.query(models.Role).filter(models.Role.name == "Coworker").first()
        if not role:
            return  # Role not set up yet, skip silently

        # Generate a temporary password (client should reset on first login)
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        portal_user = models.User(
            email=client.email,
            password_hash=get_password_hash(temp_password),
            role_id=role.id,
            branch_id=client.branch_id,
            is_active=True,
            status="active",
            access_permissions={"client_portal": True}
        )
        self.uow.db.add(portal_user)
        # Note: commit is done by the caller

    def create(self, membership_in: schemas.operative.membership.MembershipCreate):
        # 1. Create Membership record
        db_membership = models.Membership(
            client_id=membership_in.client_id,
            office_id=membership_in.office_id,
            plan_name=membership_in.plan_name,
            start_date=membership_in.start_date,
            end_date=membership_in.end_date,
            hours_included=membership_in.hours_included,
            hours_used=0.0,
            price=membership_in.price,
            billing_address=membership_in.billing_address,
            status=membership_in.status,
            authorized_persons_json=membership_in.authorized_persons_json,
            created_at=datetime.utcnow()
        )
        self.uow.db.add(db_membership)
        
        # 2. Update Office status if linked
        if membership_in.office_id:
            office = self.uow.offices.get(membership_in.office_id)
            if office:
                office.status = "ocupado"

        # 3. Handle Client link if necessary (e.g. status)
        client = self.uow.clients.get(membership_in.client_id)
        if client:
            client.status = "active"
            # 4. Auto-provision portal access for the client
            self._auto_provision_portal_user(client)

        # 5. Apply Amenity Templates
        self.uow.db.flush()
        self._apply_amenity_template(db_membership)

        # 6. Auto-generate the initial Sales Order
        try:
            self._auto_create_order(db_membership, client)
        except Exception as e:
            import logging
            logging.error(f"Failed to auto-create order for membership {db_membership.id}: {e}")
            # We don't block the membership creation if order fails, just log it.

        self.uow.commit()
        self.uow.refresh(db_membership)
        return db_membership

    def _auto_create_order(self, membership: models.Membership, client: models.Client):
        """Automatically generates a sales order for the newly created membership."""
        if membership.price <= 0:
            return  # No need to bill free memberships

        # Determine branch
        branch_id = client.branch_id
        if membership.office_id:
            office = self.uow.offices.get(membership.office_id)
            if office and office.branch_id:
                branch_id = office.branch_id
        
        if not branch_id:
            branch_id = 1 # Fallback

        from app.use_cases.financial.order_use_cases import OrderUseCases
        from app.schemas.financial.order import OrdenCreate
        from app.schemas.financial.pedido import PedidoCreate
        
        order_uc = OrderUseCases(self.uow)
        
        order_in = OrdenCreate(
            client_id=membership.client_id,
            branch_id=branch_id,
            apply_tax=True,  # Default applying IVA 16%
            status="pending",
            details=[
                PedidoCreate(
                    item_type="membership",
                    item_id=membership.id,
                    item_name=f"Membresía: {membership.plan_name}",
                    quantity=1.0,
                    unit_price=membership.price,
                    discount=0.0
                )
            ]
        )
        
        order_uc.create(order_in)

    def cancel(self, membership_id: int):
        membership = self.uow.memberships.get(membership_id)
        if not membership:
            return False
            
        membership.status = "cancelled"
        
        # 3. Deactivate associated amenities
        self.uow.db.query(models.Amenity).filter(
            models.Amenity.membership_id == membership_id
        ).update({"is_active": False, "is_recurring": False})
        
        # 4. Vacate Office
        if membership.office_id:
            office = self.uow.offices.get(membership.office_id)
            if office:
                office.status = "disponible"
        
        self.uow.commit()
        return True

    def update(self, membership_id: int, membership_in: schemas.operative.membership.MembershipUpdate):
        membership = self.uow.memberships.get(membership_id)
        if not membership:
            raise ValueError("Membresía no encontrada.")

        # 1. Update fields
        update_data = membership_in.model_dump(exclude_unset=True)
        
        # 2. Check for Office change
        old_office_id = membership.office_id
        new_office_id = update_data.get("office_id", old_office_id)

        if old_office_id != new_office_id:
            # Vacate old
            if old_office_id:
                old_off = self.uow.offices.get(old_office_id)
                if old_off: old_off.status = "disponible"
            # Occupy new
            if new_office_id:
                new_off = self.uow.offices.get(new_office_id)
                if new_off: new_off.status = "ocupado"

        # 3. Apply updates to model
        for field, value in update_data.items():
            setattr(membership, field, value)

        self.uow.commit()
        self.uow.refresh(membership)
        return membership
