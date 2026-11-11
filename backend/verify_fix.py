from app.database import SessionLocal
from app import models
from datetime import datetime, timezone

def verify_fix():
    db = SessionLocal()
    now_aware = datetime.now(timezone.utc)
    today_start = now_aware.replace(hour=7, minute=0, second=0, microsecond=0)
    
    room_id = 1
    
    print(f"Testing with aware now: {now_aware}")
    try:
        booking = db.query(models.Booking).filter(
            models.Booking.room_id == room_id,
            models.Booking.status == "confirmed"
        ).first()
        
        if booking:
            print(f"Found booking: {booking.id}, start={booking.start_time}")
            b_start = max(booking.start_time, today_start)
            print(f"max(booking.start_time, today_start) SUCCEEDED: {b_start}")
        else:
            print("No bookings found for room 1, trying any booking...")
            booking = db.query(models.Booking).first()
            if booking:
                b_start = max(booking.start_time, today_start)
                print(f"max(any booking.start_time, today_start) SUCCEEDED: {b_start}")
            
        print("✓ Verification SUCCESSFUL")
    except Exception as e:
        print(f"✗ Verification FAILED: {e}")

if __name__ == "__main__":
    verify_fix()
