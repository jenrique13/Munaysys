from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from typing import List, Optional
from datetime import datetime

from app import models
from app.api import deps
from app.api.deps import get_target_branch_id, get_uow
from app.schemas import financial as schemas
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.financial import (
    GetFinancialDataUseCase,
    OrderUseCases,
    PaymentUseCases,
    InventoryUseCases,
    DashboardUseCases
)

router = APIRouter()

# --- PRODUCTS ---

@router.get("/products", response_model=List[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_products(target_branch_id, skip=skip, limit=limit)

@router.post("/products", response_model=schemas.Product)
def create_product(
    product_in: schemas.ProductCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not product_in.branch_id:
        product_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_product = uow.products.create(product_in.model_dump())
    uow.commit()
    uow.refresh(db_product)
    return db_product

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_in: schemas.ProductCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_product = uow.products.get(product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    uow.products.update(db_product, product_in.model_dump())
    uow.commit()
    uow.refresh(db_product)
    return db_product

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.products.remove(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    uow.commit()
    return {"ok": True}

# --- SERVICES ---

@router.get("/services", response_model=List[schemas.Service])
def read_services(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_services(target_branch_id, skip=skip, limit=limit)

@router.post("/services", response_model=schemas.Service)
def create_service(
    service_in: schemas.ServiceCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not service_in.branch_id:
        service_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_service = uow.services.create(service_in.model_dump())
    uow.commit()
    uow.refresh(db_service)
    return db_service

@router.put("/services/{id}", response_model=schemas.Service)
def update_service(
    id: int,
    service_in: schemas.ServiceCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_service = uow.services.get(id)
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    uow.services.update(db_service, service_in.model_dump())
    uow.commit()
    uow.refresh(db_service)
    return db_service

@router.delete("/services/{id}")
def delete_service(
    id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.services.remove(id):
        raise HTTPException(status_code=404, detail="Service not found")
    uow.commit()
    return {"ok": True}

# --- CONSUMABLE CATEGORIES ---

@router.get("/consumable-categories", response_model=List[schemas.ConsumableCategory])
def read_consumable_categories(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    # Using the generic repository's get_all or get_by_branch
    if hasattr(uow.consumable_categories, 'get_by_branch'):
        return uow.consumable_categories.get_by_branch(target_branch_id, skip, limit)
    else:
        # Fallback to get_all if get_by_branch doesn't exist
        cats = uow.consumable_categories.get_all(skip, limit)
        return [c for c in cats if c.branch_id == target_branch_id]

@router.post("/consumable-categories", response_model=schemas.ConsumableCategory)
def create_consumable_category(
    category_in: schemas.ConsumableCategoryCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not category_in.branch_id:
        category_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_cat = uow.consumable_categories.create(category_in.model_dump())
    uow.commit()
    uow.refresh(db_cat)
    return db_cat

@router.put("/consumable-categories/{id}", response_model=schemas.ConsumableCategory)
def update_consumable_category(
    id: int,
    category_in: schemas.ConsumableCategoryCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_cat = uow.consumable_categories.get(id)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    uow.consumable_categories.update(db_cat, category_in.model_dump())
    uow.commit()
    uow.refresh(db_cat)
    return db_cat

@router.delete("/consumable-categories/{id}")
def delete_consumable_category(
    id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.consumable_categories.remove(id):
        raise HTTPException(status_code=404, detail="Category not found")
    uow.commit()
    return {"ok": True}

# --- CONSUMABLES ---

@router.get("/consumables", response_model=List[schemas.Consumable])
def read_consumables(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return uow.consumables.get_by_branch(target_branch_id, skip, limit)

@router.post("/consumables", response_model=schemas.Consumable)
def create_consumable(
    consumable_in: schemas.ConsumableCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not consumable_in.branch_id:
        consumable_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    db_consumable = uow.consumables.create(consumable_in.model_dump())
    uow.commit()
    uow.refresh(db_consumable)
    return db_consumable

@router.put("/consumables/{id}", response_model=schemas.Consumable)
def update_consumable(
    id: int,
    consumable_in: schemas.ConsumableCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_consumable = uow.consumables.get(id)
    if not db_consumable:
        raise HTTPException(status_code=404, detail="Consumable not found")
    
    uow.consumables.update(db_consumable, consumable_in.model_dump())
    uow.commit()
    uow.refresh(db_consumable)
    return db_consumable

@router.delete("/consumables/{id}")
def delete_consumable(
    id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.consumables.remove(id):
        raise HTTPException(status_code=404, detail="Consumable not found")
    uow.commit()
    return {"ok": True}

@router.post("/consumable-usage", response_model=schemas.ConsumableUsage)
def record_usage(
    usage_in: schemas.ConsumableUsageCreate,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = InventoryUseCases(uow)
    return use_case.record_usage(usage_in, user_email=current_user.email)

# --- ORDERS (VENTAS) ---

@router.get("/orders", response_model=List[schemas.Orden])
def read_orders(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_orders(target_branch_id, skip=skip, limit=limit, search=search, status=status)

@router.post("/orders", response_model=schemas.Orden)
def create_order(
    order_in: schemas.OrdenCreate,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = OrderUseCases(uow)
    db_order = use_case.create(order_in)
    uow.commit()
    uow.refresh(db_order)
    return db_order

@router.get("/orders/{order_id}", response_model=schemas.Orden)
def read_order(
    order_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    order = use_case.get_order_details(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/orders/{order_id}/logs")
def get_order_logs(
    order_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    db_order = uow.orders.get(order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    logs = uow.db.query(models.OrderAuditLog).filter(
        models.OrderAuditLog.orden_id == order_id
    ).order_by(models.OrderAuditLog.created_at.desc()).all()
    
    return [
        {
            "id": log.id,
            "action": log.action,
            "reason": log.reason,
            "changes": log.changes_json,
            "created_at": log.created_at,
            "user_email": log.user.email if log.user else "Sistema",
            "user_id": log.user_id
        }
        for log in logs
    ]

@router.put("/orders/{order_id}", response_model=schemas.Orden)
def update_order(
    order_id: int,
    order_in: schemas.OrdenUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = OrderUseCases(uow)
    try:
        updated_order = use_case.update(order_id, order_in, user_email=current_user.email)
        if not updated_order:
            raise HTTPException(status_code=404, detail="Order not found")
        uow.commit()
        uow.refresh(updated_order)
        return updated_order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/orders/{order_id}")
def delete_order(
    order_id: int,
    reason: Optional[str] = Query(None),
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = OrderUseCases(uow)
    if not use_case.delete(order_id, user_email=current_user.email, reason=reason):
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}

# --- RECEIPTS (PAGOS) ---

@router.post("/receipts", response_model=schemas.Receipt)
def record_payment(
    receipt_in: schemas.ReceiptCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    uow: UnitOfWork = Depends(get_uow),
):
    if idempotency_key:
        existing_key = uow.db.query(models.IdempotencyKey).filter_by(key=idempotency_key).first()
        if existing_key:
            raise HTTPException(status_code=409, detail="Operación duplicada: Idempotency-Key ya procesado.")
        
        ik = models.IdempotencyKey(key=idempotency_key, request_path="/api/financial/receipts")
        uow.db.add(ik)
        uow.db.flush()

    use_case = PaymentUseCases(uow)
    return use_case.record_receipt(receipt_in)

@router.post("/client-payments", response_model=List[schemas.Receipt])
def record_client_payment(
    payment_in: schemas.ClientPaymentCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    target_branch_id: int = Depends(get_target_branch_id),
    current_user: models.User = Depends(deps.get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    if idempotency_key:
        existing_key = uow.db.query(models.IdempotencyKey).filter_by(key=idempotency_key).first()
        if existing_key:
            raise HTTPException(status_code=409, detail="Operación duplicada: Idempotency-Key ya procesado.")
        
        ik = models.IdempotencyKey(key=idempotency_key, request_path="/api/financial/client-payments")
        uow.db.add(ik)
        uow.db.flush()

    if not payment_in.branch_id:
        payment_in.branch_id = target_branch_id or current_user.branch_id or 1
    use_case = PaymentUseCases(uow)
    try:
        return use_case.record_client_payment(payment_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- EXPENSES ---

@router.get("/expenses", response_model=List[schemas.Expense])
def read_expenses(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_expenses(target_branch_id, skip=skip, limit=limit)

@router.post("/expenses", response_model=schemas.Expense)
def create_expense(
    expense_in: schemas.ExpenseCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    from app.use_cases.financial.expense_use_cases import ExpenseUseCases
    use_case = ExpenseUseCases(uow)
    return use_case.create_expense(expense_in, current_user_branch_id=target_branch_id or current_user.branch_id or 1)

# --- PURCHASES ---

@router.get("/purchases", response_model=List[schemas.Purchase])
def read_purchases(
    skip: int = 0,
    limit: int = 100,
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_purchases(target_branch_id, skip=skip, limit=limit)

@router.post("/purchases", response_model=schemas.Purchase)
def create_purchase(
    purchase_in: schemas.PurchaseCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    branch_id = purchase_in.branch_id or target_branch_id or current_user.branch_id or 1

    subtotal = sum(d.unit_cost * d.quantity for d in purchase_in.details)
    tax = subtotal * 0.16
    total = subtotal + tax

    db_purchase = models.Purchase(
        provider_name=purchase_in.provider_name,
        provider_id=purchase_in.provider_id,
        branch_id=branch_id,
        subtotal=subtotal,
        tax=tax,
        total=total,
        status=purchase_in.status,
        date=datetime.utcnow()
    )
    uow.db.add(db_purchase)
    uow.db.flush()

    for d in purchase_in.details:
        effective_product_id = d.product_id
        effective_consumable_id = d.consumable_id

        if d.item_type == "product":
            if not effective_product_id and d.description:
                # Check if a product with this name already exists in the branch
                existing = uow.db.query(models.Product).filter(
                    models.Product.name == d.description,
                    models.Product.branch_id == branch_id
                ).first()

                if existing:
                    effective_product_id = existing.id
                else:
                    if not d.sales_price or d.sales_price <= 0:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"El precio de venta es obligatorio para el nuevo producto: {d.description}"
                        )
                    # Create new product in the branch inventory
                    new_product = models.Product(
                        name=d.description,
                        description=f"Creado automáticamente desde compra a {purchase_in.provider_name}",
                        price=d.sales_price,
                        stock=0,
                        type="physical",
                        is_active=True,
                        branch_id=branch_id
                    )
                    uow.db.add(new_product)
                    uow.db.flush()
                    effective_product_id = new_product.id
            
            if effective_product_id:
                uow.products.update_stock(effective_product_id, d.quantity)

        elif d.item_type == "consumable":
            if not effective_consumable_id and d.description:
                # Check if a consumable with this name already exists
                existing = uow.db.query(models.Consumable).filter(
                    models.Consumable.name == d.description,
                    models.Consumable.branch_id == branch_id
                ).first()

                if existing:
                    effective_consumable_id = existing.id
                else:
                    # Create new consumable
                    new_consumable = models.Consumable(
                        name=d.description,
                        description=f"Creado automáticamente desde compra a {purchase_in.provider_name}",
                        unit=d.unit or "unidad",
                        stock=0,
                        cost=d.unit_cost,
                        branch_id=branch_id,
                        is_active=True
                    )
                    uow.db.add(new_consumable)
                    uow.db.flush()
                    effective_consumable_id = new_consumable.id
            
            if effective_consumable_id:
                # Note: consumable repo update_stock uses -=, so we pass negative to ADD stock
                uow.consumables.update_stock(effective_consumable_id, -d.quantity)

        db_detail = models.PurchaseDetail(
            purchase_id=db_purchase.id,
            product_id=effective_product_id,
            consumable_id=effective_consumable_id,
            item_type=d.item_type,
            description=d.description,
            quantity=d.quantity,
            unit=d.unit,
            unit_cost=d.unit_cost,
            sales_price=d.sales_price or 0.0,
            subtotal=d.unit_cost * d.quantity
        )
        uow.db.add(db_detail)

    # --- AUTO-CREATE PAYABLE ---
    payable_data = {
        "branch_id": branch_id,
        "provider_id": purchase_in.provider_id,
        "amount": total,
        "subtotal": subtotal,
        "tax": tax,
        "exchange_rate": 1.0, # Default for purchases if not specified
        "exchange_currency": "usd", # Or whatever default
        "description": f"Compra a {purchase_in.provider_name}",
        "reference": purchase_in.provider_name,
        "due_date": datetime.utcnow(),
        "status": "pending",
        "category": purchase_in.category or "Compras",
        "purchase_id": db_purchase.id
    }
    uow.payables.create(payable_data)

    uow.commit()
    uow.refresh(db_purchase)
    return db_purchase

# --- DASHBOARD & SUMMARIES & STATEMENTS ---

@router.get("/clients/{client_id}/statement", response_model=schemas.ClientStatement)
def get_client_statement_api(
    client_id: int,
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    statement = use_case.get_client_statement(client_id, branch_id=target_branch_id, month=month, year=year)
    if not statement:
        raise HTTPException(status_code=404, detail="Client not found")
    return statement

@router.get("/financial-summary", response_model=schemas.FinancialSummary)
def get_financial_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = DashboardUseCases(uow)
    return use_case.get_financial_summary(target_branch_id, month=month, year=year)

@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = DashboardUseCases(uow)
    return use_case.get_dashboard_stats(target_branch_id)

@router.get("/receivables", response_model=List[schemas.ReceivableSummary])
def get_receivables(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = GetFinancialDataUseCase(uow)
    return use_case.get_receivables(target_branch_id)

@router.get("/cash-movements", response_model=List[schemas.CashMovement])
def get_cash_movements(
    skip: int = 0,
    limit: int = 100,
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.cash_movements.get_by_branch(target_branch_id, skip=skip, limit=limit, month=month, year=year)

# --- CASH CATEGORIES ---

@router.get("/cash-categories", response_model=List[schemas.CashCategory])
def read_cash_categories(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.cash_categories.get_all(branch_id=target_branch_id)

@router.post("/cash-categories", response_model=schemas.CashCategory)
def create_cash_category(
    category_in: schemas.CashCategoryCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not category_in.branch_id:
        category_in.branch_id = target_branch_id or current_user.branch_id
    
    db_cat = uow.cash_categories.create(category_in.model_dump())
    uow.commit()
    uow.refresh(db_cat)
    return db_cat

@router.put("/cash-categories/{id}", response_model=schemas.CashCategory)
def update_cash_category(
    id: int,
    category_in: schemas.CashCategoryUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_cat = uow.cash_categories.get(id)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    uow.cash_categories.update(db_cat, category_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_cat)
    return db_cat

@router.delete("/cash-categories/{id}")
def delete_cash_category(
    id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.cash_categories.remove(id):
        raise HTTPException(status_code=404, detail="Category not found")
    uow.commit()
    return {"ok": True}

# --- PAYMENT METHODS ---

@router.get("/payment-methods", response_model=List[schemas.PaymentMethod])
def read_payment_methods(
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    return uow.payment_methods.get_active(branch_id=target_branch_id)

@router.post("/payment-methods", response_model=schemas.PaymentMethod)
def create_payment_method(
    method_in: schemas.PaymentMethodCreate,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not method_in.branch_id:
        method_in.branch_id = target_branch_id or current_user.branch_id
    
    db_method = uow.payment_methods.create(method_in.model_dump())
    uow.commit()
    uow.refresh(db_method)
    return db_method

@router.put("/payment-methods/{id}", response_model=schemas.PaymentMethod)
def update_payment_method(
    id: int,
    method_in: schemas.PaymentMethodUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    db_method = uow.payment_methods.get(id)
    if not db_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    uow.payment_methods.update(db_method, method_in.model_dump(exclude_unset=True))
    uow.commit()
    uow.refresh(db_method)
    return db_method

@router.delete("/payment-methods/{id}")
def delete_payment_method(
    id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    if not uow.payment_methods.remove(id):
        raise HTTPException(status_code=404, detail="Payment method not found")
    uow.commit()
    return {"ok": True}
