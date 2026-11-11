from sqlalchemy import select
from app.database import SessionLocal
from app.models import User

def list_users():
    db = SessionLocal()
    users = db.execute(select(User)).scalars().all()
    print("Users in DB:")
    for u in users:
        print(f"- {u.email} (Active: {u.is_active})")
    db.close()

if __name__ == "__main__":
    list_users()
