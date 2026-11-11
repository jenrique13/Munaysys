import psycopg
from app.config import settings

def migrate():
    # Use the connection URI from settings
    uri = settings.SQLALCHEMY_DATABASE_URI
    # Adjust URI for psycopg (it already uses postgresql+psycopg but we need raw psycopg)
    raw_uri = uri.replace("postgresql+psycopg://", "postgresql://")
    
    try:
        with psycopg.connect(raw_uri) as conn:
            with conn.cursor() as cur:
                print("Adding 'apply_tax' column to 'orders' table...")
                cur.execute("ALTER TABLE orders ADD COLUMN IF NOT EXISTS apply_tax BOOLEAN DEFAULT TRUE;")
                
                print("Adding 'apply_tax' column to 'quotes' table...")
                cur.execute("ALTER TABLE quotes ADD COLUMN IF NOT EXISTS apply_tax BOOLEAN DEFAULT TRUE;")
                
                conn.commit()
                print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
