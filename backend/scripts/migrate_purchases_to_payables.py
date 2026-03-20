import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def migrate_purchases_to_payables():
    db: Session = SessionLocal()
    try:
        # Find all purchases with pending or partial status
        purchases = db.query(models.Purchase).filter(
            models.Purchase.status.in_(["pending", "partial"])
        ).all()
        
        count = 0
        for p in purchases:
            # Check if payable already exists
            existing = db.query(models.Payable).filter(models.Payable.purchase_id == p.id).first()
            
            if not existing:
                # If provider_id is missing, create a dummy Provider row dynamically to map it properly
                if not p.provider_id and p.provider_name:
                    prov = db.query(models.Provider).filter(
                        models.Provider.name == p.provider_name,
                        models.Provider.branch_id == p.branch_id
                    ).first()
                    
                    if not prov:
                        prov = models.Provider(
                            branch_id=p.branch_id,
                            name=p.provider_name,
                            notes="Auto-created during migration for legacy purchase mapping"
                        )
                        db.add(prov)
                        db.flush() # get prov.id immediately
                        
                    p.provider_id = prov.id
                    db.add(p) # update the Purchase FK directly

                if p.provider_id:
                    total_paid = sum(r.amount for r in p.receipts) if p.receipts else 0.0
                    balance = p.total - total_paid
                    
                    if balance > 0.01:
                        new_payable = models.Payable(
                            provider_id=p.provider_id,
                            branch_id=p.branch_id,
                            reference=f"Compra #{p.id}",
                            amount=balance,
                            due_date=p.date or datetime.utcnow(),
                            status=p.status,
                            purchase_id=p.id
                        )
                        db.add(new_payable)
                        count += 1
                        
        db.commit()
        print(f"Successfully migrated {count} pending/partial purchases into payables.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_purchases_to_payables()
