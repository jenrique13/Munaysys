from typing import List, Optional
from app.uow.unit_of_work import UnitOfWork

class GetFinancialDataUseCase:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def get_products(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.products.get_by_branch(branch_id, skip, limit)

    def get_services(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.services.get_by_branch(branch_id, skip, limit)

    def get_packages(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.packages.get_by_branch(branch_id, skip, limit)

    def get_orders(self, branch_id: int, skip: int = 0, limit: int = 100, search: str = None, status: str = None):
        return self.uow.orders.get_by_branch(branch_id, skip, limit, search=search, status=status)

    def get_order_details(self, order_id: int):
        return self.uow.orders.get_with_details(order_id)

    def get_receipts(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.receipts.get_by_branch(branch_id, skip, limit)

    def get_payment_methods(self, branch_id: int):
        return self.uow.payment_methods.get_active(branch_id)

    def get_cash_categories(self, branch_id: int):
        return self.uow.cash_categories.get_all(branch_id)

    def get_client_statement(self, client_id: int, branch_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None):
        from app.models import Orden, Receipt, Amenity, AmenityHistory
        from sqlalchemy import extract
        
        # 1. Fetch orders for client
        orders_q = self.uow.db.query(Orden).filter(Orden.client_id == client_id)
        if branch_id and branch_id > 0:
            orders_q = orders_q.filter(Orden.branch_id == branch_id)
        
        if year:
            orders_q = orders_q.filter(extract('year', Orden.date) == year)
        if month and month > 0:
            orders_q = orders_q.filter(extract('month', Orden.date) == month)
            
        # Excluir explicitamente ordenes canceladas del calculo de deuda
        all_orders = orders_q.all()
        orders = [o for o in all_orders if o.status != 'cancelled']
        
        # 2. Fetch receipts for client
        order_ids = [o.id for o in orders]
        
        receipts_q = self.uow.db.query(Receipt).filter(
            (Receipt.client_id == client_id) | (Receipt.orden_id.in_(order_ids) if order_ids else False)
        )
        if branch_id and branch_id > 0:
            receipts_q = receipts_q.filter(Receipt.branch_id == branch_id)
        
        if year:
            receipts_q = receipts_q.filter(extract('year', Receipt.date) == year)
        if month and month > 0:
            receipts_q = receipts_q.filter(extract('month', Receipt.date) == month)
            
        receipts = receipts_q.all()
        
        # 3. Fetch Amenities
        amenities = self.uow.db.query(Amenity).filter(Amenity.client_id == client_id, Amenity.is_active == True).all()
        
        # 4. Fetch Amenity History
        from sqlalchemy.orm import joinedload
        history_q = self.uow.db.query(AmenityHistory).options(joinedload(AmenityHistory.amenity)).filter(AmenityHistory.client_id == client_id)
        if year:
            history_q = history_q.filter(extract('year', AmenityHistory.created_at) == year)
        if month and month > 0:
            history_q = history_q.filter(extract('month', AmenityHistory.created_at) == month)
        
        amenity_history = history_q.order_by(AmenityHistory.created_at.desc()).all()
        
        # 5. Calculate Totals
        total_charges = sum(o.total for o in orders)
        total_paid = sum(r.amount for r in receipts if r.type == 'income')
        balance = total_charges - total_paid
        
        return {
            "client_id": client_id,
            "total_charges": total_charges,
            "total_paid": total_paid,
            "balance": balance,
            "orders": orders,
            "receipts": receipts,
            "amenities": amenities,
            "amenity_history": amenity_history
        }

    def get_receivables(self, branch_id: int) -> List[dict]:
        """Fetch list of clients with outstanding balances."""
        from sqlalchemy import func
        from app.models import Client, Orden, Receipt

        # Total charges per client (GLOBAL)
        orders_subq = self.uow.db.query(
            Orden.client_id,
            func.sum(Orden.total).label('total_charges'),
            func.max(Orden.date).label('last_order_date')
        ).filter(Orden.status != 'cancelled').group_by(Orden.client_id).subquery()

        # Total payments per client (GLOBAL)
        receipts_subq = self.uow.db.query(
            Receipt.client_id,
            func.sum(Receipt.amount).label('total_paid')
        ).filter(Receipt.type == 'income').group_by(Receipt.client_id).subquery()

        # Base query joining clients with global charges and payments
        query = self.uow.db.query(
            Client.id,
            Client.name,
            func.coalesce(orders_subq.c.total_charges, 0).label('total_charges'),
            func.coalesce(receipts_subq.c.total_paid, 0).label('total_paid'),
            orders_subq.c.last_order_date
        ).outerjoin(orders_subq, Client.id == orders_subq.c.client_id)\
         .outerjoin(receipts_subq, Client.id == receipts_subq.c.client_id)

        # If branch_id > 0, we ONLY want clients who have AT LEAST ONE order in this specific branch.
        if branch_id > 0:
            branch_clients_subq = self.uow.db.query(Orden.client_id)\
                .filter(Orden.branch_id == branch_id)\
                .distinct().subquery()
            
            query = query.join(branch_clients_subq, Client.id == branch_clients_subq.c.client_id)

        results = []
        for row in query.all():
            balance = row.total_charges - row.total_paid
            if balance > 0.01:
                results.append({
                    "client_id": row.id,
                    "client_name": row.name,
                    "balance": balance,
                    "last_order_date": row.last_order_date
                })
        
        return sorted(results, key=lambda x: x["balance"], reverse=True)

    def get_expenses(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.expenses.get_by_branch(branch_id, skip, limit)

    def get_purchases(self, branch_id: int, skip: int = 0, limit: int = 100):
        return self.uow.purchases.get_by_branch(branch_id, skip, limit)

    def get_provider_statement(self, provider_id: int, branch_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None, status: Optional[str] = None):
        from app.models import Purchase, Expense, Receipt, Provider, Payable, CashMovement, ExchangeRate
        from sqlalchemy import extract
        from datetime import datetime
        
        provider = self.uow.providers.get(provider_id)
        if not provider:
            return None
            
        # Helper to get exchange rate for a date
        def get_rate(d):
            if not d: return 1.0
            dt = d.date() if isinstance(d, datetime) else d
            rate_obj = self.uow.db.query(ExchangeRate).filter(ExchangeRate.date <= dt).order_by(ExchangeRate.date.desc()).first()
            return rate_obj.usd_rate if rate_obj else 1.0

        # 1. Fetch Purchases
        purchases_q = self.uow.db.query(Purchase).filter(Purchase.provider_id == provider_id)
        if branch_id and branch_id > 0:
            purchases_q = purchases_q.filter(Purchase.branch_id == branch_id)
        if year:
            purchases_q = purchases_q.filter(extract('year', Purchase.date) == year)
        if month and month > 0:
            purchases_q = purchases_q.filter(extract('month', Purchase.date) == month)
            
        if status == 'pending':
            purchases_q = purchases_q.filter(Purchase.status.in_(['pending', 'partial']))
        elif status == 'paid':
            purchases_q = purchases_q.filter(Purchase.status == 'paid')
        elif status == 'cancelled':
            purchases_q = purchases_q.filter(Purchase.status == 'cancelled')
            
        purchases = purchases_q.all()
        
        # 2. Fetch Expenses
        expenses_q = self.uow.db.query(Expense).filter(Expense.provider_id == provider_id)
        if branch_id and branch_id > 0:
            expenses_q = expenses_q.filter(Expense.branch_id == branch_id)
        if year:
            expenses_q = expenses_q.filter(extract('year', Expense.date) == year)
        if month and month > 0:
            expenses_q = expenses_q.filter(extract('month', Expense.date) == month)
            
        if status == 'pending':
            expenses = []
        elif status == 'cancelled':
            expenses = []
        else:
            expenses = expenses_q.all()

        # 2.5 Fetch Payables (Debt not linked to purchase/expense)
        payables_q = self.uow.db.query(Payable).filter(
            Payable.provider_id == provider_id,
            Payable.purchase_id == None,
            Payable.expense_id == None
        )
        if branch_id and branch_id > 0:
            payables_q = payables_q.filter(Payable.branch_id == branch_id)
        if year:
            payables_q = payables_q.filter(extract('year', Payable.created_at) == year)
        if month and month > 0:
            payables_q = payables_q.filter(extract('month', Payable.created_at) == month)
        
        if status == 'pending':
            payables_q = payables_q.filter(Payable.status.in_(['pending', 'partial']))
        elif status == 'paid':
            payables_q = payables_q.filter(Payable.status == 'paid')
        
        payables = payables_q.all()
        
        # 3. Fetch Payments (Receipts)
        all_purchase_ids_q = self.uow.db.query(Purchase.id).filter(Purchase.provider_id == provider_id)
        all_provider_purchase_ids = [r[0] for r in all_purchase_ids_q.all()]
        
        receipts_q = self.uow.db.query(Receipt).filter(
            Receipt.type == 'expense',
            Receipt.purchase_id.in_(all_provider_purchase_ids) if all_provider_purchase_ids else False
        )
        if branch_id and branch_id > 0:
            receipts_q = receipts_q.filter(Receipt.branch_id == branch_id)
        if year:
            receipts_q = receipts_q.filter(extract('year', Receipt.date) == year)
        if month and month > 0:
            receipts_q = receipts_q.filter(extract('month', Receipt.date) == month)
            
        if status in ['pending', 'cancelled']:
            receipts = []
        else:
            receipts = receipts_q.all()

        # 3.5 Fetch Payments from CashMovements (Legacy or direct payments)
        cash_moves = []
        if status not in ['pending', 'cancelled']:
            cm_q = self.uow.db.query(CashMovement).filter(
                CashMovement.provider_name == provider.name,
                CashMovement.type == 'expense'
            )
            if branch_id and branch_id > 0:
                cm_q = cm_q.filter(CashMovement.branch_id == branch_id)
            if year: cm_q = cm_q.filter(extract('year', CashMovement.date) == year)
            if month and month > 0: cm_q = cm_q.filter(extract('month', CashMovement.date) == month)
            cash_moves = cm_q.all()
        
        # 4. Build Transactions List with Bs logic
        transactions = []
        
        for p in purchases:
            rate = get_rate(p.date)
            transactions.append({
                "id": p.id,
                "date": p.date,
                "type": "purchase",
                "description": f"Compra #{p.id}",
                "reference": p.provider_name,
                "amount": p.total,
                "exchange_rate": rate,
                "amount_bs": p.total * rate,
                "status": p.status
            })
            
        for e in expenses:
            rate = e.exchange_rate or get_rate(e.date)
            transactions.append({
                "id": e.id,
                "date": e.date,
                "type": "expense",
                "description": e.description or f"Gasto #{e.id}",
                "reference": e.category,
                "amount": e.amount,
                "exchange_rate": rate,
                "amount_bs": e.amount * rate,
                "status": "paid"
            })

        for pa in payables:
            rate = pa.exchange_rate or get_rate(pa.created_at)
            transactions.append({
                "id": pa.id,
                "date": pa.created_at,
                "type": "payable",
                "description": pa.reference or f"Cta. por Pagar #{pa.id}",
                "reference": pa.category,
                "amount": pa.amount,
                "exchange_rate": rate,
                "amount_bs": pa.amount * rate,
                "status": pa.status
            })
            
        for r in receipts:
            rate = r.exchange_rate or get_rate(r.date)
            transactions.append({
                "id": r.id,
                "date": r.date,
                "type": "payment",
                "description": f"Pago a Compra #{r.purchase_id}",
                "reference": r.reference or r.payment_method,
                "amount": r.amount,
                "exchange_rate": rate,
                "amount_bs": r.amount * rate,
                "status": "paid"
            })

        for cm in cash_moves:
            rate = cm.exchange_rate or get_rate(cm.date)
            transactions.append({
                "id": cm.id,
                "date": cm.date,
                "type": "payment",
                "description": cm.description or f"Pago Directo #{cm.id}",
                "reference": cm.payment_method,
                "amount": cm.amount,
                "exchange_rate": rate,
                "amount_bs": cm.amount * rate,
                "status": "paid"
            })
            
        transactions.sort(key=lambda x: x["date"], reverse=True)
        
        # 5. Totals
        tp = sum(t["amount"] for t in transactions if t["type"] == "purchase")
        te = sum(t["amount"] for t in transactions if t["type"] == "expense")
        tpa = sum(t["amount"] for t in transactions if t["type"] == "payable")
        tpaid = sum(t["amount"] for t in transactions if t["type"] == "payment")

        tp_bs = sum(t["amount_bs"] for t in transactions if t["type"] == "purchase")
        te_bs = sum(t["amount_bs"] for t in transactions if t["type"] == "expense")
        tpa_bs = sum(t["amount_bs"] for t in transactions if t["type"] == "payable")
        tpaid_bs = sum(t["amount_bs"] for t in transactions if t["type"] == "payment")
        
        balance = (tp + te + tpa) - tpaid
        balance_bs = (tp_bs + te_bs + tpa_bs) - tpaid_bs
        
        return {
            "provider_id": provider_id,
            "provider_name": provider.name,
            "total_purchases": tp + tpa,
            "total_expenses": te,
            "total_paid": tpaid,
            "balance": balance,
            "total_purchases_bs": tp_bs + tpa_bs,
            "total_expenses_bs": te_bs,
            "total_paid_bs": tpaid_bs,
            "balance_bs": balance_bs,
            "transactions": transactions
        }
