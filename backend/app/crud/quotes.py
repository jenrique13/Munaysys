from sqlalchemy.orm import Session
from typing import Optional
from app import models
from app.schemas import quotes as schemas

TAX_RATE = 0.16  # 16% IVA


def _recalculate_totals(items_data: list) -> tuple[float, float, float, float]:
    """Returns (subtotal, discount_total, tax, total) from a list of item dicts."""
    subtotal = sum(
        item.get("quantity", 1) * item.get("unit_price", 0.0)
        for item in items_data
    )
    discount_total = sum(item.get("discount", 0.0) for item in items_data)
    taxable = subtotal - discount_total
    tax = round(taxable * TAX_RATE, 2)
    total = round(taxable + tax, 2)
    return subtotal, discount_total, tax, total


# --- READ ---
def get_quotes(db: Session, branch_id: int, skip: int = 0, limit: int = 100):
    q = db.query(models.Quote)
    if branch_id > 0:
        q = q.filter(models.Quote.branch_id == branch_id)
    return (
        q.order_by(models.Quote.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_quote(db: Session, quote_id: int):
    return db.query(models.Quote).filter(models.Quote.id == quote_id).first()


# --- CREATE ---
def create_quote(db: Session, obj_in: schemas.QuoteCreate):
    items_data = [item.model_dump() for item in obj_in.items]

    # Calculate per-item subtotals
    for item in items_data:
        item["subtotal"] = round(item["quantity"] * item["unit_price"] - item["discount"], 2)

    subtotal, discount_total, tax, total = _recalculate_totals(items_data)

    db_quote = models.Quote(
        branch_id=obj_in.branch_id,
        title=obj_in.title,
        lead_id=obj_in.lead_id,
        client_id=obj_in.client_id,
        notes=obj_in.notes,
        expires_at=obj_in.expires_at,
        discount=discount_total + obj_in.discount,  # item discounts + header discount
        subtotal=subtotal,
        tax=tax,
        total=total,
    )
    db.add(db_quote)
    db.flush()  # get the new quote.id

    for item in items_data:
        db_item = models.QuoteItem(quote_id=db_quote.id, **item)
        db.add(db_item)

    db.commit()
    db.refresh(db_quote)
    return db_quote


# --- UPDATE ---
def update_quote(db: Session, quote_id: int, obj_in: schemas.QuoteUpdate):
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not db_quote:
        return None

    update_data = obj_in.model_dump(exclude_unset=True)
    new_items = update_data.pop("items", None)

    for key, value in update_data.items():
        setattr(db_quote, key, value)

    if new_items is not None:
        # Replace all items
        db.query(models.QuoteItem).filter(models.QuoteItem.quote_id == quote_id).delete()
        for item in new_items:
            item["subtotal"] = round(item["quantity"] * item["unit_price"] - item.get("discount", 0.0), 2)
            db.add(models.QuoteItem(quote_id=quote_id, **item))

        subtotal, discount_total, tax, total = _recalculate_totals(new_items)
        db_quote.subtotal = subtotal
        db_quote.tax = tax
        db_quote.total = total
        if "discount" not in update_data:
            db_quote.discount = discount_total

    db.commit()
    db.refresh(db_quote)
    return db_quote


# --- DELETE ---
def delete_quote(db: Session, quote_id: int):
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if db_quote:
        db.delete(db_quote)
        db.commit()
    return db_quote


# --- CONVERT TO ORDER ---
def convert_to_order(db: Session, quote_id: int, client_id: Optional[int] = None):
    """
    Creates an Orden from a Quote and marks the Quote as 'converted'.
    If client_id is None, it creates a new client using the quote's lead info.
    Returns (orden, quote) tuple.
    """
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if not db_quote:
        return None, None
    if db_quote.status == "converted":
        return None, db_quote  # Already converted

    if not client_id:
        if db_quote.lead_id:
            lead = db.query(models.Lead).filter(models.Lead.id == db_quote.lead_id).first()
            if lead:
                # See if client already exists from this lead
                existing_client = db.query(models.Client).filter(models.Client.lead_id == lead.id).first()
                if existing_client:
                    client_id = existing_client.id
                else:
                    new_client = models.Client(
                        name=lead.name,
                        email=lead.email,
                        phone=lead.phone,
                        branch_id=db_quote.branch_id,
                        lead_id=lead.id,
                        status="active"
                    )
                    db.add(new_client)
                    db.flush()
                    client_id = new_client.id
        if not client_id:
            return None, None  # Or raise an exception, no client nor lead

    # Verify the client exists in the same branch
    client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.branch_id == db_quote.branch_id
    ).first()
    if not client:
        return None, None

    # Create the Orden
    new_order = models.Orden(
        client_id=client_id,
        branch_id=db_quote.branch_id,
        subtotal=db_quote.subtotal,
        discount=db_quote.discount,
        tax=db_quote.tax,
        total=db_quote.total,
        status="pending",
    )
    db.add(new_order)
    db.flush()

    # Create Pedido (order details) from quote items
    for item in db_quote.items:
        pedido = models.Pedido(
            orden_id=new_order.id,
            item_type=item.item_type if item.item_type in ("product", "room", "office") else "product",
            item_id=item.item_id or 0,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount,
            subtotal=item.subtotal,
        )
        db.add(pedido)

    # Mark quote as converted
    db_quote.status = "converted"
    db_quote.converted_order_id = new_order.id

    db.commit()
    db.refresh(new_order)
    db.refresh(db_quote)
    return new_order, db_quote
