from app.database import engine
from sqlalchemy import text

def run():
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE quotes ADD COLUMN discount_type VARCHAR DEFAULT 'amount'"))
            print("Migration successful")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
