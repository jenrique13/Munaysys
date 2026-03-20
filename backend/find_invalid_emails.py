
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Client
from app.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("Searching for invalid emails...")
    clients = db.query(Client).all()
    invalid_emails = []
    for c in clients:
        if c.email and "@" not in c.email:
            invalid_emails.append(c)
    
    if invalid_emails:
        print(f"Found {len(invalid_emails)} clients with invalid email:")
        for c in invalid_emails:
            print(f"  ID: {c.id}, Name: {c.name}, Email: '{c.email}'")
    else:
        print("No clients with invalid email found (where @ is missing).")

    # Also check for empty strings if EmailStr doesn't like them
    empty_emails = [c for c in clients if c.email == ""]
    if empty_emails:
        print(f"Found {len(empty_emails)} clients with empty string email:")
        for c in empty_emails:
            print(f"  ID: {c.id}, Name: {c.name}")

finally:
    db.close()
