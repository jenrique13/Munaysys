from datetime import datetime
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class ExpenseUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def create_expense(self, expense_in: schemas.financial.expense.ExpenseCreate, current_user_branch_id: int = 1):
        # 1. Enrichment: Fallback for branch_id
        branch_id = expense_in.branch_id or current_user_branch_id or 1
        
        # 2. Enrichment: Fallback for exchange_rate if not provided
        ex_rate = expense_in.exchange_rate
        ex_curr = expense_in.exchange_currency or "usd"
        
        if ex_rate is None or ex_rate <= 0:
            latest_rate = self.uow.exchange_rates.get_latest()
            if latest_rate:
                ex_rate = latest_rate.eur_rate if ex_curr.lower() == "eur" else latest_rate.usd_rate
            else:
                ex_rate = 1.0
        
        # 3. Financial calculations
        amount = expense_in.amount
        subtotal = amount / 1.16
        tax = amount - subtotal

        # 4. Create Expense
        db_expense = models.Expense(
            amount=amount,
            subtotal=subtotal,
            tax=tax,
            exchange_rate=ex_rate,
            exchange_currency=ex_curr,
            category=expense_in.category,
            description=expense_in.description,
            provider=expense_in.provider,
            provider_id=expense_in.provider_id,
            payment_method=expense_in.payment_method,
            branch_id=branch_id,
            date=datetime.utcnow()
        )
        self.uow.db.add(db_expense)
        self.uow.db.flush() # To get db_expense.id
        
        # 5. Create Payable (Debt)
        payable_data = {
            "branch_id": branch_id,
            "provider_id": expense_in.provider_id,
            "amount": amount,
            "subtotal": subtotal,
            "tax": tax,
            "exchange_rate": ex_rate,
            "exchange_currency": ex_curr,
            "description": expense_in.description,
            "reference": expense_in.provider or "Gasto Directo",
            "due_date": datetime.utcnow(), # Default due date as today
            "status": "pending",
            "category": expense_in.category,
            "expense_id": db_expense.id
        }
        self.uow.payables.create(payable_data)
        
        self.uow.commit()
        self.uow.refresh(db_expense)
        return db_expense
