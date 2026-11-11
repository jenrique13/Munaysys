import sys
import os
from sqlalchemy import text

# Add the parent directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating database for item_name...")
        
        # 1. Add item_name to order_details
        try:
            print("Checking/Adding 'item_name' to 'order_details'...")
            conn.execute(text("ALTER TABLE order_details ADD COLUMN IF NOT EXISTS item_name VARCHAR;"))
            conn.commit()
            print("Success.")
        except Exception as e:
            print(f"Error in order_details: {e}")

        # 2. Add item_name to quote_items (though it has 'description', we might want consistency if needed)
        # However, the user specifically mentioned order_details.
        
        print("Migration completed.")

if __name__ == "__main__":
    migrate()
