from sqlalchemy import create_engine, text
from app.config import settings
from app.core import security
import json

def setup_recepcion():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Connected to PostgreSQL.")
        
        # Check if user exists
        result = conn.execute(text("SELECT id FROM users WHERE email = 'recepcion@munaysys.com'")).first()
        
        password_hash = security.get_password_hash("Caracas2026**")
        permissions = json.dumps({"operative": True})
        
        if result:
            print("User recepcion@munaysys.com already exists. Updating permissions.")
            conn.execute(text("UPDATE users SET access_permissions = :p, is_active = TRUE, password_hash = :h WHERE id = :id"), 
                         {"p": permissions, "h": password_hash, "id": result[0]})
        else:
            print("Creating user recepcion@munaysys.com.")
            # Status: active or similar? Looking at check_schema.py out: status is varchar
            # Looking at auth.py: user.status != "active"
            conn.execute(text("INSERT INTO users (email, password_hash, status, is_active, is_superuser, access_permissions) VALUES (:e, :h, 'active', TRUE, FALSE, :p)"),
                         {"e": "recepcion@munaysys.com", "h": password_hash, "p": permissions})
            print("Successfully created recepcion@munaysys.com.")

if __name__ == "__main__":
    setup_recepcion()
