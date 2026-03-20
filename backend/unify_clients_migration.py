import sys
import os

# Add the parent directory to sys.path to import app
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from app.config import settings

# Database connection URL from settings
SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URI

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print(f"Connecting to: {settings.POSTGRES_DB} on {settings.POSTGRES_SERVER}")
        print("Migrating clients table...")
        # Make branch_id nullable
        conn.execute(text("ALTER TABLE clients ALTER COLUMN branch_id DROP NOT NULL;"))
        conn.commit()
        print("Migration complete: branch_id is now nullable in clients table.")

if __name__ == "__main__":
    migrate()
