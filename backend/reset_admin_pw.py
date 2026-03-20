from app.database import SessionLocal
from app.models import User
from app.core import security
from sqlalchemy import select

def reset_password():
    db = SessionLocal()
    user = db.execute(select(User).where(User.email == "admin3@munaysys.com")).scalar()
    if user:
        user.password_hash = security.get_password_hash("adminpassword")
        user.status = "active"
        db.commit()
        print("✓ Password for admin3@munaysys.com reset to 'adminpassword'")
    else:
        print("✗ User admin3@munaysys.com not found")
    db.close()

if __name__ == "__main__":
    reset_password()
