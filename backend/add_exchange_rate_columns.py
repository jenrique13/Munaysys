import sqlite3

def add_columns():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN exchange_rate FLOAT")
        print("Agregada columna exchange_rate a expenses")
    except sqlite3.OperationalError as e:
        print(f"Error o ya existe expenses.exchange_rate: {e}")

    try:
        cursor.execute("ALTER TABLE expenses ADD COLUMN exchange_currency VARCHAR DEFAULT 'usd'")
        print("Agregada columna exchange_currency a expenses")
    except sqlite3.OperationalError as e:
        print(f"Error o ya existe expenses.exchange_currency: {e}")

    try:
        cursor.execute("ALTER TABLE receipts ADD COLUMN exchange_rate FLOAT")
        print("Agregada columna exchange_rate a receipts")
    except sqlite3.OperationalError as e:
        print(f"Error o ya existe receipts.exchange_rate: {e}")

    try:
        cursor.execute("ALTER TABLE receipts ADD COLUMN exchange_currency VARCHAR DEFAULT 'usd'")
        print("Agregada columna exchange_currency a receipts")
    except sqlite3.OperationalError as e:
        print(f"Error o ya existe receipts.exchange_currency: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_columns()
