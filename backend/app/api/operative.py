from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user, get_target_branch_id, get_current_client
from app.schemas import operative as schemas
from app.crud import operative as crud

router = APIRouter()

# ── CLIENTS ────────────────────────────────────────────────
@router.get("/clients", response_model=List[schemas.ClientOut])
def read_clients(
    branch_id: Optional[int] = None, skip: int = 0, limit: int = 1000,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    # If branch_id is not specified, we fetch ALL clients (unified view)
    return crud.get_clients(db, branch_id=branch_id, skip=skip, limit=limit, search=search)

@router.get("/clients/me", response_model=schemas.ClientOut)
def read_client_me(
    db: Session = Depends(get_db),
    current_client: models.Client = Depends(get_current_client)
):
    """Retorna el perfil del cliente logueado."""
    return current_client

@router.post("/clients", response_model=schemas.ClientOut)
def create_client(
    client_in: schemas.ClientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    # Check for duplicate ci_rif
    if client_in.ci_rif:
        existing = db.query(models.Client).filter(
            models.Client.ci_rif == client_in.ci_rif, 
            models.Client.status != "deleted"
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un cliente con CI/RIF {client_in.ci_rif}"
            )

    # branch_id is now optional for clients
    if not client_in.branch_id and target_branch_id > 0:
        client_in.branch_id = target_branch_id
    return crud.create_client(db, client_in)

@router.put("/clients/{client_id}", response_model=schemas.ClientOut)
def update_client(
    client_id: int,
    client_in: schemas.ClientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if client_in.ci_rif:
        existing = db.query(models.Client).filter(
            models.Client.ci_rif == client_in.ci_rif, 
            models.Client.id != client_id,
            models.Client.status != "deleted"
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe otro cliente con CI/RIF {client_in.ci_rif}"
            )

    client = crud.update_client(db, client_id=client_id, obj_in=client_in)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


# ── OFFICES ─────────────────────────────────────────────────
@router.get("/offices", response_model=List[schemas.OfficeOut])
def read_offices(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if branch_id is None:
        branch_id = target_branch_id
    return crud.get_offices(db, branch_id=branch_id)

@router.post("/offices", response_model=schemas.OfficeOut)
def create_office(
    office_in: schemas.OfficeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not office_in.branch_id:
        office_in.branch_id = target_branch_id
    return crud.create_office(db, office_in)

@router.put("/offices/{office_id}", response_model=schemas.OfficeOut)
def update_office(
    office_id: int,
    office_in: schemas.OfficeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    office = crud.update_office(db, office_id=office_id, obj_in=office_in)
    if not office:
        raise HTTPException(status_code=404, detail="Oficina no encontrada")
    return office

@router.delete("/offices/{office_id}", status_code=204)
def delete_office(
    office_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud.delete_office(db, office_id)
    if not success:
        raise HTTPException(status_code=404, detail="Oficina no encontrada o no pudo eliminarse")
    return None


# ── ROOMS ───────────────────────────────────────────────────
@router.get("/rooms", response_model=List[schemas.RoomOut])
def read_rooms(
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if branch_id is None:
        branch_id = target_branch_id
    return crud.get_rooms(db, branch_id=branch_id)

@router.post("/rooms", response_model=schemas.RoomOut)
def create_room(
    room_in: schemas.RoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not room_in.branch_id:
        room_in.branch_id = target_branch_id
    return crud.create_room(db, room_in)

@router.put("/rooms/{room_id}", response_model=schemas.RoomOut)
def update_room(
    room_id: int,
    room_in: schemas.RoomUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    room = crud.update_room(db, room_id=room_id, obj_in=room_in)
    if not room:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    return room

@router.delete("/rooms/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud.delete_room(db, room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sala no encontrada o no pudo eliminarse")
    return None


# ── MEMBERSHIPS ─────────────────────────────────────────────
@router.get("/memberships", response_model=List[schemas.MembershipOut])
def read_memberships(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if branch_id is None:
        branch_id = target_branch_id
    return crud.get_memberships(db, client_id=client_id, branch_id=branch_id)

@router.post("/memberships", response_model=schemas.MembershipOut)
def create_membership(
    mem_in: schemas.MembershipCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return crud.create_membership(db, mem_in)

@router.put("/memberships/{membership_id}", response_model=schemas.MembershipOut)
def update_membership(
    membership_id: int,
    mem_in: schemas.MembershipUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    mem = crud.update_membership(db, membership_id=membership_id, obj_in=mem_in)
    if not mem:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")
    return mem

@router.delete("/memberships/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_membership(
    membership_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud.delete_membership(db, membership_id=membership_id)
    if not success:
        raise HTTPException(status_code=404, detail="Membresía no encontrada o no pudo eliminarse")
    return None

# ── AMENITIES ───────────────────────────────────────────────
@router.get("/amenities", response_model=List[schemas.AmenityOut])
def read_amenities(
    branch_id: Optional[int] = None,
    client_id: Optional[int] = None,
    space_id: Optional[int] = None,
    space_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if branch_id is None:
        branch_id = target_branch_id
    return crud.get_amenities(db, branch_id=branch_id, client_id=client_id, space_id=space_id, space_type=space_type)

@router.post("/amenities", response_model=schemas.AmenityOut)
def create_amenity(
    amenity_in: schemas.AmenityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not amenity_in.branch_id:
        amenity_in.branch_id = target_branch_id
    return crud.create_amenity(db, amenity_in)

@router.put("/amenities/{amenity_id}", response_model=schemas.AmenityOut)
def update_amenity(
    amenity_id: int,
    amenity_in: schemas.AmenityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    amenity = crud.update_amenity(db, amenity_id=amenity_id, obj_in=amenity_in)
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenidad no encontrada")
    return amenity


@router.delete("/amenities/{amenity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_amenity(
    amenity_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    success = crud.delete_amenity(db, amenity_id=amenity_id)
    if not success:
        raise HTTPException(status_code=404, detail="Amenidad no encontrada")
    return None


@router.get("/amenity-history", response_model=List[schemas.AmenityHistoryOut])
def read_amenity_history(
    client_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    actual_branch_id = branch_id if branch_id is not None else target_branch_id
    return crud.get_amenity_history(db, client_id=client_id, branch_id=actual_branch_id)

# ── BOOKINGS ─────────────────────────────────────────────────
@router.get("/bookings", response_model=List[schemas.BookingOut])
def read_bookings(
    branch_id: Optional[int] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if branch_id is None:
        branch_id = target_branch_id
    return crud.get_bookings(db, branch_id=branch_id, start=start, end=end)

@router.post("/bookings", response_model=schemas.BookingOut, status_code=201)
def create_booking(
    booking_in: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if booking_in.start_time >= booking_in.end_time:
        raise HTTPException(status_code=400, detail="La hora de inicio debe ser anterior a la de fin")
    if crud.check_booking_overlap(db, booking_in.room_id, booking_in.start_time, booking_in.end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La sala ya tiene una reserva confirmada en ese horario",
        )
    return crud.create_booking(db, booking_in)

@router.put("/bookings/{booking_id}/status", response_model=schemas.BookingOut)
def update_booking_status(
    booking_id: int,
    status_in: schemas.BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    booking = crud.update_booking_status(db, booking_id=booking_id, status=status_in.status)
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return booking


# ── CONTRACT TEMPLATES ──────────────────────────────────────
@router.get("/contract-templates", response_model=List[schemas.ContractTemplateOut])
def read_contract_templates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_contract_templates(db, branch_id=target_branch_id)

@router.get("/contract-templates/by-type/{space_type}", response_model=Optional[schemas.ContractTemplateOut])
def get_template_by_type(
    space_type: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_template_by_space_type(db, space_type=space_type, branch_id=target_branch_id)

@router.post("/contract-templates", response_model=schemas.ContractTemplateOut)
def create_contract_template(
    template_in: schemas.ContractTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not template_in.branch_id:
        template_in.branch_id = target_branch_id or None
    return crud.create_contract_template(db, obj_in=template_in)

@router.put("/contract-templates/{template_id}", response_model=schemas.ContractTemplateOut)
def update_contract_template(
    template_id: int,
    template_in: schemas.ContractTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tmpl = crud.update_contract_template(db, template_id=template_id, obj_in=template_in)
    if not tmpl:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return tmpl

@router.delete("/contract-templates/{template_id}")
def delete_contract_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not crud.delete_contract_template(db, template_id=template_id):
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"ok": True}
