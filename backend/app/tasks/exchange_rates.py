import logging
from datetime import date, datetime
from app.database import SessionLocal
from app import models
from app.uow.unit_of_work import UnitOfWork

logger = logging.getLogger(__name__)

async def update_exchange_rates():
    """
    Fetch exchange rates from BCV and save them to the database.
    Designed to run daily or at system startup.
    """
    today = date.today()
    db = SessionLocal()
    uow = UnitOfWork(db)
    
    logger.info(f"Checking exchange rates for {today}...")
    
    try:
        # Check if already exists for today
        existing = uow.exchange_rates.db.query(models.ExchangeRate).filter(
            models.ExchangeRate.date == today
        ).first()
        
        import asyncio
        import urllib.request
        import json
        import ssl
        
        max_retries = 3
        usd = 0.0
        eur = 0.0
        
        def fetch_rates():
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            
            req_usd = urllib.request.Request('https://ve.dolarapi.com/v1/dolares/oficial', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_usd, context=ctx, timeout=10) as r:
                usd_r = json.loads(r.read().decode('utf-8'))['promedio']
                
            req_eur = urllib.request.Request('https://ve.dolarapi.com/v1/euros/oficial', headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_eur, context=ctx, timeout=10) as r:
                eur_r = json.loads(r.read().decode('utf-8'))['promedio']
            return usd_r, eur_r

        for attempt in range(max_retries):
            try:
                usd_val, eur_val = await asyncio.to_thread(fetch_rates)
                usd = float(usd_val or 0.0)
                eur = float(eur_val or 0.0)
                
                if usd > 0:
                    break
                else:
                    logger.warning(f"Could not fetch valid rate (attempt {attempt + 1}/{max_retries}). Retrying in 10s...")
                    await asyncio.sleep(10)
            except Exception as inner_e:
                logger.warning(f"Error fetching from BCV (attempt {attempt + 1}/{max_retries}): {inner_e}")
                await asyncio.sleep(10)

        if usd <= 0:
            logger.error("Could not fetch a valid USD rate from BCV after all intentos. Enviando notificación...")
            # Enviar notificación de falla
            error_notif = models.Notification(
                target_roles="coordinador,gerente,admin",
                branch_id=None,  # Para todos
                title="Error Sincronizando Tasa BCV",
                message="El sistema no logró automatizar la tasa del BCV del día de hoy después de agotar los reintentos. El servidor del BCV experimenta fallas. Por favor defina la tasa manualmente o intente más tarde.",
                is_read=False,
                created_at=datetime.utcnow()
            )
            uow.db.add(error_notif)
            uow.commit()
            return

        if existing:
            # Update if changed (optional, but good for accuracy if BCV updates during the day)
            if existing.usd_rate != usd or existing.eur_rate != eur:
                existing.usd_rate = usd
                existing.eur_rate = eur
                uow.commit()
                logger.info(f"Updated today's rates: USD {usd}, EUR {eur}")
            else:
                logger.info("Today's rates are already up to date.")
        else:
            # Create new record
            new_rate = models.ExchangeRate(
                date=today,
                usd_rate=usd,
                eur_rate=eur
            )
            uow.db.add(new_rate)
            uow.commit()
            logger.info(f"Saved daily rates: USD {usd}, EUR {eur}")
                

    except Exception as e:
        logger.error(f"Fatal error in update_exchange_rates: {str(e)}")
    finally:
        db.close()
