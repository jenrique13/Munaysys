import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import engine
from sqlalchemy import text

def alter_table():
    with engine.connect() as conn:
        print("Executing ALTER TABLE order_audit_logs ALTER COLUMN orden_id DROP NOT NULL;")
        try:
            conn.execute(text("ALTER TABLE order_audit_logs ALTER COLUMN orden_id DROP NOT NULL;"))
            conn.commit()
            print("Successfully altered table.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    alter_table()
