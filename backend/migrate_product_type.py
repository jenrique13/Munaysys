"""
Migration: set type='physical' for all existing products that have NULL type.
"""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("UPDATE products SET type = 'physical' WHERE type IS NULL"))
    conn.commit()
    print("Done: all existing products without type set to 'physical'.")
