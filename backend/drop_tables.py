import sys
import os
from sqlalchemy import create_engine, text

# Path setup
sys.path.append(os.getcwd())

from app.config import settings

def drop_tables():
    try:
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
        print(f"Connecting to {settings.SQLALCHEMY_DATABASE_URI}...")
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS quote_items CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS quotes CASCADE"))
            conn.commit()
            print("Tables 'quote_items' and 'quotes' dropped successfully.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    drop_tables()
