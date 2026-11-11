import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))
from backend.app.database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE order_audit_logs ALTER COLUMN orden_id DROP NOT NULL;'))
        except Exception as e:
            print("Error order_audit_logs drop not null:", e)
            
        try:
            conn.execute(text('ALTER TABLE order_audit_logs DROP CONSTRAINT order_audit_logs_orden_id_fkey;'))
        except Exception as e:
            print("Error dropping constraint:", e)
            
        try:
            conn.execute(text('ALTER TABLE order_audit_logs ADD CONSTRAINT order_audit_logs_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES orders(id) ON DELETE SET NULL;'))
        except Exception as e:
            print("Error adding constraint:", e)
            
        try:
            conn.execute(text('ALTER TABLE cash_movements ADD COLUMN IF NOT EXISTS receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE;'))
        except Exception as e:
            print("Error adding receipt_id:", e)
            
        conn.commit()
        print('Done')

if __name__ == '__main__':
    run()
