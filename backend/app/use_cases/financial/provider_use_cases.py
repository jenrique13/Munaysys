from datetime import datetime
from typing import Optional
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class ProviderUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def update_payable(self, payable_id: int, payable_in: any):
        db_payable = self.uow.payables.get(payable_id)
        if not db_payable:
            return None
            
        was_pending = db_payable.status in ["pending", "partial"]
        
        # Simple update
        update_data = payable_in.model_dump(exclude_unset=True)
        self.uow.payables.update(db_payable, update_data)
        
        # ── AUTO-GENERATE CASH MOVEMENT ──────────────────────────
        # Logic from legacy crud: if marked as paid, record outflow
        if was_pending and db_payable.status == "paid":
            provider = self.uow.providers.get(db_payable.provider_id) if db_payable.provider_id else None
            
            cash_move = models.CashMovement(
                branch_id=db_payable.branch_id,
                amount=db_payable.amount + (update_data.get('igtf_amount') or 0.0),
                exchange_rate=db_payable.exchange_rate,
                exchange_currency=db_payable.exchange_currency,
                type="expense",
                category=db_payable.category or "Pago de Factura/Deuda",
                description=db_payable.reference or f"Pago Cta. #{db_payable.id}",
                provider_name=provider.name if provider else None,
                payment_method=db_payable.payment_method,
                igtf_amount=update_data.get('igtf_amount') or 0.0,
                date=datetime.utcnow()
            )
            self.uow.db.add(cash_move)
            
        self.uow.commit()
        self.uow.refresh(db_payable)
        return db_payable
    def create_payable(self, payable_in: schemas.financial.providers.PayableCreate):
        data = payable_in.model_dump()
        
        # If created as 'paid' immediately, we should record the cash movement too
        # But usually payables are created as 'pending'.
        # For now, let's just create the record.
        db_payable = self.uow.payables.create(data)
        self.uow.commit()
        self.uow.refresh(db_payable)
        return db_payable
