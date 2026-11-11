import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import engine
from sqlalchemy import text

def alter_table():
    with engine.connect() as conn:
        print("Executing ALTER TABLE orders ADD COLUMN igtf_amount FLOAT DEFAULT 0.0;")
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN igtf_amount FLOAT DEFAULT 0.0;"))
            conn.commit()
            print("Successfully altered table.")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("Column igtf_amount already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    alter_table()
