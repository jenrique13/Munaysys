from sqlalchemy.orm import Session
from sqlalchemy import and_
from app import models
from app.schemas import operative as schemas
from datetime import datetime


# ── CLIENTS ────────────────────────────────────────────────
def get_clients(db: Session, branch_id: Optional[int] = None, skip: int = 0, limit: int = 100, search: Optional[str] = None):
    # Base query for clients
    q = db.query(models.Client)
    
    if branch_id and branch_id > 0:
        q = q.filter(models.Client.branch_id == branch_id)
    
    if search:
        from sqlalchemy import or_
        search_filter = f"%{search}%"
        q = q.filter(
            or_(
                models.Client.name.ilike(search_filter),
                models.Client.email.ilike(search_filter),
                models.Client.ci_rif.ilike(search_filter)
            )
        )

    # Filter out deleted and sort
    q = q.filter(models.Client.status != "deleted").order_by(models.Client.name.asc())
    
    clients = q.offset(skip).limit(limit).all()
    
    # Enrich with active membership info efficiently
    for client in clients:
        active_mem = db.query(models.Membership).filter(
            models.Membership.client_id == client.id,
            models.Membership.status == "active"
        ).first()
        if active_mem:
            client.active_membership_name = active_mem.plan_name
            client.has_active_membership = True
        else:
            client.active_membership_name = None
            client.has_active_membership = False
            
    return clients

def get_client(db: Session, client_id: int):
    return db.query(models.Client).filter(models.Client.id == client_id).first()

def create_client(db: Session, obj_in: schemas.ClientCreate):
    db_obj = models.Client(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_client(db: Session, client_id: int, obj_in: schemas.ClientUpdate):
    db_obj = db.query(models.Client).filter(models.Client.id == client_id).first()
    if db_obj:
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj


# ── OFFICES ─────────────────────────────────────────────────
def get_offices(db: Session, branch_id: int):
    q = db.query(models.Office)
    if branch_id > 0:
        q = q.filter(models.Office.branch_id == branch_id)
    return (
        q.order_by(models.Office.category.asc(), models.Office.name.asc())
        .all()
    )

def create_office(db: Session, obj_in: schemas.OfficeCreate):
    db_obj = models.Office(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_office(db: Session, office_id: int, obj_in: schemas.OfficeUpdate):
    db_obj = db.query(models.Office).filter(models.Office.id == office_id).first()
    if db_obj:
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_office(db: Session, office_id: int):
    db_obj = db.query(models.Office).filter(models.Office.id == office_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


# ── ROOMS ───────────────────────────────────────────────────
def get_rooms(db: Session, branch_id: int):
    q = db.query(models.Room)
    if branch_id > 0:
        q = q.filter(models.Room.branch_id == branch_id)
    return (
        q.order_by(models.Room.name.asc())
        .all()
    )

def create_room(db: Session, obj_in: schemas.RoomCreate):
    db_obj = models.Room(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_room(db: Session, room_id: int, obj_in: schemas.RoomUpdate):
    db_obj = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_obj:
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_room(db: Session, room_id: int):
    db_obj = db.query(models.Room).filter(models.Room.id == room_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


# ── MEMBERSHIPS ─────────────────────────────────────────────
def get_memberships(db: Session, client_id: int = None, branch_id: int = None):
    q = db.query(models.Membership).join(models.Client)
    if branch_id and branch_id > 0:
        q = q.filter(models.Client.branch_id == branch_id)
    if client_id:
        q = q.filter(models.Membership.client_id == client_id)
    return q.order_by(models.Membership.created_at.desc()).all()

def get_active_membership(db: Session, client_id: int):
    return (
        db.query(models.Membership)
        .filter(models.Membership.client_id == client_id)
        .filter(models.Membership.status == "active")
        .first()
    )

def create_membership(db: Session, obj_in: schemas.MembershipCreate):
    db_obj = models.Membership(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_membership(db: Session, membership_id: int, obj_in: schemas.MembershipUpdate):
    db_obj = db.query(models.Membership).filter(models.Membership.id == membership_id).first()
    if db_obj:
        for key, value in obj_in.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_membership(db: Session, membership_id: int):
    db_obj = db.query(models.Membership).filter(models.Membership.id == membership_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

# ── AMENITIES ───────────────────────────────────────────────
def get_amenities(db: Session, branch_id: int, client_id: int = None, space_id: int = None, space_type: str = None):
    q = db.query(models.Amenity)
    if branch_id > 0:
        q = q.filter(models.Amenity.branch_id == branch_id)
    if client_id:
        q = q.filter(models.Amenity.client_id == client_id)
    if space_id and space_type:
        q = q.filter(models.Amenity.space_id == space_id, models.Amenity.space_type == space_type)
    return q.all()

def create_amenity(db: Session, obj_in: schemas.AmenityCreate):
    db_obj = models.Amenity(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_amenity(db: Session, amenity_id: int, obj_in: schemas.AmenityUpdate):
    db_obj = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if db_obj:
        old_q = db_obj.quantity
        update_data = obj_in.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        if "quantity" in update_data:
            new_q = update_data["quantity"]
            if old_q != new_q:
                history = models.AmenityHistory(
                    amenity_id=db_obj.id,
                    client_id=db_obj.client_id,
                    old_quantity=old_q,
                    new_quantity=new_q,
                    change=new_q - old_q,
                    reason="Ajuste manual"
                )
                db.add(history)
                
        db.commit()
        db.refresh(db_obj)
    return db_obj

def get_amenity_history(db: Session, client_id: int = None, branch_id: int = None):
    q = db.query(models.AmenityHistory).join(models.Amenity)
    if client_id:
        q = q.filter(models.AmenityHistory.client_id == client_id)
    if branch_id:
        q = q.filter(models.Amenity.branch_id == branch_id)
    return q.order_by(models.AmenityHistory.created_at.desc()).all()


def delete_amenity(db: Session, amenity_id: int):
    db_obj = db.query(models.Amenity).filter(models.Amenity.id == amenity_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False


# ── BOOKINGS ─────────────────────────────────────────────────
def check_booking_overlap(db: Session, room_id: int, start_time: datetime, end_time: datetime, exclude_id: int = None):
    """Returns True if there is an overlapping confirmed booking."""
    q = (
        db.query(models.Booking)
        .filter(models.Booking.room_id == room_id)
        .filter(models.Booking.status == "confirmed")
        .filter(
            and_(
                models.Booking.start_time < end_time,
                models.Booking.end_time > start_time,
            )
        )
    )
    if exclude_id:
        q = q.filter(models.Booking.id != exclude_id)
    return q.first() is not None

def get_bookings(db: Session, branch_id: int, start: datetime = None, end: datetime = None):
    q = db.query(models.Booking).join(models.Room)
    if branch_id > 0:
        q = q.filter(models.Room.branch_id == branch_id)
    if start:
        q = q.filter(models.Booking.start_time >= start)
    if end:
        q = q.filter(models.Booking.end_time <= end)
    return q.order_by(models.Booking.start_time.asc()).all()

def create_booking(db: Session, obj_in: schemas.BookingCreate):
    # Calculate derived fields
    duration = (obj_in.end_time - obj_in.start_time).total_seconds() / 3600
    duration = round(duration, 2)
    
    room = db.query(models.Room).filter(models.Room.id == obj_in.room_id).first()
    hourly_rate = room.hourly_rate if room else 0
    
    # ── GENERATE ORDER AUTOMATICALLY ──────────────────────────
    # Delegamos el cálculo de costo y deducción de amenidades al módulo financiero
    from app.crud import financial
    from app.schemas import financial as financial_schemas
    
    order_in = financial_schemas.OrdenCreate(
        client_id=obj_in.client_id,
        branch_id=room.branch_id if room else 0,
        discount=0.0,
        discount_type="amount",
        status="pending", # create_order will set to "paid" if total is 0
        details=[
            financial_schemas.PedidoCreate(
                item_type="room",
                item_id=obj_in.room_id,
                quantity=duration,
                unit_price=hourly_rate,
                discount=0.0,
                start_time=obj_in.start_time,
                end_time=obj_in.end_time
            )
        ]
    )
    
    db_order = financial.create_order(db, order_in)

    db_obj = models.Booking(
        **obj_in.model_dump(),
        total_hours=duration,
        total_cost=db_order.total,
        orden_id=db_order.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    return db_obj

def update_booking_status(db: Session, booking_id: int, status: str):
    db_obj = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if db_obj:
        db_obj.status = status
        db.commit()
        db.refresh(db_obj)
    return db_obj


# ── CONTRACT TEMPLATES ──────────────────────────────────────
def get_contract_templates(db: Session, branch_id: int = None):
    q = db.query(models.ContractTemplate).filter(models.ContractTemplate.is_active == True)
    if branch_id and branch_id > 0:
        # return branch-specific first, then global (branch_id=None) as fallback
        q = q.filter(
            (models.ContractTemplate.branch_id == branch_id) |
            (models.ContractTemplate.branch_id == None)
        )
    return q.order_by(models.ContractTemplate.space_type.asc()).all()

def get_contract_template(db: Session, template_id: int):
    return db.query(models.ContractTemplate).filter(models.ContractTemplate.id == template_id).first()

def get_template_by_space_type(db: Session, space_type: str, branch_id: int = None):
    """Get the most specific template for a given space_type (branch > global)."""
    q = db.query(models.ContractTemplate).filter(
        models.ContractTemplate.space_type == space_type,
        models.ContractTemplate.is_active == True
    )
    if branch_id:
        branch_tpl = q.filter(models.ContractTemplate.branch_id == branch_id).first()
        if branch_tpl:
            return branch_tpl
    # Fall back to global template
    return q.filter(models.ContractTemplate.branch_id == None).first()

def create_contract_template(db: Session, obj_in: schemas.ContractTemplateCreate):
    db_obj = models.ContractTemplate(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_contract_template(db: Session, template_id: int, obj_in: schemas.ContractTemplateUpdate):
    db_obj = db.query(models.ContractTemplate).filter(models.ContractTemplate.id == template_id).first()
    if not db_obj:
        return None
    for k, v in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, k, v)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_contract_template(db: Session, template_id: int):
    db_obj = db.query(models.ContractTemplate).filter(models.ContractTemplate.id == template_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
