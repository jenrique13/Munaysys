from sqlalchemy import create_engine, text
from app.config import settings

def set_superuser():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Connected to PostgreSQL.")
        try:
            conn.execute(text("UPDATE users SET is_superuser = TRUE, access_permissions = '{\"crm\": true, \"operative\": true, \"financial\": true, \"configuration\": true}' WHERE email = 'admin3@munaysys.com'"))
            print("Successfully updated admin3@munaysys.com to superuser.")
        except Exception as e:
            print(f"Error updating admin3: {e}")

if __name__ == "__main__":
    set_superuser()
