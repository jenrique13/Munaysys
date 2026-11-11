from app.database import engine
from sqlalchemy import text

def migrate():
    print("Iniciando migración: Añadiendo columna authorized_persons_json a memberships...")
    try:
        with engine.connect() as conn:
            # PostgreSQL command to add column with default empty JSON
            conn.execute(text("ALTER TABLE memberships ADD COLUMN IF NOT EXISTS authorized_persons_json JSON DEFAULT '[]'::json;"))
            conn.commit()
            print("Columna añadida exitosamente.")
    except Exception as e:
        print(f"Error durante la migración: {e}")

if __name__ == "__main__":
    migrate()
