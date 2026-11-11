import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.core.security import get_password_hash

def setup_test_client():
    db = SessionLocal()
    try:
        # 1. Ensure "Cliente" role exists
        role = db.query(models.Role).filter(models.Role.name == "Cliente").first()
        if not role:
            role = models.Role(name="Cliente", permissions_json={})
            db.add(role)
            db.commit()
            db.refresh(role)
            print(f"Role 'Cliente' created with ID {role.id}")
        else:
            print(f"Role 'Cliente' already exists with ID {role.id}")

        # 1.5 Ensure a Branch exists
        branch = db.query(models.Branch).first()
        if not branch:
            print("No branches found. Creating default branch...")
            branch = models.Branch(name="Sede Principal", is_active=True)
            db.add(branch)
            db.commit()
            db.refresh(branch)
        
        print(f"Using Branch: {branch.name} (ID: {branch.id})")

        # 2. Get the first client or create one
        client = db.query(models.Client).first()
        if not client:
            print("No clients found in database. Creating one...")
            client = models.Client(
                name="Test Client",
                email="client@test.com",
                branch_id=branch.id,
                status="active"
            )
            db.add(client)
            db.commit()
            db.refresh(client)
        
        print(f"Using Client: {client.name} ({client.email})")

        # 3. Create User if not exists
        user = db.query(models.User).filter(models.User.email == client.email).first()
        if not user:
            user = models.User(
                email=client.email,
                password_hash=get_password_hash("password123"),
                role_id=role.id,
                branch_id=client.branch_id,
                status="active"
            )
            db.add(user)
            db.commit()
            print(f"User created for client with email {client.email}")
        else:
            user.role_id = role.id # Ensure it has the right role
            db.commit()
            print(f"User already exists for email {client.email}, role updated")

        print("\nTest Setup Complete!")
        print(f"Login: {client.email}")
        print("Password: password123")
        
    finally:
        db.close()

if __name__ == "__main__":
    setup_test_client()
