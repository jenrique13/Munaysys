import sys
import os

# Add the backend path to sys.path to import app
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from app.config import settings

def fix_db():
    print(f"Connecting to: {settings.SQLALCHEMY_DATABASE_URI}")
    try:
        engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
        with engine.connect() as conn:
            # Fix Offices
            print("Cleaning up Offices amenities_json...")
            # SQLite uses json_extract or similar, but since we are in PG (mostly) or SQLite (some files), 
            # we'll do a python-based update for safety if needed, or clear SQL.
            # In PG, a dict is saved as '{}'. In SQLite as well often.
            
            # Using a generic approach: fetch and update if not list
            from app import models
            from sqlalchemy.orm import sessionmaker
            Session = sessionmaker(bind=engine)
            session = Session()

            offices = session.query(models.Office).all()
            updated_offices = 0
            for o in offices:
                if o.amenities_json is None or isinstance(o.amenities_json, dict):
                    print(f"Fixing Office ID {o.id} ({o.name}): {o.amenities_json} -> []")
                    o.amenities_json = []
                    updated_offices += 1
            
            rooms = session.query(models.Room).all()
            updated_rooms = 0
            for r in rooms:
                if r.amenities_json is None or isinstance(r.amenities_json, dict):
                    print(f"Fixing Room ID {r.id} ({r.name}): {r.amenities_json} -> []")
                    r.amenities_json = []
                    updated_rooms += 1
            
            session.commit()
            print(f"Done! Updated {updated_offices} offices and {updated_rooms} rooms.")
            session.close()

    except Exception as e:
        print(f"Error fixing DB: {e}")

if __name__ == "__main__":
    fix_db()
