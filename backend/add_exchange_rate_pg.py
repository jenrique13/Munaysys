from sqlalchemy import create_engine, text
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings

def update_db():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect() as conn:
        print("Alterando tabla expenses...")
        try:
            conn.execute(text("ALTER TABLE expenses ADD COLUMN exchange_rate FLOAT NULL"))
            print("OK expenses.exchange_rate")
        except Exception as e:
            print(f"Ya existe o error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE expenses ADD COLUMN exchange_currency VARCHAR DEFAULT 'usd';"))
            print("OK expenses.exchange_currency")
        except Exception as e:
            print(f"Ya existe o error: {e}")

        print("Alterando tabla receipts...")
        try:
            conn.execute(text("ALTER TABLE receipts ADD COLUMN exchange_rate FLOAT NULL;"))
            print("OK receipts.exchange_rate")
        except Exception as e:
            print(f"Ya existe o error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE receipts ADD COLUMN exchange_currency VARCHAR DEFAULT 'usd';"))
            print("OK receipts.exchange_currency")
        except Exception as e:
            print(f"Ya existe o error: {e}")
            
        conn.commit()
    print("Migracion completada")

if __name__ == "__main__":
    update_db()
