
import sys
import os
import re
from sqlalchemy import create_engine, func, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to sys.path to import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models import Client, Membership, Amenity, AmenityHistory, Booking, Orden, Receipt, Quote
from app.config import settings

def clean_ci_rif(val):
    if not val:
        return ""
    # Strip non-alphanumeric and convert to uppercase
    return re.sub(r'[^a-zA-Z0-9]', '', str(val)).upper()

def get_activity_score(db, client_id):
    score = 0
    score += db.query(Membership).filter(Membership.client_id == client_id).count() * 10
    score += db.query(Orden).filter(Orden.client_id == client_id).count() * 5
    score += db.query(Receipt).filter(Receipt.client_id == client_id).count() * 2
    score += db.query(Booking).filter(Booking.client_id == client_id).count() * 2
    score += db.query(Quote).filter(Quote.client_id == client_id).count()
    score += db.query(Amenity).filter(Amenity.client_id == client_id).count()
    return score

def cleanup():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        print("Starting cleanup process...")
        
        # 1. IDENTIFY DUPLICATES
        clients = db.query(Client).all()
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
            print("No duplicates found to merge.")
        else:
            print(f"Found {len(duplicates)} groups of duplicates.")

            for clean_val, group in duplicates.items():
                print(f"\nProcessing Group: {clean_val}")
                
                # Special rule for CI 21.469.653
                if clean_val == "21469653":
                    master = next((c for c in group if "JOSE APONTE" in c.name.upper()), None)
                    if not master:
                        master = group[0] # Fallback
                    print(f"  SPECIAL RULE: Selecting {master.name} (ID: {master.id}) as Master.")
                else:
                    # Generic rule: Pick the one with the highest activity score
                    master = max(group, key=lambda c: (get_activity_score(db, c.id), -c.id)) # -c.id to favor older records (smaller ID)
                    print(f"  Selecting {master.name} (ID: {master.id}) as Master (Score: {get_activity_score(db, master.id)}).")

                redundants = [c for c in group if c.id != master.id]
                
                for redundant in redundants:
                    print(f"  Merging redundant record: {redundant.name} (ID: {redundant.id}) -> Master (ID: {master.id})")
                    
                    # Migration of foreign keys
                    tables_to_update = [
                        (Membership, 'client_id'),
                        (Amenity, 'client_id'),
                        (AmenityHistory, 'client_id'),
                        (Booking, 'client_id'),
                        (Orden, 'client_id'),
                        (Receipt, 'client_id'),
                        (Quote, 'client_id'),
                    ]
                    
                    for model, field in tables_to_update:
                        db.query(model).filter(getattr(model, field) == redundant.id).update({field: master.id})
                    
                    # Delete the redundant record
                    db.delete(redundant)
            
            print("\nMergin complete. Committing changes...")
            db.commit()

        # 2. CI/RIF NORMALIZATION FOR ALL CLIENTS
        print("\nStarting CI/RIF normalization for all records...")
        all_clients = db.query(Client).all()
        normalized_count = 0
        for client in all_clients:
            if client.ci_rif:
                cleaned = clean_ci_rif(client.ci_rif)
                if cleaned != client.ci_rif:
                    client.ci_rif = cleaned
                    normalized_count += 1
        
        print(f"Normalized {normalized_count} records.")
        db.commit()
        
        print("\nCleanup process finished successfully.")

    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
