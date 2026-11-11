import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.models import Receipt, Orden

db = SessionLocal()
try:
    print("Starting database correction...")
    # 1. Reassociate receipts of Jalisco branch (Branch 2) to Jalisco order (Order 1154)
    # Receipt 1300 (170.0 USD)
    r1300 = db.get(Receipt, 1300)
    if r1300:
        r1300.orden_id = 1154
        print("Receipt 1300 updated to order 1154.")
    else:
        print("Receipt 1300 not found!")
        
    # Receipt 1301 (10.0 USD)
    r1301 = db.get(Receipt, 1301)
    if r1301:
        r1301.orden_id = 1154
        print("Receipt 1301 updated to order 1154.")
    else:
        print("Receipt 1301 not found!")

    db.flush()

    # 2. Recalculate and update order statuses
    # Order 762 (Sede 1): total 580 USD. Receipts: 1023 (410 USD). New status: partial.
    o762 = db.get(Orden, 762)
    if o762:
        o762.status = "partial"
        print("Order 762 updated to status 'partial'.")
    else:
        print("Order 762 not found!")

    # Order 984 (Sede 1): total 580 USD. Receipts: none. New status: pending.
    o984 = db.get(Orden, 984)
    if o984:
        o984.status = "pending"
        print("Order 984 updated to status 'pending'.")
    else:
        print("Order 984 not found!")

    # Order 1154 (Sede 2): total 580 USD. Receipts: 1300 and 1301 (180 USD). New status: partial.
    o1154 = db.get(Orden, 1154)
    if o1154:
        o1154.status = "partial"
        print("Order 1154 updated to status 'partial'.")
    else:
        print("Order 1154 not found!")

    db.commit()
    print("Database correction successfully completed!")
except Exception as e:
    db.rollback()
    print(f"Error during correction: {e}")
finally:
    db.close()
