from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime, func, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Branch(Base):
    __tablename__ = "branches"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    config_json = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    color = Column(String, default="#6366f1")


class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    permissions_json = Column(JSON, default={})

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    status = Column(String, default="active")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    access_permissions = Column(JSON, default={
        "crm": True,
        "operative": True,
        "financial": True,
        "configuration": False
    })
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    role = relationship("Role")
    branch = relationship("Branch")

# --- CRM MODULE ---

class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    
    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    name = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    color = Column(String, default="#E2E8F0")
    probability = Column(Integer, default=0) # 0 to 100
    
    branch = relationship("Branch")

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    company = Column(String)
    source = Column(String) # Referido, Web, etc.
    status = Column(String, default="active", index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, default=0)
    ci_rif = Column(String, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    branch = relationship("Branch")
    assigned_user = relationship("User")

class Opportunity(Base):
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id"), nullable=False, index=True)
    estimated_value = Column(Float, default=0.0)
    probability = Column(Integer, default=0) # 0 to 100
    expected_close_date = Column(DateTime(timezone=True))
    won_date = Column(DateTime(timezone=True), nullable=True)
    lost_reason = Column(String, nullable=True)
    
    lead = relationship("Lead")
    stage = relationship("PipelineStage")

# --- OPERATIVE MODULE ---

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, index=True)
    phone = Column(String)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)  # CRM link (optional)
    status = Column(String, default="active", index=True)  # active, inactive, suspended
    ci_rif = Column(String, nullable=True, index=True)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")
    lead = relationship("Lead")
    memberships = relationship("Membership", back_populates="client")

class Office(Base):
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    category = Column(String, default="privada")  # privada, suite, loft
    capacity = Column(Integer, default=1)
    monthly_rate = Column(Float, default=0.0)
    status = Column(String, default="disponible") # disponible, ocupado, mantenimiento
    is_active = Column(Boolean, default=True)
    amenities_json = Column(JSON, default=[])
    description = Column(String)

    branch = relationship("Branch")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    type = Column(String, default="sala_reuniones")  # sala_reuniones, auditorio, hot_desk
    capacity = Column(Integer, default=1)
    hourly_rate = Column(Float, default=0.0)
    status = Column(String, default="disponible") # disponible, ocupado, mantenimiento
    is_active = Column(Boolean, default=True)
    amenities_json = Column(JSON, default=[])
    description = Column(String)

    branch = relationship("Branch")
    bookings = relationship("Booking", back_populates="room")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    # space can be an office or a general plan (nullable = floating membership)
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=True)
    plan_name = Column(String, nullable=False)  # Ej: "Coworker Full", "Oficina Privada"
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    hours_included = Column(Float, default=0.0)  # 0 = unlimited
    hours_used = Column(Float, default=0.0)
    price = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, expired, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="memberships")
    office = relationship("Office")

class ContractTemplate(Base):
    __tablename__ = "contract_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "Oficina Privada", "Suite Ejecutiva"
    space_type = Column(String, nullable=False)  # "privada" | "suite" | "loft" | "sala_reuniones" | "general"
    body_html = Column(String, nullable=False)  # Full HTML template content
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)  # null = global template
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    branch = relationship("Branch")

class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Ej: "Casillero", "Línea telefónica", "Parking"
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    space_id = Column(Integer, nullable=True)   # ID of the office/room
    space_type = Column(String, nullable=True)  # "office" or "room"
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    quantity = Column(Integer, default=1)
    available = Column(Boolean, default=True)
    unit = Column(String, default="unidad")  # unidad, hora, día, mes
    price = Column(Float, default=0.0)
    category = Column(String, nullable=True) # parking, printing, hours, desk
    description = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=False)
    monthly_quota = Column(Integer, default=0)

    branch = relationship("Branch")
    client = relationship("Client")

class AmenityHistory(Base):
    __tablename__ = "amenity_history"

    id = Column(Integer, primary_key=True, index=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    old_quantity = Column(Float, nullable=False)
    new_quantity = Column(Float, nullable=False)
    change = Column(Float, nullable=False)
    reason = Column(String, nullable=True) # "booking", "manual_adjustment", "monthly_renewal"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    amenity = relationship("Amenity")
    client = relationship("Client")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="confirmed")  # confirmed, cancelled, pending
    total_hours = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    orden_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    notes = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("Room", back_populates="bookings")
    client = relationship("Client")


# --- FINANCIAL MODULE ---

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    price = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    price = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    is_amenity = Column(Boolean, default=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")

class ConsumableCategory(Base):
    __tablename__ = "consumable_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    branch = relationship("Branch")


class Consumable(Base):
    __tablename__ = "consumables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    category_id = Column(Integer, ForeignKey("consumable_categories.id"), nullable=True)
    cost = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    unit = Column(String, default="unit")
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")
    category = relationship("ConsumableCategory")

class ConsumableUsage(Base):
    __tablename__ = "consumable_usage"

    id = Column(Integer, primary_key=True, index=True)
    consumable_id = Column(Integer, ForeignKey("consumables.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(String)
    user_email = Column(String) # Track who made the output
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)

    consumable = relationship("Consumable")
    branch = relationship("Branch")

class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    price = Column(Float, default=0.0)
    items_json = Column(JSON, default=[])  # Defines configuration of the package
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")


class Orden(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    discount_type = Column(String, default="amount")  # amount | percentage
    tax = Column(Float, default=0.0)  # 16% IVA
    total = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending, partial, paid, cancelled

    client = relationship("Client")
    branch = relationship("Branch")
    details = relationship("Pedido", back_populates="orden", cascade="all, delete")
    receipts = relationship("Receipt", back_populates="orden")


class Pedido(Base):
    __tablename__ = "order_details"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_type = Column(String, nullable=False)  # product, package, amenity, room
    item_id = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    orden = relationship("Orden", back_populates="details")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True) 
    provider_name = Column(String, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    subtotal = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)  # 16% IVA
    total = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending, partial, paid, cancelled

    branch = relationship("Branch")
    details = relationship("PurchaseDetail", back_populates="purchase", cascade="all, delete")
    receipts = relationship("Receipt", back_populates="purchase")


class PurchaseDetail(Base):
    __tablename__ = "purchase_details"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    description = Column(String)  # In case it's not a generic product
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)

    purchase = relationship("Purchase", back_populates="details")
    product = relationship("Product")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=True)
    provider = Column(String) # Legacy text field

    branch = relationship("Branch")
    provider_rel = relationship("Provider", back_populates="expenses")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    type = Column(String, default="income")  # income, expense
    payment_method = Column(String, nullable=False) # Cash, Zelle, Banesco (VE), etc.
    reference = Column(String)

    orden = relationship("Orden", back_populates="receipts")
    purchase = relationship("Purchase", back_populates="receipts")
    client = relationship("Client")


# --- PROVIDERS MODULE ---

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    nit_ruc = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    payment_info = Column(String, nullable=True) # Bank details, Zelle, etc.
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")
    payables = relationship("Payable", back_populates="provider", cascade="all, delete")
    expenses = relationship("Expense", back_populates="provider_rel")
    purchases = relationship("Purchase")


class Payable(Base):
    __tablename__ = "payables"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    reference = Column(String, nullable=True) # Invoice number / description
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending") # pending, paid, cancelled
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_date = Column(DateTime(timezone=True), nullable=True)

    provider = relationship("Provider", back_populates="payables")
    branch = relationship("Branch")
    expense = relationship("Expense")
    purchase = relationship("Purchase")


# --- AUDIT LOGS ---

class OrderAuditLog(Base):
    __tablename__ = "order_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    orden_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False) # modified, deleted, created
    reason = Column(String, nullable=True)
    changes_json = Column(JSON, default={}) # Before/After snapshots
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orden = relationship("Orden")
    user = relationship("User")


# --- CRM QUOTES MODULE ---

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    title = Column(String, nullable=False)
    status = Column(String, default="draft", index=True)  # draft, sent, approved, rejected, converted
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)  # Total discount amount
    tax = Column(Float, default=0.0)       # 16% IVA calculated
    total = Column(Float, default=0.0)
    notes = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    converted_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")
    lead = relationship("Lead")
    client = relationship("Client")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete")
    converted_order = relationship("Orden", foreign_keys=[converted_order_id])


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False)
    item_type = Column(String, nullable=False)   # product, room, office, custom
    item_id = Column(Integer, nullable=True)     # FK to the referenced entity
    description = Column(String, nullable=False) # Name/description (copied at time of quoting)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)        # Per-item discount amount
    subtotal = Column(Float, default=0.0)

    quote = relationship("Quote", back_populates="items")


# --- SYSTEM NOTIFICATIONS ---

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If null, it's broadcasted to roles
    target_roles = Column(String, nullable=True) # e.g. "coordinador,ventas"
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # Null = global
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    branch = relationship("Branch")



# --- CASH MANAGEMENT ---

class CashCategory(Base):
    __tablename__ = "cash_categories"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String)
    type = Column(String, nullable=False)  # income, expense
    is_active = Column(Boolean, default=True)

    branch = relationship("Branch")

class CashMovement(Base):
    __tablename__ = "cash_movements"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # income, expense
    category = Column(String, nullable=False) # e.g. Petty Cash, Equity, Services
    description = Column(String)
    date = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    branch = relationship("Branch")
