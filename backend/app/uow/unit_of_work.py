import logging
from typing import TypeVar, Generic, List, Optional, Type
from sqlalchemy.orm import Session
from app.repositories.crm.lead_repository import LeadRepository, OpportunityRepository, PipelineStageRepository
from app.repositories.operative.client_repository import ClientRepository
from app.repositories.financial.product_repository import ProductRepository
from app.repositories.financial.service_repository import ServiceRepository, PackageRepository
from app.repositories.financial.consumable_repository import ConsumableRepository, ConsumableCategoryRepository, ConsumableUsageRepository
from app.repositories.financial.order_repository import OrderRepository, PedidoRepository
from app.repositories.financial.receipt_repository import ReceiptRepository
from app.repositories.financial.purchase_repository import PurchaseRepository, PurchaseDetailRepository
from app.repositories.financial.expense_repository import ExpenseRepository
from app.repositories.financial.cash_flow_repository import CashMovementRepository, CashCategoryRepository, PaymentMethodRepository
from app.repositories.financial.quote_repository import QuoteRepository, QuoteItemRepository
from app.repositories.operative.space_repository import OfficeRepository, RoomRepository, BookingRepository
from app.repositories.operative.membership_repository import MembershipRepository
from app.repositories.operative.amenity_repository import AmenityRepository, AmenityHistoryRepository, AmenityTemplateRepository
from app.repositories.operative.contract_repository import ContractTemplateRepository
from app.repositories.operative.catalogs_repository import SpaceCategoryRepository, RoomTypeRepository
from app.repositories.auth.user_repository import UserRepository, RoleRepository
from app.repositories.auth.notification_repository import NotificationRepository
from app.repositories.system.branch_repository import BranchRepository, ExchangeRateRepository
from app.repositories.financial.provider_repository import ProviderRepository, PayableRepository

class UnitOfWork:
    def __init__(self, db: Session):
        self.db = db
        # CRM
        self.leads = LeadRepository(db)
        self.opportunities = OpportunityRepository(db)
        self.stages = PipelineStageRepository(db)
        # Operative
        self.clients = ClientRepository(db)
        self.offices = OfficeRepository(db)
        self.rooms = RoomRepository(db)
        self.bookings = BookingRepository(db)
        self.memberships = MembershipRepository(db)
        self.amenities = AmenityRepository(db)
        self.amenity_history = AmenityHistoryRepository(db)
        self.amenity_templates = AmenityTemplateRepository(db)
        self.contract_templates = ContractTemplateRepository(db)
        self.space_categories = SpaceCategoryRepository(db)
        self.room_types = RoomTypeRepository(db)
        # Financial
        self.products = ProductRepository(db)
        self.services = ServiceRepository(db)
        self.packages = PackageRepository(db)
        self.consumables = ConsumableRepository(db)
        self.consumable_categories = ConsumableCategoryRepository(db)
        self.consumable_usage = ConsumableUsageRepository(db)
        self.orders = OrderRepository(db)
        self.pedidos = PedidoRepository(db)
        self.receipts = ReceiptRepository(db)
        self.purchases = PurchaseRepository(db)
        self.purchase_details = PurchaseDetailRepository(db)
        self.expenses = ExpenseRepository(db)
        self.cash_movements = CashMovementRepository(db)
        self.cash_categories = CashCategoryRepository(db)
        self.payment_methods = PaymentMethodRepository(db)
        self.quotes = QuoteRepository(db)
        self.quote_items = QuoteItemRepository(db)
        self.providers = ProviderRepository(db)
        self.payables = PayableRepository(db)
        # Auth & System
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.notifications = NotificationRepository(db)
        self.branches = BranchRepository(db)
        self.exchange_rates = ExchangeRateRepository(db)

    def commit(self):
        self.db.commit()

    def rollback(self):
        self.db.rollback()

    def refresh(self, obj):
        self.db.refresh(obj)
