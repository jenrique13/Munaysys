
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Client, Branch
from app.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("Checking clients...")
    clients = db.query(Client).all()
    print(f"Total clients in DB: {len(clients)}")
    
    null_names = [c for c in clients if c.name is None]
    if null_names:
        print(f"CRITICAL: Found {len(null_names)} clients with NULL name!")
        for c in null_names:
            print(f"  ID: {c.id}")
    else:
        print("No clients with NULL name found.")

    invalid_status = [c for c in clients if c.status not in ["active", "inactive", "suspended", "deleted", "won"]]
    if invalid_status:
        print(f"Warning: Found {len(invalid_status)} clients with unexpected status!")
        for c in invalid_status:
            print(f"  ID: {c.id}, Status: {c.status}")

    # Check for branch_id issues
    branches = db.query(Branch).all()
    branch_ids = {b.id for b in branches}
    invalid_branches = [c for c in clients if c.branch_id is not None and c.branch_id not in branch_ids]
    if invalid_branches:
        print(f"Warning: Found {len(invalid_branches)} clients with invalid branch_id!")
        for c in invalid_branches:
            print(f"  ID: {c.id}, BranchID: {c.branch_id}")

    print("Diagnostic complete.")

finally:
    db.close()
