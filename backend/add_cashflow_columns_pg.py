import psycopg2
from urllib.parse import urlparse

# URL from backend config (or hardcoded for dev based on previous context)
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/munaysys_dev"

def add_columns():
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

        # Add to cash_movements
        try:
            cursor.execute("ALTER TABLE cash_movements ADD COLUMN client_name VARCHAR;")
            print("Added client_name to cash_movements")
        except psycopg2.Error as e:
            print(f"Skipping client_name on cash_movements: {e}")

        try:
            cursor.execute("ALTER TABLE cash_movements ADD COLUMN provider_name VARCHAR;")
            print("Added provider_name to cash_movements")
        except psycopg2.Error as e:
            print(f"Skipping provider_name on cash_movements: {e}")

        try:
            cursor.execute("ALTER TABLE cash_movements ADD COLUMN payment_method VARCHAR;")
            print("Added payment_method to cash_movements")
        except psycopg2.Error as e:
            print(f"Skipping payment_method on cash_movements: {e}")

        # Add to expenses
        try:
            cursor.execute("ALTER TABLE expenses ADD COLUMN payment_method VARCHAR;")
            print("Added payment_method to expenses")
        except psycopg2.Error as e:
            print(f"Skipping payment_method on expenses: {e}")

        # Add to payables
        try:
            cursor.execute("ALTER TABLE payables ADD COLUMN payment_method VARCHAR;")
            print("Added payment_method to payables")
        except psycopg2.Error as e:
            print(f"Skipping payment_method on payables: {e}")

        print("Columns adding process finished successfully.")
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Database connection or execution failed: {e}")

if __name__ == "__main__":
    add_columns()
