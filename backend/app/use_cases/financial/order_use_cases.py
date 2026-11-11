from datetime import datetime
from typing import List, Optional
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class OrderUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def _calculate_order_totals(self, subtotal: float, discount: float, discount_type: str, apply_tax: bool):
        # Calculate discount amount
        if discount_type == 'percentage':
            discount_amount = subtotal * (discount / 100.0)
        else:
            discount_amount = discount
        
        taxable_amount = subtotal - discount_amount
        tax = taxable_amount * 0.16 if apply_tax else 0.0
        total = taxable_amount + tax
        return tax, total

    def _prefetch_item_names(self, details) -> dict:
        from collections import defaultdict
        ids_by_type = defaultdict(list)
        for d in details:
            if d.item_type and d.item_id:
                ids_by_type[d.item_type].append(d.item_id)
        
        names_map = {}
        if ids_by_type.get("product"):
            items = self.uow.products.query().with_entities(models.Product.id, models.Product.name).filter(models.Product.id.in_(ids_by_type["product"])).all()
            for i in items: names_map[f"product_{i.id}"] = i.name
        if ids_by_type.get("room"):
            items = self.uow.rooms.query().with_entities(models.Room.id, models.Room.name).filter(models.Room.id.in_(ids_by_type["room"])).all()
            for i in items: names_map[f"room_{i.id}"] = i.name
        if ids_by_type.get("office"):
            items = self.uow.offices.query().with_entities(models.Office.id, models.Office.name).filter(models.Office.id.in_(ids_by_type["office"])).all()
            for i in items: names_map[f"office_{i.id}"] = i.name
        if ids_by_type.get("amenity"):
            items = self.uow.amenities.query().with_entities(models.Amenity.id, models.Amenity.name).filter(models.Amenity.id.in_(ids_by_type["amenity"])).all()
            for i in items: names_map[f"amenity_{i.id}"] = i.name
        if ids_by_type.get("service"):
            items = self.uow.services.query().with_entities(models.Service.id, models.Service.name).filter(models.Service.id.in_(ids_by_type["service"])).all()
            for i in items: names_map[f"service_{i.id}"] = i.name
        if ids_by_type.get("package"):
            items = self.uow.packages.query().with_entities(models.Package.id, models.Package.name).filter(models.Package.id.in_(ids_by_type["package"])).all()
            for i in items: names_map[f"package_{i.id}"] = i.name
        if ids_by_type.get("membership"):
            items = self.uow.memberships.query().with_entities(models.Membership.id, models.Membership.plan_name).filter(models.Membership.id.in_(ids_by_type["membership"])).all()
            for i in items: names_map[f"membership_{i.id}"] = f"Membresía: {i.plan_name}"
            
        return names_map

    def create(self, order_in: schemas.financial.order.OrdenCreate):
        # 1. PRE-VALIDATION: Check availability for all room items
        from app.use_cases.operative.booking_use_cases import BookingUseCases
        booking_uc = BookingUseCases(self.uow)
        
        for detail in order_in.details:
            if detail.item_type == "room" and detail.start_time and detail.end_time:
                is_available = booking_uc.check_availability(
                    room_id=detail.item_id,
                    start_time=detail.start_time,
                    end_time=detail.end_time
                )
                if not is_available:
                    # Fetch room name for better error message
                    room = self.uow.rooms.get(detail.item_id)
                    room_name = room.name if room else f"Sala #{detail.item_id}"
                    raise ValueError(f"La sala '{room_name}' no está disponible en el horario seleccionado ({detail.start_time.strftime('%H:%M')} - {detail.end_time.strftime('%H:%M')}).")

        # 2. Create Order base
        db_order = models.Orden(
            client_id=order_in.client_id,
            branch_id=order_in.branch_id,
            discount=order_in.discount,
            discount_type=order_in.discount_type,
            apply_tax=order_in.apply_tax,
            status=order_in.status,
            date=datetime.utcnow(),
            subtotal=0.0,
            tax=0.0,
            total=0.0
        )
        self.uow.orders.add(db_order)
        self.uow.orders.flush() # Generate ID for details

        # 2. Add details and calculate subtotal
        prefetched_names = self._prefetch_item_names(order_in.details)
        subtotal = 0.0
        for detail in order_in.details:
            line_subtotal = (detail.unit_price * detail.quantity) - detail.discount
            subtotal += line_subtotal
            
            # Fetch item name
            item_name = getattr(detail, 'item_name', None) or "Item Desconocido"
            if item_name == "Item Desconocido":
                item_name = prefetched_names.get(f"{detail.item_type}_{detail.item_id}", "Item Desconocido")

            db_pedido = models.Pedido(
                orden_id=db_order.id,
                item_type=detail.item_type,
                item_id=detail.item_id,
                item_name=item_name,
                quantity=detail.quantity,
                unit_price=detail.unit_price,
                discount=detail.discount,
                subtotal=line_subtotal,
                start_time=detail.start_time,
                end_time=detail.end_time,
                service_id=detail.service_id
            )
            self.uow.pedidos.add(db_pedido)

            # 3. Deduct stock for products or create bookings for rooms
            if detail.item_type == "product":
                self.uow.products.update_stock(detail.item_id, -detail.quantity)
            elif detail.item_type == "room" and detail.start_time and detail.end_time:
                db_booking = models.Booking(
                    room_id=detail.item_id,
                    client_id=order_in.client_id,
                    start_time=detail.start_time,
                    end_time=detail.end_time,
                    status="confirmed",
                    total_hours=detail.quantity,
                    total_cost=line_subtotal,
                    orden_id=db_order.id
                )
                self.uow.bookings.add(db_booking)

        # 4. Process Amenity Deductions
        self.uow.orders.flush() # Ensure all details are in DB before processing
        self._process_amenities(db_order)

        # 5. Final calculations (using adjusted subtotals)
        current_subtotal = sum(d.subtotal for d in db_order.details)
        tax, total = self._calculate_order_totals(current_subtotal, order_in.discount, order_in.discount_type, order_in.apply_tax)
        
        db_order.subtotal = current_subtotal
        db_order.tax = tax
        db_order.total = total

        # Auto-pay if total is zero
        if db_order.total <= 0:
            db_order.status = "paid"

        self.uow.orders.flush()
        return db_order

    def delete(self, order_id: int, user_email: str = "system", reason: str = None):
        db_order = self.uow.orders.get(order_id)
        if not db_order:
            return False
            
        # 1. Revert stock and amenities
        self._revert_amenities(db_order)
        for detail in db_order.details:
            if detail.item_type == "product":
                self.uow.products.update_stock(detail.item_id, detail.quantity)
        
        # 2. Delete linked bookings explicitly
        self.uow.bookings.query().filter(models.Booking.orden_id == order_id).delete()
        
        # 3. Clean up Receipts and CashMovements
        receipts = self.uow.receipts.query().filter(models.Receipt.orden_id == order_id).all()
        for receipt in receipts:
            # Delete associated cash movements directly
            self.uow.cash_movements.query().filter(models.CashMovement.receipt_id == receipt.id).delete()
            self.uow.receipts.delete(receipt)
            
        # Nullify reference in Quotes to allow deletion
        self.uow.quotes.query().filter(models.Quote.converted_order_id == order_id).update({"converted_order_id": None})
        
        # 4. Create Audit Log for Deletion (before the order is actually deleted so we can get its data)
        client_name = db_order.client.name if db_order.client else "N/A"
        from app.models import OrderAuditLog
        user = self.uow.users.query().filter(models.User.email == user_email).first()
        log = OrderAuditLog(
            orden_id=None,
            user_id=user.id if user else None,
            action="DELETED",
            reason=reason or "Orden eliminada manualmente",
            changes_json={
                "message": f"Orden #{db_order.id} eliminada por {user_email}",
                "order_id": db_order.id,
                "client_name": client_name,
                "total": db_order.total
            }
        )
        self.uow.db.add(log)
        
        # 5. Delete order (cascades to Pedido/details via relationship cascade)
        self.uow.orders.remove(order_id)
        self.uow.commit()
        return True

    def update(self, order_id: int, order_in: schemas.financial.order.OrdenUpdate, user_email: str = "system"):
        db_order = self.uow.orders.get(order_id)
        if not db_order:
            return None

        if order_in.client_id is not None: db_order.client_id = order_in.client_id
        if order_in.discount is not None: db_order.discount = order_in.discount
        if order_in.discount_type is not None: db_order.discount_type = order_in.discount_type
        if order_in.apply_tax is not None: db_order.apply_tax = order_in.apply_tax
        old_status = db_order.status
        if order_in.status is not None: db_order.status = order_in.status

        # If status changed to 'cancelled' and no new details are provided, revert everything
        if order_in.status == "cancelled" and old_status != "cancelled" and order_in.details is None:
            self._revert_amenities(db_order)
            for detail in db_order.details:
                if detail.item_type == "product":
                    self.uow.products.update_stock(detail.item_id, detail.quantity)
            
            # Update linked bookings status
            self.uow.bookings.query().filter(models.Booking.orden_id == order_id).update({"status": "cancelled"})

        if order_in.details is not None:
            # 1. Revert stock and amenities changes for old products/items
            self._revert_amenities(db_order)
            for detail in db_order.details:
                if detail.item_type == "product":
                    self.uow.products.update_stock(detail.item_id, detail.quantity)

            # 2. Delete linked bookings explicitly
            self.uow.bookings.query().filter(models.Booking.orden_id == order_id).delete()

            # 3. Delete old details
            self.uow.pedidos.query().filter(models.Pedido.orden_id == order_id).delete()
            self.uow.pedidos.flush()

            # 4. PRE-VALIDATION: Check availability for all new room items
            from app.use_cases.operative.booking_use_cases import BookingUseCases
            booking_uc = BookingUseCases(self.uow)
            for detail in order_in.details:
                if detail.item_type == "room" and detail.start_time and detail.end_time:
                    is_available = booking_uc.check_availability(
                        room_id=detail.item_id,
                        start_time=detail.start_time,
                        end_time=detail.end_time
                    )
                    if not is_available:
                        room = self.uow.rooms.get(detail.item_id)
                        room_name = room.name if room else f"Sala #{detail.item_id}"
                        raise ValueError(f"La sala '{room_name}' no está disponible en el horario seleccionado ({detail.start_time.strftime('%H:%M')} - {detail.end_time.strftime('%H:%M')}).")

            # 5. Add details and calculate subtotal
            prefetched_names = self._prefetch_item_names(order_in.details)
            subtotal = 0.0
            for detail in order_in.details:
                line_subtotal = (detail.unit_price * detail.quantity) - detail.discount
                subtotal += line_subtotal
                
                item_name = getattr(detail, 'item_name', None) or "Item Desconocido"
                if item_name == "Item Desconocido":
                    item_name = prefetched_names.get(f"{detail.item_type}_{detail.item_id}", "Item Desconocido")

                db_pedido = models.Pedido(
                    orden_id=db_order.id,
                    item_type=detail.item_type,
                    item_id=detail.item_id,
                    item_name=item_name,
                    quantity=detail.quantity,
                    unit_price=detail.unit_price,
                    discount=detail.discount,
                    subtotal=line_subtotal,
                    start_time=detail.start_time,
                    end_time=detail.end_time,
                    service_id=detail.service_id
                )
                self.uow.pedidos.add(db_pedido)

                # 6. Deduct stock for products or create bookings for rooms
                if detail.item_type == "product":
                    self.uow.products.update_stock(detail.item_id, -detail.quantity)
                elif detail.item_type == "room" and detail.start_time and detail.end_time:
                    db_booking = models.Booking(
                        room_id=detail.item_id,
                        client_id=db_order.client_id,
                        start_time=detail.start_time,
                        end_time=detail.end_time,
                        status="confirmed",
                        total_hours=detail.quantity,
                        total_cost=line_subtotal,
                        orden_id=db_order.id
                    )
                    self.uow.bookings.add(db_booking)
            
            # 6. Process Amenity Deductions for new details
            self.uow.orders.flush() # Ensure details have access if needed
            self.uow.db.expire(db_order, ['details'])
            self._process_amenities(db_order)
            
            db_order.subtotal = sum(d.subtotal for d in db_order.details)
        
        # 7. Final calculations
        tax, total = self._calculate_order_totals(db_order.subtotal, db_order.discount, db_order.discount_type, db_order.apply_tax)
        db_order.tax = tax
        db_order.total = total

        # Auto-pay if total is zero
        if db_order.total <= 0:
            db_order.status = "paid"

        # 8. Create Audit Log
        from app.models import OrderAuditLog
        client_name = db_order.client.name if db_order.client else "N/A"
        log = OrderAuditLog(
            orden_id=db_order.id,
            action="UPDATE",
            reason=order_in.reason,
            changes_json={
                "message": f"Orden actualizada. Razón: {order_in.reason}",
                "client_name": client_name,
                "order_id": db_order.id
            }
        )
        self.uow.db.add(log)

        self.uow.orders.flush()
        return db_order

    def _process_amenities(self, db_order: models.Orden):
        """Deducts quantities from client's available amenities if order items match."""
        import logging
        logger = logging.getLogger(__name__)
        
        amenities = self.uow.amenities.get_by_client(db_order.client_id)
        if not amenities:
            logger.info(f"No amenities found for client {db_order.client_id}")
            return
            
        logger.info(f"Processing amenities for order {db_order.id}, client {db_order.client_id}. Found {len(amenities)} amenities.")
            
        for detail in db_order.details:
            target_amenity = None
            logger.info(f"Checking detail: item_type={detail.item_type}, item_id={detail.item_id}, name={detail.item_name}, service_id={detail.service_id}")
            
            # Match for room bookings: check if the used rate (service_id) is an amenity or room rate
            if detail.item_type == "room":
                can_use_amenity = False
                service = None
                if detail.service_id:
                    service = self.uow.services.query().filter(models.Service.id == detail.service_id).first()
                    if service:
                        logger.info(f"Room detail using service {service.id}: {service.name}. is_amenity={service.is_amenity}, is_room_rate={service.is_room_rate}")
                        if service.is_amenity or service.is_room_rate:
                            can_use_amenity = True
                else:
                    logger.info("Room detail has no service_id, allowing amenity fallback")
                    can_use_amenity = True
                
                if can_use_amenity:
                    # Priority 1: Match by service ID or name (if available)
                    if service:
                        target_amenity = next((a for a in amenities if (a.service_id == service.id or a.name == service.name) and a.quantity > 0), None)
                        if target_amenity: logger.info(f"Matched amenity by service ID/name: {target_amenity.name}")
                    
                    # Priority 2: Try to find amenity specifically for this room
                    if not target_amenity:
                        target_amenity = next((a for a in amenities if a.space_type == "room" and a.space_id == detail.item_id and a.quantity > 0), None)
                        if target_amenity: logger.info(f"Matched amenity by space_id: {target_amenity.name}")
                    
                    # Priority 3: Fallback to any 'hours' category amenity
                    if not target_amenity:
                        target_amenity = next((a for a in amenities if a.category == "hours" and a.quantity > 0), None)
                        if target_amenity: logger.info(f"Matched amenity by category 'hours': {target_amenity.name}")
                    
                    # Priority 4: Match by room type keywords (if category is general or None)
                    if not target_amenity:
                        room = self.uow.rooms.get(detail.item_id)
                        if room:
                            rt_lower = room.type.lower() if room.type else ""
                            # Try to match if amenity name contains room type or vice versa, or "SALA"/"REUNION" keywords
                            target_amenity = next((a for a in amenities if 
                                a.category in [None, "general", "hours"] and
                                (rt_lower in a.name.lower() or a.name.lower() in rt_lower or 
                                 ("sala" in a.name.lower() and ("sala" in rt_lower or "room" in rt_lower)) or
                                 ("reunion" in a.name.lower() and "reunion" in rt_lower))
                                and a.quantity > 0), None)
                            if target_amenity: logger.info(f"Matched amenity by room type/keywords: {target_amenity.name}")
            
            # Match for services
            elif detail.item_type == "service":
                service = self.uow.services.query().filter(models.Service.id == detail.item_id).first()
                if service:
                    logger.info(f"Service detail using service {service.id}: {service.name}. is_amenity={service.is_amenity}, is_room_rate={service.is_room_rate}")
                    # Allow deduction if it's an amenity OR a room rate
                    if service.is_amenity or service.is_room_rate:
                        # Priority 1: Match by service ID or name
                        target_amenity = next((a for a in amenities if (a.service_id == service.id or a.name == service.name) and a.quantity > 0), None)
                        if target_amenity: logger.info(f"Matched service amenity by ID/name: {target_amenity.name}")
                        
                        # Priority 2: Fallback to any 'hours' category amenity if it's a room rate service
                        if not target_amenity and service.is_room_rate:
                            target_amenity = next((a for a in amenities if a.category == "hours" and a.quantity > 0), None)
                            if target_amenity: logger.info(f"Matched service amenity by category 'hours': {target_amenity.name}")
            
            if target_amenity:
                covered = min(detail.quantity, target_amenity.quantity)
                if covered > 0:
                    detail.amenity_id = target_amenity.id
                    detail.amenity_quantity = covered
                    
                    old_qty = target_amenity.quantity
                    target_amenity.quantity -= covered
                    
                    # Record history
                    history = models.AmenityHistory(
                        amenity_id=target_amenity.id,
                        client_id=db_order.client_id,
                        old_quantity=old_qty,
                        new_quantity=target_amenity.quantity,
                        change=-covered,
                        reason=f"Uso en orden #{db_order.id} ({detail.item_name})"
                    )
                    self.uow.amenity_history.add(history)
                    
                    # Recalculate line subtotal (price only for the part not covered)
                    new_subtotal = (detail.quantity - covered) * detail.unit_price - detail.discount
                    detail.subtotal = max(0.0, new_subtotal)
                    
                    # If it's a room, update the linked booking cost to match
                    if detail.item_type == "room":
                        booking = self.uow.bookings.query().filter(
                            models.Booking.orden_id == db_order.id,
                            models.Booking.room_id == detail.item_id,
                            models.Booking.start_time == detail.start_time,
                            models.Booking.end_time == detail.end_time
                        ).first()
                        if booking:
                            booking.total_cost = detail.subtotal
 
    def _revert_amenities(self, db_order: models.Orden):
        """Returns quantities to client's amenities if an order is cancelled or updated."""
        for detail in db_order.details:
            if detail.amenity_id and detail.amenity_quantity > 0:
                amenity = self.uow.amenities.get(detail.amenity_id)
                if amenity:
                    old_qty = amenity.quantity
                    amenity.quantity += detail.amenity_quantity
                    
                    history = models.AmenityHistory(
                        amenity_id=amenity.id,
                        client_id=amenity.client_id, # Use owner of the amenity
                        old_quantity=old_qty,
                        new_quantity=amenity.quantity,
                        change=detail.amenity_quantity,
                        reason=f"Reversión de orden #{db_order.id} ({detail.item_name})"
                    )
                    self.uow.amenity_history.add(history)
