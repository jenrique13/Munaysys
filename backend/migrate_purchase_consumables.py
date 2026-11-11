"""
Migration script: Add consumable support to purchase_details table.
"""
from app.database import engine
from sqlalchemy import text

cols = [
    ("consumable_id", "INTEGER"),
    ("item_type", "VARCHAR DEFAULT 'product'"),
    ("unit", "VARCHAR")
]

with engine.connect() as conn:
    for col_name, col_type in cols:
        try:
            conn.execute(text(f"ALTER TABLE purchase_details ADD COLUMN {col_name} {col_type}"))
            conn.commit()
            print(f"Column '{col_name}' added successfully.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                print(f"Column '{col_name}' already exists — skipping.")
            else:
                raise e
