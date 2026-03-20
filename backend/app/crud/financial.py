from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Date
from app import models
from app.schemas import financial as schemas
from fastapi import HTTPException
from datetime import datetime, timedelta

# --- PRODUCTS ---

def get_products(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Product)
    if branch_id > 0:
        q = q.filter(models.Product.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product_stock(db: Session, product_id: int, quantity_change: int):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db_product.stock += quantity_change
        db.commit()
        db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_in: schemas.ProductCreate):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product: return None
    for k, v in product_in.model_dump().items():
        setattr(db_product, k, v)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product:
        db.delete(db_product)
        db.commit()
        return True
    return False

# --- SERVICES ---

def get_services(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Service)
    if branch_id > 0:
        q = q.filter(models.Service.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_service(db: Session, service: schemas.ServiceCreate):
    db_svc = models.Service(**service.model_dump())
    db.add(db_svc)
    db.commit()
    db.refresh(db_svc)
    return db_svc

def update_service(db: Session, service_id: int, params: schemas.ServiceCreate):
    db_svc = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not db_svc: return None
    for k, v in params.model_dump().items():
        setattr(db_svc, k, v)
    db.commit()
    db.refresh(db_svc)
    return db_svc

def delete_service(db: Session, service_id: int):
    db_svc = db.query(models.Service).filter(models.Service.id == service_id).first()
    if db_svc:
        db.delete(db_svc)
        db.commit()
        return True
    return False

# --- CONSUMABLE CATEGORIES ---

def get_consumable_categories(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.ConsumableCategory)
    if branch_id > 0:
        q = q.filter(models.ConsumableCategory.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_consumable_category(db: Session, category: schemas.ConsumableCategoryCreate):
    db_cat = models.ConsumableCategory(**category.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def update_consumable_category(db: Session, category_id: int, params: schemas.ConsumableCategoryCreate):
    db_cat = db.query(models.ConsumableCategory).filter(models.ConsumableCategory.id == category_id).first()
    if not db_cat: return None
    for k, v in params.model_dump().items():
        setattr(db_cat, k, v)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def delete_consumable_category(db: Session, category_id: int):
    db_cat = db.query(models.ConsumableCategory).filter(models.ConsumableCategory.id == category_id).first()
    if db_cat:
        db.delete(db_cat)
        db.commit()
        return True
    return False

# --- CONSUMABLES ---

def get_consumables(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Consumable)
    if branch_id > 0:
        q = q.filter(models.Consumable.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_consumable(db: Session, item: schemas.ConsumableCreate):
    db_item = models.Consumable(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_consumable(db: Session, item_id: int, params: schemas.ConsumableCreate):
    db_item = db.query(models.Consumable).filter(models.Consumable.id == item_id).first()
    if not db_item: return None
    for k, v in params.model_dump().items():
        setattr(db_item, k, v)
    db.commit()
    db.refresh(db_item)
    return db_item

def delete_consumable(db: Session, item_id: int):
    db_item = db.query(models.Consumable).filter(models.Consumable.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
        return True
    return False

# --- CONSUMABLE USAGE ---

def get_consumable_usages(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.ConsumableUsage).options(joinedload(models.ConsumableUsage.consumable))
    if branch_id > 0:
        q = q.filter(models.ConsumableUsage.branch_id == branch_id)
    return q.order_by(models.ConsumableUsage.created_at.desc()).offset(skip).limit(limit).all()

def create_consumable_usage(db: Session, usage: schemas.ConsumableUsageCreate, user_email: str):
    db_usage = models.ConsumableUsage(**usage.model_dump(), user_email=user_email)
    db.add(db_usage)
    
    # Subtract stock
    db_consumable = db.query(models.Consumable).filter(models.Consumable.id == usage.consumable_id).first()
    if db_consumable:
        db_consumable.stock = max(0, db_consumable.stock - usage.quantity)
        
    db.commit()
    db.refresh(db_usage)
    return db_usage

# --- ORDERS (Órdenes / Ventas) ---

def get_orders(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Orden)
    if branch_id > 0:
        q = q.filter(models.Orden.branch_id == branch_id)
    orders = q.offset(skip).limit(limit).all()
    _attach_item_names(db, orders)
    return orders

def _resolve_item_name(db: Session, item_type: str, item_id: int) -> str:
    """Resolve the human-readable name for an order detail item."""
    try:
        if item_type == 'product':
            obj = db.query(models.Product).filter(models.Product.id == item_id).first()
        elif item_type == 'service':
            obj = db.query(models.Service).filter(models.Service.id == item_id).first()
        elif item_type == 'office':
            obj = db.query(models.Office).filter(models.Office.id == item_id).first()
        elif item_type == 'room':
            obj = db.query(models.Room).filter(models.Room.id == item_id).first()
        else:
            obj = None
        return obj.name if obj else f"{item_type.capitalize()} #{item_id}"
    except Exception:
        return f"{item_type.capitalize()} #{item_id}"

def _attach_item_names(db: Session, orders):
    """Attach item_name to each Pedido in the orders (mutates the objects in-place)."""
    for order in orders:
        for detail in order.details:
            detail.item_name = _resolve_item_name(db, detail.item_type, detail.item_id)

def create_order(db: Session, order: schemas.OrdenCreate, user_id: int = None, user_email: str = None):
    # Calculate Subtotal from details (checking for amenities)
    calculated_subtotal = 0.0
    details_data = []
    amenities_used = False

    for detail in order.details:
        original_qty = float(detail.quantity)
        covered = 0.0
        amenity_obj = None
        old_qty = 0.0
        
        if detail.item_type == "service":
            svc = db.query(models.Service).filter(models.Service.id == detail.item_id).first()
            if svc and svc.is_amenity:
                # Find client's amenity quota by name (simplified catalog logic)
                amenity = db.query(models.Amenity).filter(
                    models.Amenity.client_id == order.client_id, 
                    models.Amenity.name == svc.name
                ).first()
                if amenity and amenity.quantity > 0:
                    covered = min(original_qty, float(amenity.quantity))
                    if covered > 0:
                        amenities_used = True
                    old_qty = amenity.quantity
                    amenity.quantity -= covered
                    amenity_obj = amenity
        elif detail.item_type == "room":
            # Direct category lookup for hours
            amenity = db.query(models.Amenity).filter(
                models.Amenity.client_id == order.client_id, 
                models.Amenity.category == "hours"
            ).first()
            if amenity and amenity.quantity > 0:
                covered = min(original_qty, float(amenity.quantity))
                if covered > 0:
                    amenities_used = True
                old_qty = amenity.quantity
                amenity.quantity -= covered
                amenity_obj = amenity

        charged_qty = original_qty - covered
        line_subtotal = (detail.unit_price * charged_qty) - detail.discount
        if line_subtotal < 0: line_subtotal = 0
        
        details_data.append({
            "detail": detail,
            "line_subtotal": line_subtotal,
            "covered": covered,
            "amenity": amenity_obj,
            "old_qty": old_qty
        })
        calculated_subtotal += line_subtotal

    # Resolve discount amount based on type
    discount_type = getattr(order, 'discount_type', 'amount')
    if discount_type == 'percentage':
        discount_amount = calculated_subtotal * (order.discount / 100.0)
    else:
        discount_amount = order.discount

    # Apply order-level discount
    taxable_base = calculated_subtotal - discount_amount
    if taxable_base < 0:
        taxable_base = 0

    # Calculate 16% IVA
    tax = taxable_base * 0.16
    total = taxable_base + tax

    # Automate status for amenity-only orders
    final_status = order.status
    if total <= 0 and amenities_used:
        final_status = "paid"

    # Create Order
    db_order = models.Orden(
        client_id=order.client_id,
        branch_id=order.branch_id,
        discount=discount_amount,  # Store the resolved $ amount
        discount_type=discount_type,
        status=final_status,
        subtotal=calculated_subtotal,
        tax=tax,
        total=total
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Create Details (Pedidos) and log amenity history
    for data in details_data:
        det = data["detail"]
        db_pedido = models.Pedido(
            orden_id=db_order.id,
            item_type=det.item_type,
            item_id=det.item_id,
            quantity=det.quantity,
            unit_price=det.unit_price,
            discount=det.discount,
            subtotal=data["line_subtotal"],
            start_time=det.start_time,
            end_time=det.end_time
        )
        db.add(db_pedido)

        # Log Amenity History if covered
        if data["covered"] > 0 and data["amenity"]:
            history = models.AmenityHistory(
                amenity_id=data["amenity"].id,
                client_id=order.client_id,
                old_quantity=data["old_qty"],
                new_quantity=data["amenity"].quantity,
                change=-data["covered"],
                reason=f"Venta #{db_order.id}"
            )
            db.add(history)

        # Update Stock if physical product
        if det.item_type == "product":
            update_product_stock(db, det.item_id, -det.quantity)

    # Auto-generate receipt for zero-total amenity orders
    if total <= 0 and amenities_used:
        db_receipt = models.Receipt(
            orden_id=db_order.id,
            client_id=order.client_id,
            amount=0.0,
            type="income",
            payment_method="Amenidades",
            reference="Cobro automático (Cuota de Amenidades)"
        )
        db.add(db_receipt)

    db.commit()
    db.refresh(db_order)

    # Audit log: record order creation with discount details
    if user_id:
        discount_label = f"{order.discount}%" if discount_type == 'percentage' else f"${discount_amount:.2f}"
        audit_log = models.OrderAuditLog(
            orden_id=db_order.id,
            user_id=user_id,
            action="created",
            reason="Orden creada",
            changes_json={
                "created_by": user_email or f"User #{user_id}",
                "discount_applied": discount_label,
                "discount_type": discount_type,
                "subtotal": calculated_subtotal,
                "tax": tax,
                "total": total
            }
        )
        db.add(audit_log)
        db.commit()

    return db_order


def update_order(db: Session, order_id: int, order_in: schemas.OrdenUpdate, user_id: int, user_email: str = None):
    db_order = db.query(models.Orden).filter(models.Orden.id == order_id).first()
    if not db_order:
        return None

    import json
    from fastapi.encoders import jsonable_encoder

    # Record "Before" state for the audit log
    old_state = jsonable_encoder(db_order)
    old_state["details"] = jsonable_encoder(db_order.details)
    old_discount = db_order.discount
    old_discount_type = db_order.discount_type

    # 1. Back out stock from old details if physical
    for detail in db_order.details:
        if detail.item_type == "product":
            update_product_stock(db, detail.item_id, detail.quantity) # Give stock back

    # 2. Update basic fields if provided
    if order_in.client_id is not None:
        db_order.client_id = order_in.client_id
    if order_in.discount is not None:
        db_order.discount = order_in.discount
    if order_in.discount_type is not None:
        db_order.discount_type = order_in.discount_type
    if order_in.status is not None:
        db_order.status = order_in.status

    # 3. Update details if provided
    if order_in.details is not None:
        # Delete old details
        db.query(models.Pedido).filter(models.Pedido.orden_id == order_id).delete()
        
        calculated_subtotal = 0.0
        for detail in order_in.details:
            line_subtotal = (detail.unit_price * detail.quantity) - detail.discount
            calculated_subtotal += line_subtotal
            
            db_pedido = models.Pedido(
                orden_id=db_order.id,
                item_type=detail.item_type,
                item_id=detail.item_id,
                quantity=detail.quantity,
                unit_price=detail.unit_price,
                discount=detail.discount,
                subtotal=line_subtotal,
                start_time=detail.start_time,
                end_time=detail.end_time
            )
            db.add(db_pedido)

            # Deduct stock for new details
            if detail.item_type == "product":
                update_product_stock(db, detail.item_id, -detail.quantity)

        db_order.subtotal = calculated_subtotal

    # 4. Recalculate totals based on discount_type
    current_discount_type = db_order.discount_type or 'amount'
    if current_discount_type == 'percentage':
        discount_amount = db_order.subtotal * (db_order.discount / 100.0)
    else:
        discount_amount = db_order.discount

    taxable_base = db_order.subtotal - discount_amount
    if taxable_base < 0:
        taxable_base = 0
    db_order.tax = taxable_base * 0.16
    db_order.total = taxable_base + db_order.tax

    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # 5. Save audit log with discount details
    new_state = jsonable_encoder(db_order)
    new_state["details"] = jsonable_encoder(db_order.details)

    # Build discount detail for audit
    discount_detail = {}
    if order_in.discount is not None or order_in.discount_type is not None:
        old_label = f"{old_discount}%" if old_discount_type == 'percentage' else f"${old_discount:.2f}"
        new_label = f"{db_order.discount}%" if db_order.discount_type == 'percentage' else f"${db_order.discount:.2f}"
        discount_detail = {"discount_before": old_label, "discount_after": new_label}

    audit_log = models.OrderAuditLog(
        orden_id=db_order.id,
        user_id=user_id,
        action="modified",
        reason=order_in.reason,
        changes_json={
            "modified_by": user_email or f"User #{user_id}",
            **discount_detail,
            "before": old_state,
            "after": new_state
        }
    )
    db.add(audit_log)
    db.commit()

    return db_order


def delete_order(db: Session, order_id: int, user_id: int, reason: str):
    db_order = db.query(models.Orden).filter(models.Orden.id == order_id).first()
    if not db_order:
        return False
        
    import json
    from fastapi.encoders import jsonable_encoder

    old_state = jsonable_encoder(db_order)
    old_state["details"] = jsonable_encoder(db_order.details)

    # 1. Back out stock
    for detail in db_order.details:
        if detail.item_type == "product":
            update_product_stock(db, detail.item_id, detail.quantity)

    # 2. We could soft delete, but for now we hard delete as per cascade, 
    # but we MUST save the log. Since order_id will disappear (CASCADE), 
    # we can either set orden_id dynamically or we change the foreign key to SET NULL
    # For now, let's keep the order conceptually deleted by setting its status
    
    db_order.status = "cancelled"
    
    audit_log = models.OrderAuditLog(
        orden_id=db_order.id,
        user_id=user_id,
        action="deleted",
        reason=reason,
        changes_json={"before": old_state, "after": {"status": "cancelled", "note": "Order was practically deleted but kept for log reference"}}
    )
    
    db.add(db_order)
    db.add(audit_log)
    db.commit()
    return True


def get_order_logs(db: Session, order_id: int):
    return db.query(models.OrderAuditLog).filter(models.OrderAuditLog.orden_id == order_id).order_by(models.OrderAuditLog.created_at.desc()).all()


def get_client_statement(db: Session, client_id: int):
    orders = db.query(models.Orden).options(joinedload(models.Orden.branch)).filter(models.Orden.client_id == client_id).all()
    receipts = db.query(models.Receipt).options(joinedload(models.Receipt.orden).joinedload(models.Orden.branch)).filter(
        models.Receipt.client_id == client_id,
        models.Receipt.type == "income"
    ).all()

    for r in receipts:
        if r.orden:
            r.branch = r.orden.branch
        else:
            r.branch = None

    total_charges = sum(o.total for o in orders if o.status != "cancelled")
    total_paid = sum(r.amount for r in receipts)
    balance = total_charges - total_paid

    return {
        "client_id": client_id,
        "total_charges": total_charges,
        "total_paid": total_paid,
        "balance": balance,
        "orders": orders,
        "receipts": receipts
    }


# --- PURCHASES (Compras) ---

def get_purchases(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Purchase)
    if branch_id > 0:
        q = q.filter(models.Purchase.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()


def create_purchase(db: Session, purchase: schemas.PurchaseCreate):
    calculated_subtotal = 0.0
    for detail in purchase.details:
        line_subtotal = detail.unit_cost * detail.quantity
        calculated_subtotal += line_subtotal

    tax = calculated_subtotal * 0.16
    total = calculated_subtotal + tax

    db_purchase = models.Purchase(
        provider_id=purchase.provider_id,
        provider_name=purchase.provider_name,
        branch_id=purchase.branch_id,
        status=purchase.status,
        subtotal=calculated_subtotal,
        tax=tax,
        total=total
    )
    db.add(db_purchase)
    db.commit()
    db.refresh(db_purchase)

    for detail in purchase.details:
        line_subtotal = detail.unit_cost * detail.quantity
        db_detail = models.PurchaseDetail(
            purchase_id=db_purchase.id,
            product_id=detail.product_id,
            description=detail.description,
            quantity=detail.quantity,
            unit_cost=detail.unit_cost,
            subtotal=line_subtotal
        )
        db.add(db_detail)

        # Update Stock if linked to a product (inventory entry)
        if detail.product_id:
            update_product_stock(db, detail.product_id, detail.quantity)

    # Auto-create Payable if provider is specified and not fully paid
    if purchase.provider_id and db_purchase.total > 0 and db_purchase.status in ["pending", "partial"]:
        new_payable = models.Payable(
            provider_id=purchase.provider_id,
            branch_id=purchase.branch_id,
            reference=f"Compra #{db_purchase.id}",
            amount=db_purchase.total,
            due_date=db_purchase.date or __import__("datetime").datetime.utcnow(),
            status=db_purchase.status,
            purchase_id=db_purchase.id
        )
        db.add(new_payable)

    db.commit()
    db.refresh(db_purchase)
    return db_purchase


# --- EXPENSES (Gastos) ---

def get_expenses(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Expense)
    if branch_id > 0:
        q = q.filter(models.Expense.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_expense(db: Session, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


# --- RECEIPTS (Recibos / Pagos) ---

def get_receipts(db: Session, branch_id: int = None, order_id: int = None, purchase_id: int = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Receipt)
    if order_id:
        query = query.filter(models.Receipt.orden_id == order_id)
    if purchase_id:
        query = query.filter(models.Receipt.purchase_id == purchase_id)
    return query.offset(skip).limit(limit).all()

def update_document_payment_status(db: Session, model, document_id: int):
    # Recalculate status for order or purchase based on receipts
    doc = db.query(model).filter(model.id == document_id).first()
    if not doc:
        return
    
    total_paid = sum(r.amount for r in doc.receipts)
    
    # Tolerancia de centavos para evitar problemas de coma flotante
    if total_paid >= doc.total - 0.01:
        doc.status = "paid"
    elif total_paid > 0:
        doc.status = "partial"
    else:
        doc.status = "pending"
        
    # Update linked Payable status if it's a Purchase
    if hasattr(doc, "__tablename__") and doc.__tablename__ == "purchases":
        linked_payable = db.query(models.Payable).filter(models.Payable.purchase_id == doc.id).first()
        if linked_payable:
            linked_payable.status = doc.status
            if doc.status == "paid":
                linked_payable.paid_date = __import__("datetime").datetime.utcnow()
            else:
                linked_payable.paid_date = None

    # NEW: If it's an Order and it is now Paid or Partial, occupy the rooms/offices
    if hasattr(doc, "__tablename__") and doc.__tablename__ == "orders" and doc.status in ["paid", "partial"]:
        for detail in doc.details:
            if detail.item_type == "room":
                room = db.query(models.Room).filter(models.Room.id == detail.item_id).first()
                if room and room.status != "ocupado":
                    room.status = "ocupado"
                    logger = __import__("logging").getLogger(__name__)
                    logger.info(f"Room {room.id} marked as OCUPADO due to Payment in Order {doc.id}")
                
                # NEW: Instant Reservation logic
                if detail.start_time and detail.end_time:
                    # Check if booking already exists for this order item
                    existing_booking = db.query(models.Booking).filter(
                        models.Booking.orden_id == doc.id,
                        models.Booking.room_id == detail.item_id
                    ).first()
                    
                    if not existing_booking:
                        # Calculate total hours
                        delta = detail.end_time - detail.start_time
                        total_hours = delta.total_seconds() / 3600
                        
                        db_booking = models.Booking(
                            room_id=detail.item_id,
                            client_id=doc.client_id,
                            start_time=detail.start_time,
                            end_time=detail.end_time,
                            status="confirmed",
                            total_hours=total_hours,
                            total_cost=detail.subtotal,
                            orden_id=doc.id,
                            notes=f"Reserva automática desde Orden #{doc.id}"
                        )
                        db.add(db_booking)
                        logger = __import__("logging").getLogger(__name__)
                        logger.info(f"Automatic Booking created for Room {detail.item_id} from Order {doc.id}")

            elif detail.item_type == "office":
                off = db.query(models.Office).filter(models.Office.id == detail.item_id).first()
                if off and off.status != "ocupado":
                    off.status = "ocupado"
                    logger = __import__("logging").getLogger(__name__)
                    logger.info(f"Office {off.id} marked as OCUPADO due to Payment in Order {doc.id}")

                # Auto-create Membership for the occupied office
                if off:
                    # Check if a membership already exists linked to this order
                    existing_membership = db.query(models.Membership).filter(
                        models.Membership.client_id == doc.client_id,
                        models.Membership.office_id == off.id,
                        models.Membership.status == "active"
                    ).first()

                    if not existing_membership:
                        # Use the date of the most recent receipt as the start_date
                        latest_receipt = max(doc.receipts, key=lambda r: r.date) if doc.receipts else None
                        start_date = latest_receipt.date if latest_receipt else __import__("datetime").datetime.utcnow()

                        db_membership = models.Membership(
                            client_id=doc.client_id,
                            office_id=off.id,
                            plan_name=f"Membresía {off.name}",
                            start_date=start_date,
                            end_date=None,  # Open-ended, managed manually or by contract
                            hours_included=0.0,  # 0 = unlimited
                            hours_used=0.0,
                            price=off.monthly_rate,
                            status="active"
                        )
                        db.add(db_membership)
                        logger = __import__("logging").getLogger(__name__)
                        logger.info(f"Auto-Membership created for Client {doc.client_id} / Office {off.id} from Order {doc.id}")


    db.commit()


def create_receipt(db: Session, receipt: schemas.ReceiptCreate):
    db_receipt = models.Receipt(**receipt.model_dump())
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)

    # Automatically update corresponding Order or Purchase status
    if db_receipt.orden_id and db_receipt.type == "income":
        update_document_payment_status(db, models.Orden, db_receipt.orden_id)
    
    if db_receipt.purchase_id and db_receipt.type == "expense":
        update_document_payment_status(db, models.Purchase, db_receipt.purchase_id)

    return db_receipt


# --- CASH CATEGORIES ---

def get_cash_categories(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.CashCategory)
    if branch_id > 0:
        q = q.filter(models.CashCategory.branch_id == branch_id)
    return q.offset(skip).limit(limit).all()

def create_cash_category(db: Session, category: schemas.CashCategoryCreate):
    db_cat = models.CashCategory(**category.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def update_cash_category(db: Session, category_id: int, params: schemas.CashCategoryUpdate):
    db_cat = db.query(models.CashCategory).filter(models.CashCategory.id == category_id).first()
    if not db_cat: return None
    for k, v in params.model_dump(exclude_unset=True).items():
        setattr(db_cat, k, v)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def delete_cash_category(db: Session, category_id: int):
    db_cat = db.query(models.CashCategory).filter(models.CashCategory.id == category_id).first()
    if db_cat:
        db.delete(db_cat)
        db.commit()
        return True
    return False

# --- CASH MOVEMENTS ---

def get_cash_movements(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.CashMovement)
    if branch_id > 0:
        q = q.filter(models.CashMovement.branch_id == branch_id)
    return q.order_by(models.CashMovement.date.desc()).offset(skip).limit(limit).all()

def create_cash_movement(db: Session, movement: schemas.CashMovementCreate):
    db_movement = models.CashMovement(**movement.model_dump())
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement


# --- RECEIVABLES ---

def get_receivables_summary(db: Session, branch_id: int):
    from sqlalchemy import func
    
    # 1. Total charges per client (Orders not cancelled)
    charges_sub = db.query(
        models.Orden.client_id,
        func.sum(models.Orden.total).label("total_charges"),
        func.max(models.Orden.date).label("last_order_date")
    ).filter(models.Orden.status != "cancelled")
    
    if branch_id > 0:
        charges_sub = charges_sub.filter(models.Orden.branch_id == branch_id)
        
    charges_sub = charges_sub.group_by(models.Orden.client_id).subquery()
    
    # 2. Total payments per client (Income receipts)
    payments_sub = db.query(
        models.Receipt.client_id,
        func.sum(models.Receipt.amount).label("total_paid")
    ).filter(models.Receipt.type == "income")
    
    # Filter receipts by branch if needed (though they should match orders)
    # receipts don't have branch_id? Let's check models.py
    # Re-checking models.py: Receipt does NOT have branch_id. 
    # But we can join with Orden if we assume receipts are always tied to ordens, 
    # but some are 'General'.
    
    # Actually, model Receipt DOES NOT have branch_id in models.py (line 371)
    # Wait, looking at models.py again:
    # class Receipt(Base): line 371
    # class CashMovement(Base): line 510 (added by me)
    
    payments_sub = payments_sub.group_by(models.Receipt.client_id).subquery()
    
    # 3. Join with Clients
    query = db.query(
        models.Client.id.label("client_id"),
        models.Client.name.label("client_name"),
        func.coalesce(charges_sub.c.total_charges, 0).label("total_charges"),
        func.coalesce(payments_sub.c.total_paid, 0).label("total_paid"),
        charges_sub.c.last_order_date
    ).outerjoin(charges_sub, models.Client.id == charges_sub.c.client_id)\
     .outerjoin(payments_sub, models.Client.id == payments_sub.c.client_id)
     
    if branch_id > 0:
        query = query.filter(models.Client.branch_id == branch_id)
        
    results = query.all()
    
    summary = []
    for r in results:
        balance = r.total_charges - r.total_paid
        if balance > 0.01: # Only show those who owe
            summary.append({
                "client_id": r.client_id,
                "client_name": r.client_name,
                "balance": balance,
                "last_order_date": r.last_order_date
            })
            
    return summary


def get_dashboard_stats(db: Session, branch_id: int):
    # Time window: last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # 1. Total Sales & Sales Trend
    sales_q = db.query(
        cast(models.Orden.date, Date).label('day'),
        func.sum(models.Orden.total).label('total')
    )
    if branch_id > 0:
        sales_q = sales_q.filter(models.Orden.branch_id == branch_id)
        
    sales_q = sales_q.filter(
        models.Orden.date >= start_date, 
        models.Orden.status != 'cancelled'
    ).group_by(cast(models.Orden.date, Date)).order_by(cast(models.Orden.date, Date)).all()
    
    total_sales = sum([s.total for s in sales_q])
    sales_trend = [{"date": s.day.isoformat(), "amount": s.total} for s in sales_q]
    
    # 2. Total Expenses & Expenses Trend (including purchases)
    expenses_q = db.query(
        cast(models.Expense.date, Date).label('day'),
        func.sum(models.Expense.amount).label('total')
    )
    if branch_id > 0:
        expenses_q = expenses_q.filter(models.Expense.branch_id == branch_id)
        
    expenses_q = expenses_q.filter(
        models.Expense.date >= start_date
    ).group_by(cast(models.Expense.date, Date)).order_by(cast(models.Expense.date, Date)).all()
    
    total_expenses = sum([e.total for e in expenses_q])
    expenses_trend = [{"date": e.day.isoformat(), "amount": e.total} for e in expenses_q]
    
    # 3. Category Distribution (Sales by item_type)
    category_q = db.query(
        models.Pedido.item_type,
        func.sum(models.Pedido.subtotal).label('total')
    ).join(models.Orden)
    if branch_id > 0:
        category_q = category_q.filter(models.Orden.branch_id == branch_id)
        
    category_q = category_q.filter(
        models.Orden.date >= start_date, 
        models.Orden.status != 'cancelled'
    ).group_by(models.Pedido.item_type).all()
    
    category_distribution = []
    if total_sales > 0:
        for c in category_q:
            category_distribution.append({
                "category": c.item_type.capitalize(),
                "amount": c.total,
                "percentage": (c.total / total_sales) * 100
            })
    
    # 4. Occupancy Stats
    now = datetime.now()
    q_active = db.query(models.Pedido).join(models.Orden)
    if branch_id > 0:
        q_active = q_active.filter(models.Orden.branch_id == branch_id)
        
    active_occupancy = q_active.filter(
        models.Pedido.item_type.in_(['room', 'office']),
        models.Pedido.start_time <= now,
        models.Pedido.end_time >= now,
        models.Orden.status != 'cancelled'
    ).count()
    
    q_room_cap = db.query(models.Room).filter(models.Room.is_active == True)
    q_off_cap = db.query(models.Office).filter(models.Office.is_active == True)
    
    if branch_id > 0:
        q_room_cap = q_room_cap.filter(models.Room.branch_id == branch_id)
        q_off_cap = q_off_cap.filter(models.Office.branch_id == branch_id)
        
    total_capacity = q_room_cap.count() + q_off_cap.count()
    
    occupancy_stats = {
        "total_slots": total_capacity,
        "occupied_slots": active_occupancy,
        "percentage": (active_occupancy / total_capacity * 100) if total_capacity > 0 else 0
    }
    
    return {
        "total_sales": total_sales,
        "total_expenses": total_expenses,
        "net_profit": total_sales - total_expenses,
        "sales_trend": sales_trend,
        "expenses_trend": expenses_trend,
        "category_distribution": category_distribution,
        "occupancy_stats": occupancy_stats,
        "branch_id": branch_id
    }

# --- PAYMENT METHODS ---

def get_payment_methods(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    query = db.query(models.PaymentMethod)
    if branch_id > 0:
        query = query.filter(models.PaymentMethod.branch_id == branch_id)
    return query.offset(skip).limit(limit).all()

def create_payment_method(db: Session, method: schemas.PaymentMethodCreate):
    db_method = models.PaymentMethod(**method.dict())
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method

def update_payment_method(db: Session, method_id: int, params: schemas.PaymentMethodUpdate):
    db_method = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == method_id).first()
    if not db_method:
        return None
    for key, value in params.dict(exclude_unset=True).items():
        setattr(db_method, key, value)
    db.commit()
    db.refresh(db_method)
    return db_method

def delete_payment_method(db: Session, method_id: int):
    db_method = db.query(models.PaymentMethod).filter(models.PaymentMethod.id == method_id).first()
    if not db_method:
        return False
    db.delete(db_method)
    db.commit()
    return True
