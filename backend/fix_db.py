import sqlite3

def add_columns():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        print("is_active added.")
    except Exception as e:
        print(f"Error adding is_active: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN is_superuser BOOLEAN DEFAULT 0")
        print("is_superuser added.")
    except Exception as e:
        print(f"Error adding is_superuser: {e}")

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN access_permissions VARCHAR")
        print("access_permissions added.")
    except Exception as e:
        print(f"Error adding access_permissions: {e}")

    # Also adding to branches table just in case it's missing there too.
    try:
        cursor.execute("ALTER TABLE branches ADD COLUMN is_active BOOLEAN DEFAULT 1")
        print("branches is_active added.")
    except Exception as e:
        print(f"Error adding branches is_active: {e}")

    conn.commit()
    conn.close()
    print("Database updated successfully.")

if __name__ == "__main__":
    add_columns()
