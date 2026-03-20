
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Lead
from app.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("Searching for invalid emails in leads...")
    leads = db.query(Lead).all()
    invalid_emails = [l for l in leads if l.email and "@" not in l.email]
    empty_emails = [l for l in leads if l.email == ""]
    
    print(f"Leads with invalid email (@ missing): {len(invalid_emails)}")
    for l in invalid_emails:
        print(f"  ID: {l.id}, Name: {l.name}, Email: '{l.email}'")
        
    print(f"Leads with empty string email: {len(empty_emails)}")
    for l in empty_emails:
        print(f"  ID: {l.id}, Name: {l.name}")

finally:
    db.close()
