import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import engine, Base
from app.models import *

def recreate_missing_tables():
    print("Recreating missing tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    recreate_missing_tables()
