
import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.models import Client
from app.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("Checking client status distribution...")
    stats = db.query(Client.status, func.count(Client.id)).group_by(Client.status).all()
    for status, count in stats:
        print(f"Status: {status}, Count: {count}")
    
    deleted_count = db.query(Client).filter(Client.status == "deleted").count()
    active_count = db.query(Client).filter(Client.status != "deleted").count()
    print(f"Total non-deleted: {active_count}")
    print(f"Total deleted: {deleted_count}")

finally:
    db.close()
