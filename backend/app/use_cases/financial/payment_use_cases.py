from datetime import datetime
from typing import Optional
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class PaymentUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def record_receipt(self, receipt_in: schemas.financial.receipt.ReceiptCreate, commit: bool = True):
        # 1. Fetch related data for enrichment
        order = None
        if receipt_in.orden_id:
            order = self.uow.orders.get(receipt_in.orden_id)
            
        client = None
        if receipt_in.client_id:
            client = self.uow.clients.get(receipt_in.client_id)
            
        # Determine branch_id (Incoming > Order > Default 1)
        branch_id = receipt_in.branch_id
        if not branch_id and order:
            branch_id = order.branch_id
        if not branch_id:
            branch_id = 1

        # 2. Enrichment: Fallback for exchange_rate if not provided
        ex_rate = receipt_in.exchange_rate
        ex_curr = receipt_in.exchange_currency or "usd"
        
        if ex_rate is None or ex_rate <= 0:
            latest_rate = self.uow.exchange_rates.get_latest()
            if latest_rate:
                ex_rate = latest_rate.eur_rate if ex_curr.lower() == "eur" else latest_rate.usd_rate
            else:
                ex_rate = 1.0 # Emergency fallback
        
        # 3. Create Receipt
        db_receipt = models.Receipt(
            amount=receipt_in.amount,
            igtf_amount=receipt_in.igtf_amount or 0.0,
            exchange_rate=ex_rate,
            exchange_currency=ex_curr,
            type=receipt_in.type,
            payment_method=receipt_in.payment_method,
            reference=receipt_in.reference,
            client_id=receipt_in.client_id,
            orden_id=receipt_in.orden_id,
            purchase_id=receipt_in.purchase_id,
            branch_id=branch_id,
            date=datetime.utcnow()
        )
        self.uow.receipts.add(db_receipt)
        self.uow.receipts.flush()
        
        # 3. Update Order status if linked
        if order:
            # Reajustar el total de la orden sumando el IGTF si aplica (solo si es el recibo nuevo)
            if db_receipt not in order.receipts and db_receipt.igtf_amount and db_receipt.igtf_amount > 0:
                order.igtf_amount = getattr(order, 'igtf_amount', 0.0) + db_receipt.igtf_amount
                order.total += db_receipt.igtf_amount

            # Note: We sum amount (debt payment) only, as IGTF is added to debt but paid separately
            total_paid = sum(r.amount for r in order.receipts)
            if db_receipt not in order.receipts:
                total_paid += db_receipt.amount
                
            if total_paid >= (order.total - 0.01):
                order.status = "paid"
            elif total_paid > 0:
                order.status = "partial"

        # 4. Handle Cash Flow Movement
        # Determine category based on order items or purchase
        category = "Ingreso General"
        if receipt_in.type == "expense":
            category = "Egreso General"
            if receipt_in.purchase_id:
                purchase = self.uow.purchases.get(receipt_in.purchase_id)
                if purchase and purchase.category:
                    category = purchase.category
        if order:
            # Check for specific item types to determine the most accurate category
            # We prioritize: office > room > service > product
            # Use lowercase for comparison and check for plural versions
            office_detail = next((d for d in order.details if d.item_type.lower() in ["office", "offices"]), None)
            room_detail = next((d for d in order.details if d.item_type.lower() in ["room", "rooms"]), None)
            
            if office_detail:
                office = self.uow.offices.query().filter(models.Office.id == office_detail.item_id).first()
                category = office.category if office and office.category else "Office"
            elif room_detail:
                room = self.uow.rooms.query().filter(models.Room.id == room_detail.item_id).first()
                category = room.type if room and room.type else "Rooms"
            else:
                # Fallback to general item types
                item_types = [d.item_type.lower() for d in order.details]
                if any(t in item_types for t in ["service", "services"]):
                    category = "Services"
                elif any(t in item_types for t in ["product", "products"]):
                    category = "Products"
                else:
                    category = "Ventas"

        description = f"Pago recibido ref: {receipt_in.reference or 'N/A'}"
        if receipt_in.type == "expense":
            description = f"Pago realizado ref: {receipt_in.reference or 'N/A'}"

        if receipt_in.igtf_amount and receipt_in.igtf_amount > 0:
            description += f" (Base: {receipt_in.amount:.2f} | IGTF: {receipt_in.igtf_amount:.2f})"

        cash_move = models.CashMovement(
            branch_id=branch_id,
            amount=receipt_in.amount,
            exchange_rate=ex_rate,
            exchange_currency=ex_curr,
            type=receipt_in.type,
            category=category,
            description=description,
            payment_method=receipt_in.payment_method,
            client_name=client.name if client else None,
            igtf_amount=receipt_in.igtf_amount or 0.0,
            receipt_id=db_receipt.id,
            date=datetime.utcnow()
        )
        self.uow.cash_movements.add(cash_move)

        if commit:
            self.uow.commit()
            self.uow.refresh(db_receipt)
        else:
            self.uow.receipts.flush()
        return db_receipt

    def record_client_payment(self, payment_in: schemas.financial.receipt.ClientPaymentCreate):
        # 1. Get all pending or partial orders for the client in the specified branch
        query = self.uow.orders.query().filter(
            models.Orden.client_id == payment_in.client_id,
            models.Orden.status.in_(["pending", "partial"])
        )
        if payment_in.branch_id:
            query = query.filter(models.Orden.branch_id == payment_in.branch_id)
            
        orders = query.with_for_update().order_by(models.Orden.date.asc(), models.Orden.id.asc()).all()

        if not orders:
            raise ValueError("El cliente no tiene órdenes pendientes para cobrar.")

        remaining_amount = payment_in.amount
        remaining_igtf = payment_in.igtf_amount
        created_receipts = []

        for order in orders:
            if remaining_amount <= 0.009: # Tolerance
                break

            # Calculate current debt (IGTF is separate)
            total_paid = sum(r.amount for r in order.receipts)
            debt = round(order.total - total_paid, 2)

            if debt <= 0:
                continue

            # Determine amount to pay for this order
            amount_to_pay = min(remaining_amount, debt)

            # Assign IGTF only to the first receipt
            current_igtf = remaining_igtf
            remaining_igtf = 0.0

            # Create receipt
            receipt_data = schemas.financial.receipt.ReceiptCreate(
                amount=amount_to_pay,
                exchange_currency=payment_in.exchange_currency or "usd",
                exchange_rate=payment_in.exchange_rate,
                type="income",
                payment_method=payment_in.payment_method,
                reference=payment_in.reference,
                client_id=payment_in.client_id,
                orden_id=order.id,
                branch_id=payment_in.branch_id or order.branch_id,
                igtf_amount=current_igtf
            )

            # record_receipt automatically updates order status and creates cash movement
            db_receipt = self.record_receipt(receipt_data, commit=False)
            created_receipts.append(db_receipt)

            remaining_amount -= amount_to_pay

        self.uow.commit()
        for r in created_receipts:
            self.uow.refresh(r)

        return created_receipts
