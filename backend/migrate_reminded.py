from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN reminded_15m BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Successfully added reminded_15m column to bookings.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column reminded_15m already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
