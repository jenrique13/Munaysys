from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding columns to order_details...")
        try:
            conn.execute(text("ALTER TABLE order_details ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE"))
            conn.execute(text("ALTER TABLE order_details ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE"))
            print("Columns added to order_details successfully.")
        except Exception as e:
            print(f"Error updating order_details: {e}")

        print("Adding columns to bookings...")
        try:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS orden_id INTEGER"))
            print("Columns added to bookings successfully.")
        except Exception as e:
            print(f"Error updating bookings: {e}")
            
        conn.commit()

if __name__ == '__main__':
    migrate()
