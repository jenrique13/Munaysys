from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE providers ALTER COLUMN branch_id DROP NOT NULL"))
        conn.commit()
        print("✓ Column branch_id in 'providers' table is now nullable")

if __name__ == "__main__":
    migrate()
