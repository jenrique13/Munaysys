
import requests

BASE_URL = "http://localhost:8000/api/v1/operative/clients"
# Note: I need an auth token to call this.
# I'll check if I can get a token or if I can bypass it for testing if I run internally.
# Alternatively, I can use the internal FastAPI test client logic.

import sys
import os
sys.path.append(os.getcwd())

from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user
from app.models import User

# Mock dependency
def override_get_current_user():
    return User(id=1, email="admin@example.com", is_superuser=True)

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

print("Fetching clients in batches...")
batch_size = 100
skip = 0
total_fetched = 0

while True:
    print(f"Fetching skip={skip}, limit={batch_size}...")
    response = client.get(f"/api/v1/operative/clients?skip={skip}&limit={batch_size}")
    if response.status_code != 200:
        print(f"FAILED at skip={skip}!")
        print(response.text)
        break
    
    data = response.json()
    if not data:
        print("Done fetching.")
        break
    
    total_fetched += len(data)
    print(f"Fetched {len(data)} clients (Total: {total_fetched})")
    skip += batch_size

print(f"Final total fetched: {total_fetched}")
