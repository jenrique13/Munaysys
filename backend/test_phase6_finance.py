import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app import models

client = TestClient(app)

def run_tests():
    print("Iniciando pruebas de Verificación Fase 6 - Módulo Financiero...")

    # 1. Login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin3@munaysys.com", "password": "admin"}
    )
    if response.status_code != 200:
        print(f"Error en login: {response.text}")
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test Cash Movements
    print("[*] Probando Movimientos de Caja...")
    response = client.post(
        "/api/v1/financial/cash-movements",
        json={
            "amount": 500.0,
            "type": "income",
            "category": "Aporte",
            "description": "Aporte inicial de prueba"
        },
        headers=headers
    )
    assert response.status_code == 200, f"Error creando movimiento: {response.text}"
    movement = response.json()
    print(f"    - Movimiento creado: {movement['id']} | {movement['amount']} | {movement['category']}")

    # 3. Test Receivables Summary
    print("[*] Probando Resumen de Cuentas por Cobrar...")
    response = client.get("/api/v1/financial/receivables", headers=headers)
    assert response.status_code == 200, f"Error obteniendo receivables: {response.text}"
    receivables = response.json()
    print(f"    - Clientes con deuda encontrados: {len(receivables)}")
    for r in receivables[:3]:
        print(f"      - {r['client_name']}: ${r['balance']}")

    # 4. Test Financial Summary
    print("[*] Probando Resumen Financiero Consolidado...")
    response = client.get("/api/v1/financial/financial-summary", headers=headers)
    assert response.status_code == 200, f"Error obteniendo summary: {response.text}"
    summary = response.json()
    print(f"    - Caja Actual: ${summary['current_cash']}")
    print(f"    - Total CxC: ${summary['total_receivables']}")
    print(f"    - Total CxP: ${summary['total_payables']}")

    print("\n✅ VERIFICACIÓN DE FASE 6 EXITOSA ✅")

if __name__ == "__main__":
    run_tests()
