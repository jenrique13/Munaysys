import logging
from sqlalchemy import text
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        logger.info("Creating amenity_history table...")
        
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS amenity_history (
            id SERIAL PRIMARY KEY,
            amenity_id INTEGER NOT NULL REFERENCES amenities(id),
            client_id INTEGER NOT NULL REFERENCES clients(id),
            old_quantity FLOAT NOT NULL,
            new_quantity FLOAT NOT NULL,
            change FLOAT NOT NULL,
            reason VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        try:
            conn.execute(text(create_table_sql))
            conn.commit()
            logger.info("✓ Table 'amenity_history' created successfully.")
        except Exception as e:
            logger.error(f"Error creating 'amenity_history' table: {e}")

if __name__ == "__main__":
    migrate()
