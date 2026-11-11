import logging
from datetime import date, datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from app.database import SessionLocal
from app import models, schemas
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.financial.order_use_cases import OrderUseCases

logger = logging.getLogger(__name__)

def renew_amenity_quotas(uow: UnitOfWork):
    """
    Resets quantity = monthly_quota for all recurring amenities.
    Non-accumulative.
    """
    logger.info("Renewing recurring amenity quotas...")
    try:
        recurring_amenities = uow.db.query(models.Amenity).filter(models.Amenity.is_recurring == True).all()
        for amenity in recurring_amenities:
            # Verificación de idempotencia para no duplicar reseteos en el mismo día
            already_renewed = uow.db.query(models.AmenityHistory).filter(
                models.AmenityHistory.amenity_id == amenity.id,
                models.AmenityHistory.reason == "Renovación mensual",
                cast(models.AmenityHistory.created_at, Date) == date.today()
            ).first()
            if already_renewed:
                continue

            old_q = amenity.quantity
            amenity.quantity = amenity.monthly_quota
            # LOG HISTORY
            history = models.AmenityHistory(
                amenity_id=amenity.id,
                client_id=amenity.client_id,
                old_quantity=old_q,
                new_quantity=amenity.monthly_quota,
                change=amenity.monthly_quota - old_q,
                reason="Renovación mensual"
            )
            uow.db.add(history)
        uow.commit()
        logger.info(f"Successfully renewed {len(recurring_amenities)} recurring amenities.")
    except Exception as e:
        logger.error(f"Error renewing amenity quotas: {str(e)}")
        uow.rollback()

def process_monthly_billing(force: bool = False):
    """
    Background job that runs once a month (1st).
    It iterates all active memberships to generate their recurring orders.
    Refactored to use Unit of Work and Use Cases.
    """
    today = date.today()
    if today.day != 1 and not force:
        logger.info(f"Skipping monthly billing: Today ({today}) is not the 1st.")
        return
        
    logger.info(f"Starting recurring monthly billing process for {today}...")
    db = SessionLocal()
    uow = UnitOfWork(db)
    
    # 1. Renew quotas
    renew_amenity_quotas(uow)

    billed_count = 0
    order_use_case = OrderUseCases(uow)
    
    try:
        active_memberships = uow.memberships.db.query(models.Membership).filter(models.Membership.status == "active").all()
        
        for mb in active_memberships:
            start_date: date = mb.start_date.date() if isinstance(mb.start_date, datetime) else mb.start_date
            end_date: Optional[date] = None
            if mb.end_date:
                end_date = mb.end_date.date() if isinstance(mb.end_date, datetime) else mb.end_date
                
            if start_date <= today and (end_date is None or today < end_date):
                target_item_name = f"Renovación {mb.plan_name} (ID: {mb.id})"

                # Idempotency Check: Verificar por membresía específica y no solo por precio
                existing_pedido = uow.db.query(models.Pedido).join(models.Orden).filter(
                    models.Orden.client_id == mb.client_id,
                    cast(models.Orden.date, Date) == today,
                    models.Pedido.item_name == target_item_name
                ).first()
                
                if existing_pedido:
                    continue
                
                client = uow.clients.get(mb.client_id)
                if not client: continue
                    
                # Generate matching schema objects for OrderUseCases
                detail = schemas.financial.pedido.PedidoCreate(
                    item_type="room" if mb.office_id else "service",
                    item_id=mb.office_id or 1,
                    item_name=target_item_name,
                    quantity=1,
                    unit_price=mb.price,
                    discount=0
                )
                orden_in = schemas.financial.order.OrdenCreate(
                    client_id=mb.client_id,
                    branch_id=client.branch_id,
                    discount=0,
                    status="pending",
                    details=[detail]
                )
                
                try:
                    order_use_case.create(orden_in)
                    billed_count += 1
                except Exception as e:
                    logger.error(f"Failed generating cron order for Membership {mb.id}: {str(e)}")
                    
        uow.commit() # Already handled by order_use_case.create, but for safety in loop
        logger.info(f"Monthly recurring billing finished. Generated {billed_count} new orders.")
    except Exception as e:
        logger.error(f"Fatal error in monthly billing logic: {str(e)}")
    finally:
        db.close()

def process_expiration_alerts():
    """
    Background job that runs daily.
    Refactored to use Unit of Work for notification recording.
    """
    db = SessionLocal()
    uow = UnitOfWork(db)
    today = date.today()
    target_date = today + timedelta(days=10)
    
    try:
        expiring_memberships = uow.memberships.db.query(models.Membership).filter(
            models.Membership.status == "active",
            models.Membership.end_date != None
        ).all()
        
        alerts_created = 0
        for mb in expiring_memberships:
            end_date: date = mb.end_date.date() if isinstance(mb.end_date, datetime) else mb.end_date
            
            if end_date == target_date:
                client = uow.clients.get(mb.client_id)
                client_name = client.name if client else f"Cliente #{mb.client_id}"
                
                notif = models.Notification(
                    target_roles="coordinador,ventas,admin",
                    branch_id=client.branch_id if client else None,
                    title="Vencimiento de Membresía Próximo",
                    message=f"La membresía de {client_name} (ID: {mb.id}) vencerá en 10 días ({end_date.strftime('%d/%m/%Y')}).",
                    is_read=False,
                    created_at=datetime.utcnow()
                )
                uow.db.add(notif)
                alerts_created += 1
                
        uow.commit()
        logger.info(f"Expiration check finished. {alerts_created} alerts generated.")
    except Exception as e:
        logger.error(f"Error checking for expiring memberships: {str(e)}")
    finally:
        db.close()
