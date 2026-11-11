import requests
import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.uow.unit_of_work import UnitOfWork
from app.core import security
from app import models

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_test_token():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.is_active == True).first()
    if not user:
        return None
    token = security.create_access_token(user.id)
    db.close()
    return token

def audit():
    token = get_test_token()
    if not token:
        print("ERROR: No test user available.")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = [
        ("GET", "/auth/me"),
        ("GET", "/dashboards/kpis"),
        ("GET", "/crm/leads"),
        ("GET", "/crm/stages"),
        ("GET", "/operative/bookings"),
        ("GET", "/system/notifications"),
        ("GET", "/system/bcv-rate"),
        ("GET", "/financial/summary"),
        ("GET", "/financial/products"),
        ("GET", "/financial/services"),
        ("GET", "/financial/orders"),
    ]
    
    passed = 0
    failed = 0
    
    print(f"{'METHOD':<8} {'ENDPOINT':<25} {'STATUS':<10} {'DETAIL'}")
    print("-" * 60)
    
    for method, path in endpoints:
        url = BASE_URL + path
        try:
            if method == "GET":
                resp = requests.get(url, headers=headers)
            
            status = resp.status_code
            if status == 200:
                print(f"{method:<8} {path:<25} \033[92m{status:<10}\033[0m OK")
                passed += 1
            else:
                detail = resp.text[:50]
                print(f"{method:<8} {path:<25} \033[91m{status:<10}\033[0m {detail}")
                failed += 1
        except Exception as e:
            print(f"{method:<8} {path:<25} \033[91mERROR\033[0m {str(e)}")
            failed += 1
            
    print("-" * 60)
    print(f"RESUMEN: {passed} PASSED, {failed} FAILED")
    return failed == 0

if __name__ == "__main__":
    # Ensure uvicorn is running before calling this!
    if audit():
        sys.exit(0)
    else:
        sys.exit(1)
