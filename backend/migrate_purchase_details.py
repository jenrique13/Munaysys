"""
Migration script: Add 'sales_price' column to purchase_details table.
"""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE purchase_details ADD COLUMN sales_price FLOAT DEFAULT 0.0"))
        conn.commit()
        print("Column 'sales_price' added successfully to purchase_details table.")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            print("Column 'sales_price' already exists — skipping.")
        else:
            raise e
