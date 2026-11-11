import logging
from datetime import datetime, timedelta, timezone
from app.database import SessionLocal
from app import models
from app.uow.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)

async def process_booking_reminders():
    """
    Check for bookings starting in ~15 minutes and create notifications for Operador and Ventas.
    """
    db = SessionLocal()
    uow = UnitOfWork(db)
    
    # We look for bookings starting between now+10m and now+20m
    # Using UTC for consistency if DB stores UTC, but let's check app timezone
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(minutes=10)
    window_end = now + timedelta(minutes=20)
    
    try:
        # Query bookings that are confirmed and in the window, not yet reminded
        upcoming_bookings = uow.bookings.db.query(models.Booking).filter(
            models.Booking.status == "confirmed",
            models.Booking.start_time >= window_start,
            models.Booking.start_time <= window_end,
            models.Booking.reminded_15m == False
        ).all()
        
        from zoneinfo import ZoneInfo
        caracas_tz = ZoneInfo("America/Caracas")
        
        for booking in upcoming_bookings:
            room_name = booking.room.name if booking.room else "Sala"
            # Format time (adjust to America/Caracas local time)
            local_time = booking.start_time.astimezone(caracas_tz)
            start_time_str = local_time.strftime("%I:%M %p") # Use 12h format with AM/PM for clarity
            notes = booking.notes if booking.notes else "Sin notas adicionales."
            
            message = f"La reserva en {room_name} inicia a las {start_time_str}. Notas: {notes}"
            
            notification = models.Notification(
                target_roles="operador,ventas", # Lowercase for repository matching
                branch_id=booking.room.branch_id if booking.room else None,
                title="Recordatorio de Reserva (15m)",
                message=message,
                is_read=False,
                created_at=datetime.now(timezone.utc)
            )
            
            uow.db.add(notification)
            booking.reminded_15m = True
            
        uow.commit()
        if upcoming_bookings:
            logger.info(f"Generated {len(upcoming_bookings)} booking reminders.")
            
    except Exception as e:
        logger.error(f"Error processing booking reminders: {str(e)}")
        uow.rollback()
    finally:
        db.close()
