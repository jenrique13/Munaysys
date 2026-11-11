from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app import models
from app.api import deps
from app.api.deps import get_target_branch_id, get_uow
from app.schemas import operative as schemas
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.operative import BookingUseCases, MembershipUseCases

router = APIRouter()

# --- CLIENTS ---

@router.get("/clients", response_model=List[schemas.ClientOut])
def read_clients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.clients.get_by_branch(target_branch_id, skip=skip, limit=limit, search=search)

@router.post("/clients", response_model=schemas.ClientOut)
def create_client(
    client_in: schemas.ClientCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not client_in.branch_id:
        client_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_client = uow.clients.create(client_in.model_dump())
    uow.commit()
    uow.refresh(db_client)
    return db_client

@router.get("/clients/{client_id}", response_model=schemas.ClientOut)
def read_client(
    client_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    client = uow.clients.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.put("/clients/{client_id}", response_model=schemas.ClientOut)
def update_client(
    client_id: int,
    client_in: schemas.ClientUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_client = uow.clients.get(client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    db_client = uow.clients.update(db_client, client_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_client)
    return db_client

@router.delete("/clients/{client_id}")
def delete_client(
    client_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_client = uow.clients.get(client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    uow.clients.update(db_client, {"status": "inactive"})
    uow.commit()
    return {"ok": True}

# --- SPACES (Offices & Rooms) ---

@router.get("/offices", response_model=List[schemas.OfficeOut])
def read_offices(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.offices.get_by_branch(target_branch_id)

@router.post("/offices", response_model=schemas.OfficeOut)
def create_office(
    office_in: schemas.OfficeCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not office_in.branch_id:
        office_in.branch_id = target_branch_id or current_user.branch_id
    db_office = uow.offices.create(office_in.model_dump())
    uow.commit()
    uow.refresh(db_office)
    return db_office

@router.put("/offices/{office_id}", response_model=schemas.OfficeOut)
def update_office(
    office_id: int,
    office_in: schemas.OfficeUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_office = uow.offices.get(office_id)
    if not db_office:
        raise HTTPException(status_code=404, detail="Office not found")
    db_office = uow.offices.update(db_office, office_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_office)
    return db_office

@router.delete("/offices/{office_id}")
def delete_office(
    office_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_office = uow.offices.get(office_id)
    if not db_office:
        raise HTTPException(status_code=404, detail="Office not found")
    
    # Soft delete
    uow.offices.update(db_office, {"is_active": False})
    uow.commit()
    return {"ok": True}

@router.get("/rooms", response_model=List[schemas.RoomOut])
def read_rooms(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    rooms = uow.rooms.get_by_branch(target_branch_id)
    now = datetime.now(timezone.utc)
    
    # Calculate daily start/end for occupancy (7 AM to 11 PM)
    today_start = now.replace(hour=7, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=0, second=0, microsecond=0)
    business_hours = 16.0  # 23 - 7
    
    results = []
    for room in rooms:
        # Check if currently occupied
        is_occupied = uow.db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status == "confirmed",
            models.Booking.start_time <= now,
            models.Booking.end_time > now
        ).first() is not None
        
        # Calculate today's occupancy % (within 7 AM - 11 PM)
        todays_bookings = uow.db.query(models.Booking).filter(
            models.Booking.room_id == room.id,
            models.Booking.status == "confirmed",
            models.Booking.start_time < today_end,
            models.Booking.end_time > today_start
        ).all()
        
        total_hours_today = 0.0
        for b in todays_bookings:
            # Clamp booking times to business hours
            b_start = max(b.start_time, today_start)
            b_end = min(b.end_time, today_end)
            if b_end > b_start:
                total_hours_today += (b_end - b_start).total_seconds() / 3600
        
        occupancy_pct = (total_hours_today / business_hours) * 100
        
        # RoomOut schema will handle the mapping
        room_data = schemas.RoomOut.from_orm(room)
        room_data.is_occupied = is_occupied
        room_data.occupancy_today_pct = round(min(100.0, occupancy_pct), 2)
        results.append(room_data)
        
    return results

@router.post("/rooms", response_model=schemas.RoomOut)
def create_room(
    room_in: schemas.RoomCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not room_in.branch_id:
        room_in.branch_id = target_branch_id or current_user.branch_id
    db_room = uow.rooms.create(room_in.model_dump())
    uow.commit()
    uow.refresh(db_room)
    # We return standard RoomOut, defaults for derived fields will be handled by schema
    return schemas.RoomOut.from_orm(db_room)

@router.put("/rooms/{room_id}", response_model=schemas.RoomOut)
def update_room(
    room_id: int,
    room_in: schemas.RoomUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_room = uow.rooms.get(room_id)
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    db_room = uow.rooms.update(db_room, room_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_room)
    return schemas.RoomOut.from_orm(db_room)

@router.delete("/rooms/{room_id}")
def delete_room(
    room_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_room = uow.rooms.get(room_id)
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Soft delete
    uow.rooms.update(db_room, {"is_active": False})
    uow.commit()
    return {"ok": True}

# --- MEMBERSHIPS ---

@router.get("/memberships", response_model=List[schemas.MembershipOut])
def read_memberships(
    client_id: Optional[int] = None,
    uow: UnitOfWork = Depends(get_uow),
):
    if client_id:
        return uow.memberships.get_by_client(client_id)
    return uow.memberships.get_multi()

@router.post("/memberships", response_model=schemas.MembershipOut)
def create_membership(
    membership_in: schemas.MembershipCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = MembershipUseCases(uow)
    return use_case.create(membership_in)

@router.delete("/memberships/{membership_id}")
def cancel_membership(
    membership_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = MembershipUseCases(uow)
    if not use_case.cancel(membership_id):
        raise HTTPException(status_code=404, detail="Membership not found")
    return {"ok": True}

@router.put("/memberships/{membership_id}", response_model=schemas.MembershipOut)
def update_membership(
    membership_id: int,
    membership_in: schemas.MembershipUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = MembershipUseCases(uow)
    try:
        return use_case.update(membership_id, membership_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- AMENITIES ---

@router.get("/amenities", response_model=List[schemas.AmenityOut])
def read_amenities(
    client_id: Optional[int] = None,
    space_id: Optional[int] = None,
    space_type: Optional[str] = None,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.amenities.get_filtered(
        branch_id=target_branch_id,
        client_id=client_id,
        space_id=space_id,
        space_type=space_type
    )

@router.post("/amenities", response_model=schemas.AmenityOut)
def create_amenity(
    amenity_in: schemas.AmenityCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not amenity_in.branch_id:
        amenity_in.branch_id = target_branch_id or current_user.branch_id
    db_amenity = uow.amenities.create(amenity_in.model_dump())
    uow.commit()
    uow.refresh(db_amenity)
    return db_amenity

@router.put("/amenities/{amenity_id}", response_model=schemas.AmenityOut)
def update_amenity(
    amenity_id: int,
    amenity_in: schemas.AmenityUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    db_amenity = uow.amenities.get(amenity_id)
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    old_qty = db_amenity.quantity
    new_qty = amenity_in.quantity if amenity_in.quantity is not None else old_qty
    
    # Update fields
    db_amenity = uow.amenities.update(db_amenity, amenity_in.model_dump(exclude_unset=True))
    
    # Record history if quantity changed
    if new_qty != old_qty:
        history = models.AmenityHistory(
            amenity_id=db_amenity.id,
            client_id=db_amenity.client_id,
            old_quantity=old_qty,
            new_quantity=new_qty,
            change=new_qty - old_qty,
            reason=f"Ajuste manual por {current_user.email}"
        )
        uow.db.add(history)
        
    uow.commit()
    uow.refresh(db_amenity)
    return db_amenity

@router.delete("/amenities/{amenity_id}")
def delete_amenity(
    amenity_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    db_amenity = uow.amenities.get(amenity_id)
    if not db_amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    try:
        # Soft delete: set is_active to False
        uow.amenities.update(db_amenity, {"is_active": False})
        uow.commit()
    except Exception as e:
        uow.rollback()
        raise HTTPException(status_code=400, detail=f"No se pudo eliminar: {str(e)}")
    
    return {"ok": True}
@router.get("/amenity-history", response_model=List[schemas.AmenityHistoryOut])
def read_amenity_history(
    client_id: Optional[int] = None,
    uow: UnitOfWork = Depends(get_uow),
):
    if client_id:
        return uow.amenity_history.get_by_client(client_id)
    return uow.amenity_history.get_multi()

# --- AMENITY TEMPLATES ---

@router.get("/amenity-templates", response_model=List[schemas.AmenityTemplateOut])
def read_amenity_templates(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.amenity_templates.get_by_branch(target_branch_id)

@router.post("/amenity-templates", response_model=schemas.AmenityTemplateOut)
def create_amenity_template(
    template_in: schemas.AmenityTemplateCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    # Manual creation of items to handle relationships
    items_data = template_in.items
    template_dict = template_in.model_dump(exclude={"items"})
    
    db_template = models.AmenityTemplate(**template_dict)
    uow.db.add(db_template)
    uow.db.flush()
    
    for item in items_data:
        db_item = models.AmenityTemplateItem(
            template_id=db_template.id,
            service_id=item.service_id,
            quantity=item.quantity
        )
        uow.db.add(db_item)
    
    uow.commit()
    uow.refresh(db_template)
    return db_template

@router.put("/amenity-templates/{template_id}", response_model=schemas.AmenityTemplateOut)
def update_amenity_template(
    template_id: int,
    template_in: schemas.AmenityTemplateUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_template = uow.amenity_templates.get(template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_data = template_in.model_dump(exclude_unset=True, exclude={"items"})
    uow.amenity_templates.update(db_template, update_data)
    
    if template_in.items is not None:
        # Recreate items (simple approach)
        uow.db.query(models.AmenityTemplateItem).filter(models.AmenityTemplateItem.template_id == template_id).delete()
        for item in template_in.items:
            db_item = models.AmenityTemplateItem(
                template_id=template_id,
                service_id=item.service_id,
                quantity=item.quantity
            )
            uow.db.add(db_item)
            
    uow.commit()
    uow.refresh(db_template)
    return db_template

@router.delete("/amenity-templates/{template_id}")
def delete_amenity_template(
    template_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_template = uow.amenity_templates.get(template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    uow.amenity_templates.remove(template_id)
    uow.commit()
    return {"ok": True}

# --- BOOKINGS ---

@router.get("/bookings", response_model=List[schemas.BookingOut])
def read_bookings(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    # For now, simple branch filtering - logic could be moved to BookingUseCases
    return uow.bookings.get_multi() # Real implementation should filter

@router.post("/bookings", response_model=schemas.BookingOut)
def create_booking(
    booking_in: schemas.BookingCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = BookingUseCases(uow)
    try:
        return use_case.create(booking_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/bookings/{booking_id}", response_model=schemas.BookingOut)
def update_booking(
    booking_id: int,
    booking_in: schemas.BookingUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    # Role check: Super Administrador, Gerente, Ventas
    privileged_roles = ["Super Administrador", "Gerente", "Ventas"]
    is_privileged = current_user.is_superuser or (current_user.role and current_user.role.name in privileged_roles)
    
    if not is_privileged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para editar reservas completas. Solo roles de Ventas, Gerencia o Super Admin pueden realizar esta acción."
        )

    use_case = BookingUseCases(uow)
    try:
        booking = use_case.update(booking_id, booking_in)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/bookings/{booking_id}")
def delete_booking(
    booking_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    # Role check: Super Administrador, Gerente, Ventas
    privileged_roles = ["Super Administrador", "Gerente", "Ventas"]
    is_privileged = current_user.is_superuser or (current_user.role and current_user.role.name in privileged_roles)
    
    if not is_privileged:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar reservas. Solo roles de Ventas, Gerencia o Super Admin pueden realizar esta acción."
        )
        
    use_case = BookingUseCases(uow)
    if not use_case.delete(booking_id):
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}

# --- CONTRACT TEMPLATES ---
@router.put("/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    status_data: dict,
    uow: UnitOfWork = Depends(get_uow),
):
    status = status_data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
        
    use_case = BookingUseCases(uow)
    booking = use_case.update_status(booking_id, status)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.get("/contract-templates", response_model=List[schemas.ContractTemplateOut])
def read_contract_templates(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.contract_templates.get_by_branch(target_branch_id)

@router.post("/contract-templates", response_model=schemas.ContractTemplateOut)
def create_contract_template(
    template_in: schemas.ContractTemplateCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not template_in.branch_id:
        template_in.branch_id = target_branch_id or current_user.branch_id
    
    db_template = uow.contract_templates.create(template_in.model_dump())
    uow.commit()
    uow.refresh(db_template)
    return db_template

@router.put("/contract-templates/{template_id}", response_model=schemas.ContractTemplateOut)
def update_contract_template(
    template_id: int,
    template_in: schemas.ContractTemplateUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_template = uow.contract_templates.get(template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db_template = uow.contract_templates.update(db_template, template_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_template)
    return db_template

@router.delete("/contract-templates/{template_id}")
def delete_contract_template(
    template_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_template = uow.contract_templates.get(template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    uow.contract_templates.remove(template_id)
    uow.commit()
    return {"ok": True}


# --- CATALOGS (Space Categories & Room Types) ---

@router.get("/space-categories", response_model=List[schemas.SpaceCategoryOut])
def read_space_categories(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.space_categories.get_by_branch(target_branch_id)

@router.post("/space-categories", response_model=schemas.SpaceCategoryOut)
def create_space_category(
    item_in: schemas.SpaceCategoryCreate,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not item_in.branch_id:
        item_in.branch_id = target_branch_id
    db_item = uow.space_categories.create(item_in.model_dump())
    uow.commit()
    uow.refresh(db_item)
    return db_item

@router.put("/space-categories/{item_id}", response_model=schemas.SpaceCategoryOut)
def update_space_category(
    item_id: int,
    item_in: schemas.SpaceCategoryUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_item = uow.space_categories.get(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item = uow.space_categories.update(db_item, item_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_item)
    return db_item

@router.delete("/space-categories/{item_id}")
def delete_space_category(
    item_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_item = uow.space_categories.get(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    uow.space_categories.remove(item_id)
    uow.commit()
    return {"ok": True}

@router.get("/room-types", response_model=List[schemas.RoomTypeOut])
def read_room_types(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.room_types.get_by_branch(target_branch_id)

@router.post("/room-types", response_model=schemas.RoomTypeOut)
def create_room_type(
    item_in: schemas.RoomTypeCreate,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not item_in.branch_id:
        item_in.branch_id = target_branch_id
    db_item = uow.room_types.create(item_in.model_dump())
    uow.commit()
    uow.refresh(db_item)
    return db_item

@router.put("/room-types/{item_id}", response_model=schemas.RoomTypeOut)
def update_room_type(
    item_id: int,
    item_in: schemas.RoomTypeUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_item = uow.room_types.get(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    db_item = uow.room_types.update(db_item, item_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_item)
    return db_item

@router.delete("/room-types/{item_id}")
def delete_room_type(
    item_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_item = uow.room_types.get(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    uow.room_types.remove(item_id)
    uow.commit()
    return {"ok": True}

