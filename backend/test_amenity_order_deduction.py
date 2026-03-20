import sys
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.crud import financial as financial_crud
from app.schemas import financial as financial_schemas
from datetime import datetime

def test_amenity_order_deduction():
    db = SessionLocal()
    try:
        print("Starting Amenity Order Deduction Test...")
        
        # 1. Setup: Ensure a branch exists
        branch = db.query(models.Branch).first()
        if not branch:
            branch = models.Branch(name="Test Branch", address="Test Address")
            db.add(branch)
            db.commit()
            db.refresh(branch)
        
        # 2. Setup: Create a Client
        client = models.Client(name="Amenity Tester", email="tester@example.com", branch_id=branch.id)
        db.add(client)
        db.commit()
        db.refresh(client)
        print(f"Created client: {client.name} (ID: {client.id})")

        # 3. Setup: Create a Service marked as Amenity
        service_name = "Impresiones Color"
        service = models.Service(
            name=service_name,
            description="Test amenity service",
            price=10.0,
            is_active=True,
            is_amenity=True,
            branch_id=branch.id
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        print(f"Created service: {service.name} (is_amenity={service.is_amenity})")

        # 4. Setup: Give the client an Amenity quota
        amenity = models.Amenity(
            name=service_name,
            branch_id=branch.id,
            client_id=client.id,
            quantity=5, # 5 units of printing
            unit="unidades",
            is_recurring=True,
            monthly_quota=5
        )
        db.add(amenity)
        db.commit()
        db.refresh(amenity)
        print(f"Created amenity quota: {amenity.name} (Quantity: {amenity.quantity})")

        # 5. Execute: Create an Order with more units than the quota (e.g., 7 units)
        # Expected: 5 covered, 2 charged.
        # Subtotal: 2 * 10 = 20. Tax: 20 * 0.16 = 3.2. Total: 23.2.
        order_in = financial_schemas.OrdenCreate(
            client_id=client.id,
            branch_id=branch.id,
            status="pending",
            discount=0,
            discount_type="amount",
            details=[
                financial_schemas.PedidoCreate(
                    item_type="service",
                    item_id=service.id,
                    quantity=7,
                    unit_price=10.0,
                    discount=0
                )
            ]
        )
        
        print("\nCreating order for 7 units...")
        db_order = financial_crud.create_order(db, order_in)
        
        # 6. Verify Totals
        print(f"Order created: ID {db_order.id}")
        print(f"Subtotal: {db_order.subtotal} (Expected: 20.0)")
        print(f"Total: {db_order.total} (Expected: 23.2)")
        
        assert abs(db_order.subtotal - 20.0) < 0.01, f"Expected subtotal 20.0, got {db_order.subtotal}"
        assert abs(db_order.total - 23.2) < 0.01, f"Expected total 23.2, got {db_order.total}"
        
        # 7. Verify Amenity Quota reduction
        db.refresh(amenity)
        print(f"Remaining amenity quantity: {amenity.quantity} (Expected: 0)")
        assert amenity.quantity == 0, f"Expected amenity quantity 0, got {amenity.quantity}"
        
        # 8. Verify Amenity History
        history = db.query(models.AmenityHistory).filter(models.AmenityHistory.amenity_id == amenity.id).first()
        print(f"History record: Change={history.change}, Reason={history.reason}")
        assert history.change == -5, f"Expected history change -5, got {history.change}"
        assert f"Venta #{db_order.id}" in history.reason, f"Expected reason to contain order ID"

        print("\n--- TEST PASSED SUCCESSFULLY ---")

    except Exception as e:
        print(f"\n--- TEST FAILED ---")
        print(str(e))
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup (order matters because of foreign keys)
        try:
            db.query(models.AmenityHistory).filter(models.AmenityHistory.client_id == client.id).delete()
            db.query(models.Amenity).filter(models.Amenity.client_id == client.id).delete()
            db.query(models.Pedido).filter(models.Pedido.orden_id == db_order.id).delete()
            db.query(models.OrderAuditLog).filter(models.OrderAuditLog.orden_id == db_order.id).delete()
            db.delete(db_order)
            db.delete(service)
            db.delete(client)
            db.commit()
        except:
            db.rollback()
        db.close()

if __name__ == "__main__":
    test_amenity_order_deduction()
