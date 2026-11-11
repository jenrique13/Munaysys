
import sys
import os
import re
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# Add parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models import Client, Branch
from app.config import settings

def clean_ci_rif(val):
    if not val:
        return ""
    # Strip non-alphanumeric and convert to uppercase
    return re.sub(r'[^a-zA-Z0-9]', '', str(val)).upper()

def identify_duplicates():
    # Database connection URL from settings
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        print("Fetching clients...")
        clients = db.query(Client).all()
        print(f"Total clients found: {len(clients)}")

        seen = {}
        duplicates = {}

        for client in clients:
            clean_val = clean_ci_rif(client.ci_rif)
            if not clean_val:
                continue
            
            if clean_val in seen:
                if clean_val not in duplicates:
                    duplicates[clean_val] = [seen[clean_val]]
                duplicates[clean_val].append(client)
            else:
                seen[clean_val] = client

        if not duplicates:
            print("No duplicates found with fuzzy matching.")
            return

        print(f"\nFound {len(duplicates)} groups of potential duplicates by CI/RIF:\n")
        
        # Header
        print(f"{'CI/RIF Group':<15} | {'ID':<6} | {'Original CI/RIF':<20} | {'Status':<10} | {'Name'}")
        print("-" * 80)

        for clean_val, group in duplicates.items():
            for i, client in enumerate(group):
                label = clean_val if i == 0 else ""
                print(f"{label:<15} | {client.id:<6} | {str(client.ci_rif):<20} | {client.status:<10} | {client.name}")
            print("-" * 80)

        print(f"\nTotal duplicate groups: {len(duplicates)}")
        print(f"Total individual records involved: {sum(len(g) for g in duplicates.values())}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    identify_duplicates()
