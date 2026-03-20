import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def migrate_spaces_status():
    with engine.begin() as conn:
        print("Checking if 'status' column exists in 'offices' table...")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='offices' and column_name='status'"))
        if not result.fetchone():
            print("Adding 'status' column to 'offices' table...")
            conn.execute(text("ALTER TABLE offices ADD COLUMN status VARCHAR DEFAULT 'disponible'"))
            print("Done.")

        print("Checking if 'status' column exists in 'rooms' table...")
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='rooms' and column_name='status'"))
        if not result.fetchone():
            print("Adding 'status' column to 'rooms' table...")
            conn.execute(text("ALTER TABLE rooms ADD COLUMN status VARCHAR DEFAULT 'disponible'"))
            print("Done.")

if __name__ == "__main__":
    migrate_spaces_status()
