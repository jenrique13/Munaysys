import psycopg2
from urllib.parse import urlparse

# URL from backend config
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/munaysys_dev"

def migrate():
    try:
        # Parse URL
        result = urlparse(DATABASE_URL)
        username = result.username
        password = result.password
        database = result.path[1:]
        hostname = result.hostname
        port = result.port

        # Connect
        conn = psycopg2.connect(
            database=database,
            user=username,
            password=password,
            host=hostname,
            port=port
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # 1. Add branch_id column to receipts
        print("Adding branch_id column to receipts table...")
        try:
            cursor.execute("ALTER TABLE receipts ADD COLUMN branch_id INTEGER REFERENCES branches(id);")
            print("Column branch_id added successfully.")
        except psycopg2.Error as e:
            if "already exists" in str(e):
                print("Column branch_id already exists.")
            else:
                print(f"Error adding column: {e}")

        # 2. Update existing receipts based on Orden
        print("Updating receipts from orders...")
        try:
            cursor.execute("""
                UPDATE receipts r 
                SET branch_id = o.branch_id 
                FROM orders o 
                WHERE r.orden_id = o.id AND r.branch_id IS NULL;
            """)
            print(f"Updated {cursor.rowcount} receipts from orders.")
        except psycopg2.Error as e:
            print(f"Error updating receipts from orders: {e}")

        # 3. Update existing receipts based on Purchase
        print("Updating receipts from purchases...")
        try:
            cursor.execute("""
                UPDATE receipts r 
                SET branch_id = p.branch_id 
                FROM purchases p 
                WHERE r.purchase_id = p.id AND r.branch_id IS NULL;
            """)
            print(f"Updated {cursor.rowcount} receipts from purchases.")
        except psycopg2.Error as e:
            print(f"Error updating receipts from purchases: {e}")

        # 4. Fallback for remaining (General receipts) - use client's branch_id
        print("Updating general receipts from clients...")
        try:
            cursor.execute("""
                UPDATE receipts r 
                SET branch_id = c.branch_id 
                FROM clients c 
                WHERE r.client_id = c.id AND r.branch_id IS NULL;
            """)
            print(f"Updated {cursor.rowcount} general receipts from clients.")
        except psycopg2.Error as e:
            print(f"Error updating receipts from clients: {e}")

        print("Migration finished successfully.")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Database connection or execution failed: {e}")

if __name__ == "__main__":
    migrate()
