from sqlalchemy import create_engine, inspect
from app.database import Base, engine
from app import models

def create_payment_methods_table():
    inspector = inspect(engine)
    if "payment_methods" not in inspector.get_table_names():
        print("Creating table 'payment_methods'...")
        models.PaymentMethod.__table__.create(bind=engine)
        print("Table 'payment_methods' created successfully.")
    else:
        print("Table 'payment_methods' already exists.")

if __name__ == "__main__":
    create_payment_methods_table()
