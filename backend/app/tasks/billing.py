import logging
from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date
from app.database import SessionLocal
from app import models
from app.crud.financial import create_order
from app.crud.system import create_notification
from app.schemas.financial import OrdenCreate, PedidoCreate
from app.schemas.system import NotificationCreate
from datetime import timedelta

logger = logging.getLogger(__name__)


def renew_amenity_quotas(db: Session):
    """
    Resets quantity = monthly_quota for all recurring amenities.
    Non-accumulative.
    """
    logger.info("Renewing recurring amenity quotas...")
    try:
        # We find amenities where is_recurring is True
        recurring_amenities = db.query(models.Amenity).filter(models.Amenity.is_recurring == True).all()
        for amenity in recurring_amenities:
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
            db.add(history)
        db.commit()
        logger.info(f"Successfully renewed {len(recurring_amenities)} recurring amenities.")
    except Exception as e:
        logger.error(f"Error renewing amenity quotas: {str(e)}")
        db.rollback()

def process_monthly_billing(force: bool = False):
    """
    Background job that runs once a day. 
    It checks if today is the 1st of the month, and if so, 
    iterates all active memberships to generate their recurring orders.
    """
    today = date.today()
    
    if today.day != 1 and not force:
        logger.info(f"Skipping monthly billing: Today ({today}) is not the 1st.")
        return
        
    logger.info(f"Starting recurring monthly billing process for {today}...")
    db: Session = SessionLocal()
    
    # NUEVO: Renovar cuotas de amenidades
    renew_amenity_quotas(db)

    billed_count = 0
    
    try:
        # 1. Fetch all active memberships
        active_memberships = db.query(models.Membership).filter(models.Membership.status == "active").all()
        
        for mb in active_memberships:
            # 2. Extract valid date objects
            start_date: date = mb.start_date.date() if isinstance(mb.start_date, datetime) else mb.start_date
            end_date: Optional[date] = None
            if mb.end_date:
                end_date = mb.end_date.date() if isinstance(mb.end_date, datetime) else mb.end_date
                
            # 3. Check if today is within the membership active boundaries
            if start_date <= today and (end_date is None or today <= end_date):
                
                # 4. Idempotency Check: Did we already bill this membership for this month?
                existing = db.query(models.Orden).filter(
                    models.Orden.client_id == mb.client_id,
                    models.Orden.total == mb.price,
                    cast(models.Orden.date, Date) == today
                ).first()
                
                if existing:
                    logger.debug(f"Skipping Membership {mb.id}: Order already generated today.")
                    continue
                
                # Fetch Client for branch info
                client = db.query(models.Client).filter(models.Client.id == mb.client_id).first()
                if not client:
                    continue
                    
                # 5. Generate the Sub-Order (Pedido) based on space assigned
                detail = PedidoCreate(
                    item_type="room" if mb.office_id else "service",
                    item_id=mb.office_id or 1,
                    quantity=1,
                    unit_price=mb.price,
                    discount=0,
                    subtotal=mb.price
                )
                
                # 6. Generate the Master Order
                orden_in = OrdenCreate(
                    client_id=mb.client_id,
                    branch_id=client.branch_id,
                    discount=0,
                    status="pending",
                    details=[detail]
                )
                
                try:
                    create_order(db=db, order=orden_in)
                    billed_count += 1
                    logger.info(f"Successfully generated billing order for Membership {mb.id} (Client {mb.client_id}).")
                except Exception as e:
                    logger.error(f"Failed generating order for Membership {mb.id}: {str(e)}")
                    
        logger.info(f"Monthly recurring billing finished. Generated {billed_count} new orders.")
        
    except Exception as e:
        logger.error(f"Fatal error in monthly billing cron logic: {str(e)}")
    finally:
        db.close()

def process_expiration_alerts():
    """
    Background job that runs daily.
    Checks for active memberships expiring in exactly 10 days
    and creates a system notification for Coordinador and Ventas roles.
    """
    db: Session = SessionLocal()
    today = date.today()
    target_date = today + timedelta(days=10)
    
    logger.info(f"Checking for memberships expiring on {target_date} (10 days from today)...")
    
    try:
        # Fetch memberships expiring exactly on target_date
        expiring_memberships = db.query(models.Membership).filter(
            models.Membership.status == "active",
            models.Membership.end_date != None
        ).all()
        
        alerts_created = 0
        for mb in expiring_memberships:
            end_date: date = mb.end_date.date() if isinstance(mb.end_date, datetime) else mb.end_date
            
            if end_date == target_date:
                client = db.query(models.Client).filter(models.Client.id == mb.client_id).first()
                client_name = client.name if client else f"Cliente #{mb.client_id}"
                
                # Create Notification for Coordinador and Ventas
                notif = NotificationCreate(
                    target_roles="coordinador,ventas,admin",
                    branch_id=client.branch_id if client else None,
                    title="Vencimiento de Membresía Próximo",
                    message=f"La membresía de {client_name} (ID: {mb.id}) vencerá en 10 días ({end_date.strftime('%d/%m/%Y')})."
                )
                create_notification(db=db, notification=notif)
                alerts_created += 1
                logger.info(f"Created expiration alert for Membership {mb.id}.")
                
        logger.info(f"Expiration check finished. {alerts_created} alerts generated.")
    except Exception as e:
        logger.error(f"Error checking for expiring memberships: {str(e)}")
    finally:
        db.close()
