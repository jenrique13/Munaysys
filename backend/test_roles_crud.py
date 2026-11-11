import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_role_crud():
    # 1. Login
    login_data = {
        "username": "admin3@munaysys.com",
        "password": "adminpassword"
    }
    response = requests.post(f"http://localhost:8000/api/v1/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")

    # 2. Create Role
    role_data = {
        "name": "Partial Finance Role",
        "permissions_json": {
            "crm": False, 
            "operative": False, 
            "financial": False, 
            "financial_orders": True,
            "financial_products": True,
            "financial_services": True
        }
    }
    response = requests.post(f"{BASE_URL}/configuration/roles", json=role_data, headers=headers)
    print(f"Create Role: {response.status_code}")
    if response.status_code != 201:
        print(f"Error: {response.text}")
        return
    role_id = response.json()["id"]
    print(f"Role created with ID: {role_id}")

    # 3. List Roles
    response = requests.get(f"{BASE_URL}/configuration/roles", headers=headers)
    print(f"List Roles: {response.status_code}")
    roles = response.json()
    role_names = [r["name"] for r in roles]
    print(f"Roles: {role_names}")

    # 4. Update Role
    update_data = {
        "name": "Updated Test Role",
        "permissions_json": {"crm": True, "operative": True}
    }
    response = requests.put(f"{BASE_URL}/configuration/roles/{role_id}", json=update_data, headers=headers)
    print(f"Update Role: {response.status_code}")
    if response.status_code == 200:
        print(f"New name: {response.json()['name']}")

    # 5. Delete Role
    response = requests.delete(f"{BASE_URL}/configuration/roles/{role_id}", headers=headers)
    print(f"Delete Role: {response.status_code}")
    if response.status_code == 204:
        print("Role deleted successfully.")

if __name__ == "__main__":
    test_role_crud()
