import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app import models

# Asegurarse de que las tablas existan
models.Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("Iniciando pruebas del Módulo Financiero...")

    # 1. Login to get token
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin3@munaysys.com", "password": "admin"}
    )
    if response.status_code != 200:
        print(f"Error en login: {response.text}")
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Asignar branch_id = 1 al usuario admin3 para evitar errores de validación
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == "admin3@munaysys.com").first()
    if user and not user.branch_id:
        user.branch_id = 1
        db.commit()
    db.close()

    # 2. Crear un Cliente (si no existe uno para probar)
    response = client.post(
        "/api/v1/operative/clients/",
        json={"name": "Cliente de Prueba Finanzas", "branch_id": 1},
        headers=headers
    )
    if response.status_code not in [200, 201]:
        print(f"Error creando cliente: {response.text}")
        return
    client_data = response.json()
    client_id = client_data["id"]
    print(f"[*] Cliente creado con ID: {client_id}")

    # 3. Crear Producto Físico
    response = client.post(
        "/api/v1/financial/products/",
        json={
            "name": "Producto Prueba",
            "price": 100.0,
            "type": "physical",
            "stock": 10,
            "branch_id": 1
        },
        headers=headers
    )
    if response.status_code not in [200, 201]:
        print(f"Error creando producto: {response.text}")
        return
    product_data = response.json()
    product_id = product_data["id"]
    print(f"[*] Producto creado con ID: {product_id}, Stock: 10, Precio: $100")

    # 4. Crear Orden de Venta
    # Compramos 2 unidades. Subtotal = 200. Descuento = 20. Base = 180. Tax (16%) = 28.8. Total = 208.8
    response = client.post(
        "/api/v1/financial/orders/",
        json={
            "client_id": client_id,
            "branch_id": 1,
            "discount": 20.0,
            "details": [
                {
                    "item_type": "product",
                    "item_id": product_id,
                    "quantity": 2,
                    "unit_price": 100.0,
                    "discount": 0.0
                }
            ]
        },
        headers=headers
    )
    if response.status_code not in [200, 201]:
        print(f"Error creando orden: {response.text}")
        return
    order_data = response.json()
    order_id = order_data["id"]
    print(f"[*] Orden creada con ID: {order_id}")
    print(f"    Subtotal: {order_data['subtotal']}, Descuento: {order_data['discount']}, Tax: {order_data['tax']}, Total: {order_data['total']}, Status: {order_data['status']}")
    
    assert order_data['total'] == 208.8, f"Total incorrecto: {order_data['total']} != 208.8"

    # Verificar stock
    response = client.get("/api/v1/financial/products", headers=headers)
    products = response.json()
    product = next(p for p in products if p["id"] == product_id)
    current_stock = product["stock"]
    print(f"[*] Stock del producto después de venta: {current_stock}")
    assert current_stock == 8, f"Stock incorrecto: {current_stock} != 8"

    # 5. Abonar Pago Parcial
    # Abonar 100.0
    response = client.post(
        "/api/v1/financial/receipts/",
        json={
            "orden_id": order_id,
            "client_id": client_id,
            "amount": 100.0,
            "type": "income",
            "payment_method": "Zelle",
            "reference": "TEST-123"
        },
        headers=headers
    )
    if response.status_code not in [200, 201]:
        print(f"Error creando recibo: {response.text}")
        return
    receipt_data = response.json()
    print(f"[*] Recibo (Abono a Orden) creado con ID: {receipt_data['id']}, Monto: {receipt_data['amount']}")

    # Verificar estado de la orden (debe ser partial)
    response = client.get("/api/v1/financial/orders", headers=headers)
    orders = response.json()
    order = next(o for o in orders if o["id"] == order_id)
    order_status = order["status"]
    print(f"[*] Estado de la orden actualizado: {order_status}")
    assert order_status == "partial", f"Status incorrecto: {order_status} != partial"

    # 6. Estado de Cuenta
    response = client.get(f"/api/v1/financial/clients/{client_id}/statement", headers=headers)
    statement = response.json()
    print(f"[*] Estado de Cuenta generado:")
    print(f"    Total Cargos: {statement['total_charges']}")
    print(f"    Total Pagado: {statement['total_paid']}")
    print(f"    Saldo Deudor: {statement['balance']}")
    assert round(statement['balance'], 2) == 108.8, f"Saldo deudor incorrecto: {statement['balance']} != 108.8"

    # 7. Crear Compra (Abastecimiento)
    # Compramos 5 unidades del producto a $50. Subtotal = 250. Tax = 40. Total = 290
    response = client.post(
        "/api/v1/financial/purchases/",
        json={
            "provider_name": "Proveedor Test",
            "branch_id": 1,
            "details": [
                {
                    "product_id": product_id,
                    "quantity": 5,
                    "unit_cost": 50.0
                }
            ]
        },
        headers=headers
    )
    if response.status_code not in [200, 201]:
        print(f"Error creando compra: {response.text}")
        return
    purchase_data = response.json()
    purchase_id = purchase_data["id"]
    print(f"[*] Compra creada con ID: {purchase_id}, Total: {purchase_data['total']}")

    # Verificar stock
    response = client.get("/api/v1/financial/products", headers=headers)
    products = response.json()
    product = next(p for p in products if p["id"] == product_id)
    current_stock = product["stock"]
    print(f"[*] Stock del producto después de compra (8 + 5 = 13): {current_stock}")
    assert current_stock == 13, f"Stock incorrecto: {current_stock} != 13"

    print("\n✅ TODAS LAS PRUEBAS PASARON CORRECTAMENTE ✅")

if __name__ == "__main__":
    run_tests()
