from sqlalchemy import text
from app.database import engine

def add_column():
    print("Adding custom_contract_html to memberships...")
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE memberships ADD COLUMN custom_contract_html VARCHAR NULL;"))
            conn.commit()
            print("Successfully added custom_contract_html column.")
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicada" in str(e).lower():
            print("Column already exists.")
        else:
            print("Error:", str(e))

if __name__ == "__main__":
    add_column()
