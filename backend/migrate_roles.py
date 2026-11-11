from sqlalchemy import create_engine, text
from app.config import settings
import json

def seed_roles_and_branches():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("Connected to PostgreSQL.")
        
        # 1. Update branches table to ensure color exists
        try:
            conn.execute(text("ALTER TABLE branches ADD COLUMN color VARCHAR DEFAULT '#4F46E5'"))
            print("Added color column to branches.")
        except Exception as e:
            print(f"Color column might already exist: {e}")

        # 2. Seed Roles
        roles = [
            ("Operador", {"crm": False, "operative": True, "financial": "limited", "configuration": False}),
            ("Coordinador", {"crm": False, "operative": True, "financial": True, "configuration": False}),
            ("Ventas", {"crm": True, "operative": False, "financial": False, "configuration": False}),
            ("Gerente", {"crm": True, "operative": True, "financial": True, "configuration": True})
        ]
        
        for name, perms in roles:
            exists = conn.execute(text("SELECT id FROM roles WHERE name = :n"), {"n": name}).first()
            if not exists:
                conn.execute(text("INSERT INTO roles (name, permissions_json) VALUES (:n, :p)"), 
                             {"n": name, "p": json.dumps(perms)})
                print(f"Role '{name}' created.")
            else:
                conn.execute(text("UPDATE roles SET permissions_json = :p WHERE name = :n"), 
                             {"n": name, "p": json.dumps(perms)})
                print(f"Role '{name}' updated.")

        # 3. Ensure at least one Branch exists for testing
        branch_exists = conn.execute(text("SELECT id FROM branches LIMIT 1")).first()
        if not branch_exists:
            conn.execute(text("INSERT INTO branches (name, address, color, is_active) VALUES ('Sede Principal', 'Calle Demo 123', '#4F46E5', TRUE)"))
            print("Default branch 'Sede Principal' created.")

if __name__ == "__main__":
    seed_roles_and_branches()
