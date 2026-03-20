from sqlalchemy import create_engine, text
from app.config import settings

def update_schema_type():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Connected to PostgreSQL.")
        
        try:
            conn.execute(text("ALTER TABLE users ALTER COLUMN access_permissions TYPE JSON USING access_permissions::json;"))
            print("Successfully altered access_permissions to JSON type.")
        except Exception as e:
            print(f"Error altering column: {e}")

if __name__ == "__main__":
    update_schema_type()
