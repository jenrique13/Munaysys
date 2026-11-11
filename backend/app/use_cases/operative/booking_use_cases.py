from datetime import datetime
from typing import Optional, List
from sqlalchemy import and_
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.financial.order_use_cases import OrderUseCases

class BookingUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def check_availability(self, room_id: int, start_time: datetime, end_time: datetime, exclude_id: Optional[int] = None) -> bool:
        """Returns True if the room is available (no overlaps)."""
        q = self.uow.bookings.query().filter(
            models.Booking.room_id == room_id,
            models.Booking.status == "confirmed",
            and_(
                models.Booking.start_time < end_time,
                models.Booking.end_time > start_time,
            )
        )
        if exclude_id:
            q = q.filter(models.Booking.id != exclude_id)
        
        return q.first() is None

    def create(self, booking_in: schemas.operative.booking.BookingCreate):
        # 0. Pessimistic Lock on the Room to prevent concurrent bookings
        room = self.uow.rooms.get_for_update(booking_in.room_id)
        if not room:
            raise ValueError("El aula no existe.")

        # 1. Validation: Overlap
        if not self.check_availability(booking_in.room_id, booking_in.start_time, booking_in.end_time):
            raise ValueError("El aula no está disponible en el horario seleccionado.")

        # 2. Calculate costs

        duration_hours = (booking_in.end_time - booking_in.start_time).total_seconds() / 3600
        duration_hours = max(0.5, round(duration_hours, 2))
        total_cost = duration_hours * room.hourly_rate

        # 3. Create Booking record
        db_booking = models.Booking(
            room_id=booking_in.room_id,
            client_id=booking_in.client_id,
            start_time=booking_in.start_time,
            end_time=booking_in.end_time,
            status=booking_in.status,
            notes=booking_in.notes,
            total_hours=duration_hours,
            total_cost=total_cost,
            service_id=booking_in.service_id,
            created_at=datetime.utcnow()
        )
        self.uow.bookings.add(db_booking)
        self.uow.bookings.flush()

        # 4. Generate Financial Order automatically
        # Note: We use OrderUseCases internally to keep logic consistent
        order_use_case = OrderUseCases(self.uow)
        
        order_in = schemas.financial.order.OrdenCreate(
            client_id=booking_in.client_id,
            branch_id=room.branch_id,
            status="pending",
            details=[
                schemas.financial.pedido.PedidoCreate(
                    item_type="room",
                    item_id=booking_in.room_id,
                    quantity=duration_hours,
                    unit_price=room.hourly_rate,
                    service_id=booking_in.service_id
                )
            ]
        )
        
        db_order = order_use_case.create(order_in)
        db_booking.orden_id = db_order.id

        self.uow.commit()
        self.uow.refresh(db_booking)
        return db_booking
    def update(self, booking_id: int, booking_in: schemas.operative.booking.BookingUpdate) -> Optional[models.Booking]:
        db_booking = self.uow.bookings.get(booking_id)
        if not db_booking:
            return None
        
        # Check availability if time or room changed
        new_room_id = booking_in.room_id or db_booking.room_id
        new_start = booking_in.start_time or db_booking.start_time
        new_end = booking_in.end_time or db_booking.end_time
        
        if booking_in.room_id or booking_in.start_time or booking_in.end_time:
            # 0. Pessimistic Lock on the NEW room to prevent concurrent bookings
            room = self.uow.rooms.get_for_update(new_room_id)
            if not room:
                raise ValueError("El aula no existe.")

            if not self.check_availability(new_room_id, new_start, new_end, exclude_id=booking_id):
                raise ValueError("La sala no está disponible en el nuevo horario seleccionado.")
        
        # Update fields
        for field, value in booking_in.model_dump(exclude_unset=True).items():
            setattr(db_booking, field, value)
            
        # Recalculate duration and cost if needed
        if booking_in.start_time or booking_in.end_time or booking_in.room_id:
            duration_hours = (db_booking.end_time - db_booking.start_time).total_seconds() / 3600
            db_booking.total_hours = max(0.5, round(duration_hours, 2))
            
            room = self.uow.rooms.get(db_booking.room_id)
            if room:
                db_booking.total_cost = db_booking.total_hours * room.hourly_rate
        
        self.uow.commit()
        self.uow.refresh(db_booking)
        return db_booking

    def delete(self, booking_id: int) -> bool:
        db_booking = self.uow.bookings.get(booking_id)
        if not db_booking:
            return False
        
        # If it's linked to an order, we might want to handle it, 
        # but the requirement says "if order is deleted, delete reservation".
        # For deleting reservation directly, we just remove it.
        self.uow.bookings.remove(booking_id)
        self.uow.commit()
        return True
    def update_status(self, booking_id: int, status: str) -> Optional[models.Booking]:
        db_booking = self.uow.bookings.get(booking_id)
        if not db_booking:
            return None
        
        db_booking.status = status
        self.uow.commit()
        self.uow.refresh(db_booking)
        return db_booking

