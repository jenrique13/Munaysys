from app.database import SessionLocal
from app.crud import operative as crud
from app import models

def test_search():
    db = SessionLocal()
    try:
        # Get all active clients
        all_clients = crud.get_clients(db)
        print(f"Total active clients: {len(all_clients)}")
        
        if all_clients:
            first_name = all_clients[0].name
            print(f"Searching for partially: {first_name[:3]}")
            filtered = crud.get_clients(db, search=first_name[:3])
            print(f"Filtered results: {len(filtered)}")
            for c in filtered:
                print(f" - {c.name}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_search()
