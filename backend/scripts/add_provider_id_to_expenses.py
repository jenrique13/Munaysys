from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        print("Adding provider_id column to expenses table...")
        try:
            # Check if column already exists to avoid errors on reapplying
            # In PostgreSQL we can use a more robust check if needed, 
            # but try/except block is simple enough for this manual fix.
            conn.execute(text("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL"))
            print("Successfully added (or already exists) provider_id column.")
        except Exception as e:
            print(f"Error adding column: {e}")

if __name__ == "__main__":
    migrate()
