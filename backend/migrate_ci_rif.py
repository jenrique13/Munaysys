from app.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding ci_rif column to leads...")
        try:
            conn.execute(text("ALTER TABLE leads ADD COLUMN IF NOT EXISTS ci_rif VARCHAR"))
            print("Column ci_rif added to leads successfully.")
        except Exception as e:
            print(f"Error updating leads: {e}")

        print("Adding ci_rif column to clients...")
        try:
            conn.execute(text("ALTER TABLE clients ADD COLUMN IF NOT EXISTS ci_rif VARCHAR"))
            print("Column ci_rif added to clients successfully.")
        except Exception as e:
            print(f"Error updating clients: {e}")
            
        conn.commit()

if __name__ == '__main__':
    migrate()
