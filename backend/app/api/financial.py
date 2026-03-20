from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from app import models
from app.api import deps
from app.api.deps import get_target_branch_id
from app.schemas import financial as schemas
from app.crud import financial as crud

router = APIRouter()

# --- PRODUCTS ---

@router.get("/products", response_model=List[schemas.Product])
def read_products(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_products(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/products", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not product.branch_id:
        product.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_product(db=db, product=product)

@router.put("/products/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    db_prod = crud.update_product(db=db, product_id=product_id, product_in=product)
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_prod

@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    success = crud.delete_product(db=db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}

# --- SERVICES ---

@router.get("/services", response_model=List[schemas.Service])
def read_services(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_services(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/services", response_model=schemas.Service)
def create_service(
    service: schemas.ServiceCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not service.branch_id:
        service.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_service(db=db, service=service)

@router.put("/services/{service_id}", response_model=schemas.Service)
def update_service(
    service_id: int,
    service: schemas.ServiceCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    db_svc = crud.update_service(db=db, service_id=service_id, params=service)
    if not db_svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return db_svc

@router.delete("/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not crud.delete_service(db=db, service_id=service_id):
        raise HTTPException(status_code=404, detail="Service not found")
    return {"ok": True}

# --- CONSUMABLE CATEGORIES ---

@router.get("/consumable-categories", response_model=List[schemas.ConsumableCategory])
def read_consumable_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_consumable_categories(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/consumable-categories", response_model=schemas.ConsumableCategory)
def create_consumable_category(
    category: schemas.ConsumableCategoryCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not category.branch_id:
        category.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_consumable_category(db=db, category=category)

@router.put("/consumable-categories/{category_id}", response_model=schemas.ConsumableCategory)
def update_consumable_category(
    category_id: int,
    category: schemas.ConsumableCategoryCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not category.branch_id:
        category.branch_id = current_user.branch_id or 1
    db_cat = crud.update_consumable_category(db=db, category_id=category_id, params=category)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_cat

@router.delete("/consumable-categories/{category_id}")
def delete_consumable_category(
    category_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not crud.delete_consumable_category(db=db, category_id=category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}

# --- CONSUMABLES ---

@router.get("/consumables", response_model=List[schemas.Consumable])
def read_consumables(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_consumables(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/consumables", response_model=schemas.Consumable)
def create_consumable(
    item: schemas.ConsumableCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not item.branch_id:
        item.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_consumable(db=db, item=item)

@router.put("/consumables/{item_id}", response_model=schemas.Consumable)
def update_consumable(
    item_id: int,
    item: schemas.ConsumableCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    db_item = crud.update_consumable(db=db, item_id=item_id, params=item)
    if not db_item:
        raise HTTPException(status_code=404, detail="Consumable not found")
    return db_item

@router.delete("/consumables/{item_id}")
def delete_consumable(
    item_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not crud.delete_consumable(db=db, item_id=item_id):
        raise HTTPException(status_code=404, detail="Consumable not found")
    return {"ok": True}

# --- CONSUMABLE USAGE ---

@router.get("/consumable-usage", response_model=List[schemas.ConsumableUsage])
def read_consumable_usages(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_consumable_usages(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/consumable-usage", response_model=schemas.ConsumableUsage)
def create_consumable_usage(
    usage: schemas.ConsumableUsageCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not usage.branch_id:
        usage.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_consumable_usage(db=db, usage=usage, user_email=current_user.email)

# --- VENTAS (ORDERS) ---

@router.get("/orders", response_model=List[schemas.Orden])
def read_orders(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_orders(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/orders", response_model=schemas.Orden)
def create_order(
    order: schemas.OrdenCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not order.branch_id:
        order.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_order(
        db=db,
        order=order,
        user_id=current_user.id,
        user_email=current_user.email
    )

@router.put("/orders/{order_id}", response_model=schemas.Orden)
def update_order(
    order_id: int,
    order_in: schemas.OrdenUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    order = crud.update_order(
        db=db,
        order_id=order_id,
        order_in=order_in,
        user_id=current_user.id,
        user_email=current_user.email
    )
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return order

@router.delete("/orders/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    reason: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    success = crud.delete_order(db=db, order_id=order_id, user_id=current_user.id, reason=reason)
    if not success:
        raise HTTPException(status_code=404, detail="Orden no encontrada o no pudo eliminarse")
    return None

from app.schemas import orders_audit as audit_schemas

@router.get("/orders/{order_id}/logs", response_model=List[audit_schemas.OrderAuditLogOut])
def read_order_logs(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    logs = crud.get_order_logs(db=db, order_id=order_id)
    # Map user info
    for log in logs:
        if log.user:
            log.user_email = log.user.email
    return logs

@router.get("/clients/{client_id}/statement")
def read_client_statement(
    client_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    return crud.get_client_statement(db=db, client_id=client_id)


# --- PURCHASES (COMPRAS) ---

@router.get("/purchases", response_model=List[schemas.Purchase])
def read_purchases(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_purchases(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/purchases", response_model=schemas.Purchase)
def create_purchase(
    purchase: schemas.PurchaseCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not purchase.branch_id:
        purchase.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_purchase(db=db, purchase=purchase)


# --- EXPENSES (GASTOS) ---

@router.get("/expenses", response_model=List[schemas.Expense])
def read_expenses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_expenses(db=db, branch_id=target_branch_id, skip=skip, limit=limit)

@router.post("/expenses", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not expense.branch_id:
        expense.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_expense(db=db, expense=expense)


# --- RECEIPTS (PAGOS Y ABONOS) ---

@router.get("/receipts", response_model=List[schemas.Receipt])
def read_receipts(
    db: Session = Depends(deps.get_db),
    order_id: int = None,
    purchase_id: int = None,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_receipts(db=db, branch_id=target_branch_id, order_id=order_id, purchase_id=purchase_id, skip=skip, limit=limit)

@router.post("/receipts", response_model=schemas.Receipt)
def create_receipt(
    receipt: schemas.ReceiptCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # Only income or expense allowed
    if receipt.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Invalid receipt type")
    
    return crud.create_receipt(db=db, receipt=receipt)


# --- RECEIVABLES ---

@router.get("/receivables", response_model=List[schemas.ReceivableSummary])
def read_receivables_summary(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_receivables_summary(db=db, branch_id=target_branch_id)


# --- CASH CATEGORIES ---

@router.get("/cash-categories", response_model=List[schemas.CashCategory])
def read_cash_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
):
    # Categories are now global, ignore branch_id
    return crud.get_cash_categories(db=db, branch_id=0, skip=skip, limit=limit)

@router.post("/cash-categories", response_model=schemas.CashCategory)
def create_cash_category(
    category: schemas.CashCategoryCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")

    # Categories are now global
    category.branch_id = None
    return crud.create_cash_category(db=db, category=category)

@router.put("/cash-categories/{category_id}", response_model=schemas.CashCategory)
def update_cash_category(
    category_id: int,
    category: schemas.CashCategoryUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")

    db_cat = crud.update_cash_category(db=db, category_id=category_id, params=category)
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_cat

@router.delete("/cash-categories/{category_id}")
def delete_cash_category(
    category_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")

    if not crud.delete_cash_category(db=db, category_id=category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}

# --- PAYMENT METHODS ---

@router.get("/payment-methods", response_model=List[schemas.PaymentMethod])
def read_payment_methods(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
):
    # Payment methods are now global
    return crud.get_payment_methods(db=db, branch_id=0, skip=skip, limit=limit)

@router.post("/payment-methods", response_model=schemas.PaymentMethod)
def create_payment_method(
    method: schemas.PaymentMethodCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")
        
    # Payment methods are now global
    method.branch_id = None
    return crud.create_payment_method(db=db, method=method)

@router.put("/payment-methods/{method_id}", response_model=schemas.PaymentMethod)
def update_payment_method(
    method_id: int,
    method: schemas.PaymentMethodUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")

    db_method = crud.update_payment_method(db=db, method_id=method_id, params=method)
    if not db_method:
        raise HTTPException(status_code=404, detail="Payment Method not found")
    return db_method

@router.delete("/payment-methods/{method_id}")
def delete_payment_method(
    method_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    # RBAC: Only Gerente or SuperAdmin
    is_authorized = current_user.is_superuser or (current_user.role and current_user.role.name == "Gerente")
    if not is_authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para gestionar catálogos")

    if not crud.delete_payment_method(db=db, method_id=method_id):
        raise HTTPException(status_code=404, detail="Payment Method not found")
    return {"ok": True}

# --- CASH MOVEMENTS ---

@router.get("/cash-movements", response_model=List[schemas.CashMovement])
def read_cash_movements(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    return crud.get_cash_movements(db=db, branch_id=target_branch_id, skip=skip, limit=limit)


@router.post("/cash-movements", response_model=schemas.CashMovement)
def create_cash_movement(
    movement: schemas.CashMovementCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not movement.branch_id:
        movement.branch_id = target_branch_id or current_user.branch_id or 1
    return crud.create_cash_movement(db=db, movement=movement)


@router.get("/financial-summary")
def get_financial_summary(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    """
    Returns a high-level summary of financial status for the branch.
    """
    branch_id = target_branch_id
    
    # Receivables (Total balance from summary)
    receivables = crud.get_receivables_summary(db=db, branch_id=branch_id)
    total_receivables = sum(r["balance"] for r in receivables)
    
    # Payables (PENDING payables for this branch)
    q_payables = db.query(func.sum(models.Payable.amount))
    if branch_id > 0:
        q_payables = q_payables.filter(models.Payable.branch_id == branch_id)
    total_payables = q_payables.filter(models.Payable.status == "pending").scalar() or 0.0
        
    # Cash movements balance
    q_income = db.query(func.sum(models.CashMovement.amount))
    q_expense = db.query(func.sum(models.CashMovement.amount))
    
    if branch_id > 0:
        q_income = q_income.filter(models.CashMovement.branch_id == branch_id)
        q_expense = q_expense.filter(models.CashMovement.branch_id == branch_id)
        
    income = q_income.filter(models.CashMovement.type == "income").scalar() or 0.0
    expense = q_expense.filter(models.CashMovement.type == "expense").scalar() or 0.0
        
    # Standard Income receipts (Sales)
    q_sales_income = db.query(func.sum(models.Receipt.amount)).join(models.Orden, models.Receipt.orden_id == models.Orden.id)
    if branch_id > 0:
        q_sales_income = q_sales_income.filter(models.Orden.branch_id == branch_id)
    sales_income = q_sales_income.filter(models.Receipt.type == "income").scalar() or 0.0
        
    # Standard Expense receipts (Purchases)
    q_purchase_expense = db.query(func.sum(models.Receipt.amount)).join(models.Purchase, models.Receipt.purchase_id == models.Purchase.id)
    if branch_id > 0:
        q_purchase_expense = q_purchase_expense.filter(models.Purchase.branch_id == branch_id)
    purchase_expense = q_purchase_expense.filter(models.Receipt.type == "expense").scalar() or 0.0

    current_cash = (income + sales_income) - (expense + purchase_expense)
    
    return {
        "total_receivables": total_receivables,
        "total_payables": total_payables,
        "current_cash": current_cash,
        "branch_id": branch_id
    }


@router.get("/dashboard-stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    """
    Returns consolidated statistics for the dashboard.
    """
    return crud.get_dashboard_stats(db=db, branch_id=target_branch_id)
