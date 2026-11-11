import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.auth import AuthUseCases
from app import models

def verify_auth_logic():
    db = SessionLocal()
    uow = UnitOfWork(db)
    auth_use_case = AuthUseCases(uow)
    
    # Try to find a real user to test with
    user = db.query(models.User).filter(models.User.is_active == True).first()
    if not user:
        print("ERROR: No active user found in database to test login.")
        return False
        
    print(f"Testing login for user: {user.email}")
    
    # We can't know the plain password easily, but we can test if the field 'password_hash' exists
    try:
        pw_hash = user.password_hash
        print(f"SUCCESS: User has 'password_hash' property. Value start: {pw_hash[:10]}...")
    except AttributeError:
        print("ERROR: User model DOES NOT HAVE 'password_hash' property.")
        return False
        
    # Test get_by_email
    found_user = uow.users.get_by_email(user.email)
    if not found_user or found_user.id != user.id:
        print("ERROR: uow.users.get_by_email failed.")
        return False
        
    print("SUCCESS: Auth logic verification passed (Property names and Repository access).")
    return True

if __name__ == "__main__":
    # Add current dir to sys.path
    sys.path.append(os.getcwd())
    if verify_auth_logic():
        sys.exit(0)
    else:
        sys.exit(1)
