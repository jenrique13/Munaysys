
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from app.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

def cleanup():
    with engine.connect() as conn:
        print("Cleaning up invalid emails in clients table...")
        
        # Replace 'None' string with NULL
        res1 = conn.execute(text("UPDATE clients SET email = NULL WHERE email = 'None';"))
        print(f"Updated {res1.rowcount} records where email was 'None'.")
        
        # Replace empty string with NULL
        res2 = conn.execute(text("UPDATE clients SET email = NULL WHERE email = '';"))
        print(f"Updated {res2.rowcount} records where email was ''.")
        
        conn.commit()
        print("Cleanup complete.")

if __name__ == "__main__":
    cleanup()
