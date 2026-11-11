from datetime import datetime, timezone
from typing import List, Optional, Tuple
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork

class QuoteUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def _calculate_quote_totals(self, subtotal: float, discount: float, discount_type: str, apply_tax: bool):
        if discount_type == 'percentage':
            discount_amount = subtotal * (discount / 100.0)
        else:
            discount_amount = discount
        
        taxable_amount = subtotal - discount_amount
        tax = taxable_amount * 0.16 if apply_tax else 0.0
        total = taxable_amount + tax
        return tax, total

    def create(self, quote_in: schemas.quotes.QuoteCreate):
        # 1. Create Quote base
        db_quote = models.Quote(
            title=quote_in.title,
            lead_id=quote_in.lead_id,
            client_id=quote_in.client_id,
            branch_id=quote_in.branch_id,
            notes=quote_in.notes,
            expires_at=quote_in.expires_at,
            discount=quote_in.discount,
            discount_type=quote_in.discount_type,
            apply_tax=quote_in.apply_tax,
            status="draft",
            created_at=datetime.now(timezone.utc),
            subtotal=0.0,
            tax=0.0,
            total=0.0
        )

        # 2. Add items via relationship
        subtotal = 0.0
        for item in quote_in.items:
            line_subtotal = (item.unit_price * item.quantity) - item.discount
            subtotal += line_subtotal
            
            db_item = models.QuoteItem(
                item_type=item.item_type,
                item_id=item.item_id,
                description=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount=item.discount,
                subtotal=line_subtotal,
                start_time=item.start_time,
                end_time=item.end_time,
                service_id=item.service_id
            )
            db_quote.items.append(db_item)

        # 3. Final calculations
        tax, total = self._calculate_quote_totals(subtotal, quote_in.discount, quote_in.discount_type, quote_in.apply_tax)
        db_quote.subtotal = subtotal
        db_quote.tax = tax
        db_quote.total = total

        self.uow.quotes.add(db_quote)
        self.uow.commit()
        self.uow.refresh(db_quote)
        return db_quote

    def convert_to_order(self, quote_id: int, client_id: Optional[int] = None) -> Tuple[Optional[models.Orden], Optional[models.Quote]]:
        """
        Convierte un presupuesto en orden atómicamente.
        """
        db_quote = self.uow.quotes.get_with_details(quote_id)
        if not db_quote or db_quote.status == "converted":
            return None, db_quote

        # 1. Resolve Client
        if not client_id:
            client_id = db_quote.client_id
            if not client_id and db_quote.lead_id:
                lead = self.uow.leads.get(db_quote.lead_id)
                if lead:
                    client = self.uow.clients.get_or_create_from_lead(lead)
                    client_id = client.id

        if not client_id:
            return None, db_quote

        # 2. Create Order (consistent with regular Orders)
        item_discounts = sum(it.discount for it in db_quote.items)
        net_subtotal = db_quote.subtotal # it was already net of item_discounts in create()
        header_discount = db_quote.discount

        db_order = models.Orden(
            client_id=client_id,
            branch_id=db_quote.branch_id,
            subtotal=net_subtotal,
            discount=header_discount,
            discount_type=db_quote.discount_type,
            tax=db_quote.tax,
            total=db_quote.total,
            apply_tax=db_quote.apply_tax,
            status="pending",
            date=datetime.now(timezone.utc)
        )
        self.uow.orders.add(db_order)
        self.uow.orders.flush()

        # 3. Convert items to Pedidos
        for item in db_quote.items:
            db_pedido = models.Pedido(
                orden_id=db_order.id,
                item_type=item.item_type if item.item_type in ("product", "room", "office") else "product",
                item_id=item.item_id or 0,
                item_name=item.description,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount=item.discount,
                subtotal=item.subtotal,
                start_time=item.start_time,
                end_time=item.end_time,
                service_id=item.service_id
            )
            self.uow.pedidos.add(db_pedido)

            # Create booking if it's a room
            if item.item_type == "room" and item.start_time and item.end_time:
                db_booking = models.Booking(
                    room_id=item.item_id,
                    client_id=client_id,
                    start_time=item.start_time,
                    end_time=item.end_time,
                    status="confirmed",
                    total_hours=item.quantity,
                    total_cost=item.subtotal,
                    orden_id=db_order.id,
                    service_id=item.service_id
                )
                self.uow.bookings.add(db_booking)

        # 4. Mark quote as converted
        db_quote.status = "converted"
        db_quote.converted_order_id = db_order.id
        db_quote.client_id = client_id

        self.uow.commit()
        self.uow.refresh(db_order)
        self.uow.refresh(db_quote)
        return db_order, db_quote

    def delete(self, quote_id: int):
        if self.uow.quotes.remove(quote_id):
            self.uow.commit()
            return True
        return False
