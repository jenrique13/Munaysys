from app.database import SessionLocal
from app import models
from datetime import datetime, timedelta
from app.crud.financial import update_document_payment_status

def test_booking():
    db = SessionLocal()
    try:
        # Get existing client and room
        client = db.query(models.Client).filter(models.Client.is_active == True if hasattr(models.Client, 'is_active') else True).first()
        room = db.query(models.Room).filter(models.Room.is_active == True).first()
        if not client or not room:
            print("Error: No client or room found in DB")
            return

        print(f"Testing with Client: {client.name} (ID: {client.id}), Room: {room.name} (ID: {room.id})")
        
        # 1. Create Order
        start = datetime.now() + timedelta(days=1)
        end = start + timedelta(hours=2)
        total_price = room.hourly_rate * 2
        
        order = models.Orden(
            client_id=client.id, 
            branch_id=client.branch_id, 
            date=datetime.now(),
            subtotal=total_price, 
            discount=0, 
            tax=0, 
            total=total_price, 
            status='pending'
        )
        db.add(order)
        db.flush() # Get ID
        
        # 2. Add Detail (Sala)
        detail = models.Pedido(
            orden_id=order.id, 
            item_type='room', 
            item_id=room.id, 
            quantity=1, 
            unit_price=room.hourly_rate, 
            discount=0, 
            subtotal=total_price, 
            start_time=start, 
            end_time=end
        )
        db.add(detail)
        db.commit()
        print(f"Order created: {order.id} with total {total_price}")

        # 3. Create Receipt (Payment)
        print(f"Creating receipt for order {order.id}...")
        receipt = models.Receipt(
            orden_id=order.id,
            client_id=client.id,
            amount=total_price,
            date=datetime.now(),
            type="income",
            payment_method="Efectivo"
        )
        db.add(receipt)
        db.commit()

        # 4. Trigger Update
        print(f"Triggering status update for order {order.id}...")
        update_document_payment_status(db, models.Orden, order.id)
        db.commit()
        
        # 5. Verification
        db.refresh(order)
        db.refresh(room)
        booking = db.query(models.Booking).filter(models.Booking.orden_id == order.id).first()
        
        if booking:
            print(f"SUCCESS: Booking created (ID: {booking.id})")
            print(f"Booking Start: {booking.start_time}, End: {booking.end_time}")
            print(f"Room status: {room.status}")
        else:
            print("FAILURE: No booking found for this order")
            # Check for any booking to see if it was created without orden_id
            any_booking = db.query(models.Booking).filter(models.Booking.room_id == room.id).order_by(models.Booking.id.desc()).first()
            if any_booking:
                print(f"Latest booking for this room is ID: {any_booking.id}, OrderID: {any_booking.orden_id}")
            
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == '__main__':
    test_booking()
