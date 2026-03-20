from sqlalchemy import create_engine, text
from app.config import settings

def check_schema():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"))
        for row in result:
            print(f"Col: {row[0]}, Type: {row[1]}")

if __name__ == "__main__":
    check_schema()
