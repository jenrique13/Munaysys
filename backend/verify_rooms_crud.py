import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# We need a token. I'll assume the user's local dev environment has at least one admin.
# However, usually I don't have the token.
# I will try to use the repository directly via Python to verify that the UOW 
# and models are working as expected, which is what the API uses.

def verify_uow_logic():
    import sys
    import os
    sys.path.append(os.getcwd())
    
    from app.database import SessionLocal
    from app.uow.unit_of_work import UnitOfWork
    from app import models, schemas
    
    db = SessionLocal()
    uow = UnitOfWork(db)
    
    print("Testing Room creation via UOW (simulating API logic)...")
    try:
        # Create a test room
        room_data = {
            "name": "Test Room Logic",
            "branch_id": 1,
            "type": "sala_reuniones",
            "capacity": 4,
            "hourly_rate": 20.0,
            "description": "Test verification"
        }
        
        db_room = uow.rooms.create(room_data)
        uow.commit()
        uow.refresh(db_room)
        print(f"Room created: ID {db_room.id}, Name {db_room.name}")
        
        # Update
        uow.rooms.update(db_room, {"capacity": 10})
        uow.commit()
        uow.refresh(db_room)
        print(f"Room updated: Capacity {db_room.capacity}")
        
        # Delete (Soft)
        uow.rooms.update(db_room, {"is_active": False})
        uow.commit()
        print(f"Room soft-deleted: is_active={db_room.is_active}")
        
        # Cleanup (Hard delete for test only)
        uow.rooms.remove(db_room.id)
        uow.commit()
        print("Cleanup successful.")
        
    except Exception as e:
        print(f"Error during verification: {e}")
        uow.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_uow_logic()
