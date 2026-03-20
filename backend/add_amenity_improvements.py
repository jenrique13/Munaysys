import logging
from sqlalchemy import text
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        logger.info("Starting database migration for Amenity improvements...")
        
        # 1. Add is_amenity to services
        try:
            logger.info("Adding 'is_amenity' column to 'services' table...")
            conn.execute(text("ALTER TABLE services ADD COLUMN IF NOT EXISTS is_amenity BOOLEAN DEFAULT FALSE"))
            conn.commit()
            logger.info("✓ Column 'is_amenity' added successfully (or already exists).")
        except Exception as e:
            logger.error(f"Error adding 'is_amenity' to 'services': {e}")

        # 2. Add monthly_quota to amenities
        try:
            logger.info("Adding 'monthly_quota' column to 'amenities' table...")
            conn.execute(text("ALTER TABLE amenities ADD COLUMN IF NOT EXISTS monthly_quota INTEGER DEFAULT 0"))
            conn.commit()
            logger.info("✓ Column 'monthly_quota' added successfully (or already exists).")
        except Exception as e:
            logger.error(f"Error adding 'monthly_quota' to 'amenities': {e}")

        logger.info("Migration complete.")

if __name__ == "__main__":
    migrate()
