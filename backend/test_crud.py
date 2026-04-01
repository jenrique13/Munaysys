import requests

def test_api_search():
    base_url = "http://localhost:8000/api/v1/operative/clients"
    # Need to get a token first or run without auth if possible
    # But I can just test the crud again with a more specific check
    pass

if __name__ == "__main__":
    # Instead of API, let's test the CRUD with various search strings
    from app.database import SessionLocal
    from app.crud import operative as crud
    db = SessionLocal()
    
    search_term = "Juan"
    results = crud.get_clients(db, search=search_term)
    print(f"Results for '{search_term}': {len(results)}")
    for r in results:
        print(f" - {r.name}")
        
    db.close()
