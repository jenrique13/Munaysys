from sqlalchemy import create_engine, text
from app.config import settings

def update_schema():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Connected to PostgreSQL.")
        
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            print("is_active added to users.")
        except Exception as e:
            print(f"Error adding is_active to users: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN DEFAULT FALSE"))
            print("is_superuser added to users.")
        except Exception as e:
            print(f"Error adding is_superuser to users: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN access_permissions VARCHAR NULL"))
            print("access_permissions added to users.")
        except Exception as e:
            print(f"Error adding access_permissions to users: {e}")

        try:
            conn.execute(text("ALTER TABLE branches ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            print("is_active added to branches.")
        except Exception as e:
            print(f"Error adding is_active to branches: {e}")

    print("PostgreSQL Database schema updated successfully.")

if __name__ == "__main__":
    update_schema()
