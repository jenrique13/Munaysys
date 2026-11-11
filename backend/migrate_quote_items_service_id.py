from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE quote_items ADD COLUMN service_id INTEGER REFERENCES services(id)"))
            conn.commit()
            print("✓ Column service_id added to quote_items")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    migrate()
