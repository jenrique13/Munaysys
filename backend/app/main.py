from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.tasks.billing import process_monthly_billing, process_expiration_alerts
from app.tasks.exchange_rates import update_exchange_rates
from app.tasks.notifications import process_booking_reminders
import asyncio
from app.config import settings
from app.api import auth
from app.database import engine
from app import models
from app.logger_setup import setup_logging

# Inicializar los Logs
setup_logging()

# Crear tablas directamente para demo rápida (Idealmente usar Alembic en el futuro)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Incluir Rutas
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
from app.api import crm
app.include_router(crm.router, prefix=f"{settings.API_V1_STR}/crm", tags=["crm"])
from app.api import operative
app.include_router(operative.router, prefix=f"{settings.API_V1_STR}/operative", tags=["operative"])
from app.api import financial
app.include_router(financial.router, prefix=f"{settings.API_V1_STR}/financial", tags=["financial"])
from app.api import dashboards
app.include_router(dashboards.router, prefix=f"{settings.API_V1_STR}/dashboards", tags=["dashboards"])
from app.api import providers
app.include_router(providers.router, prefix=f"{settings.API_V1_STR}/providers", tags=["providers"])
from app.api import configuration
app.include_router(configuration.router, prefix=f"{settings.API_V1_STR}/configuration", tags=["configuration"])
from app.api import system
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
from app.api import reports
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])

@app.get("/")
def root():
    return {"message": "Bienvenido a la API de Munaysys 2.0"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Inicializar Background Scheduler para Tareas recurrentes (Cronjobs)
scheduler = BackgroundScheduler(timezone="America/Caracas")

@app.on_event("startup")
async def start_scheduler():
    # Asegurar que tenemos la tasa del día al iniciar
    try:
        await update_exchange_rates()
    except Exception as e:
        print(f"Error inicializando tasas: {e}")

    # Wrapper para ejecutar la tarea async en el scheduler sync
    def sync_update_rates():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(update_exchange_rates())
        loop.close()

    # Se ejecutará automáticamente todos los días a las 08:00 AM.
    scheduler.add_job(sync_update_rates, 'cron', hour=8, minute=0)
    
    # Se ejecutará automáticamente los días 01 de cada mes a las 00:05 AM.
    scheduler.add_job(process_monthly_billing, 'cron', day=1, hour=0, minute=5)
    
    # Se ejecutará automáticamente todos los días a la 01:00 AM.
    # Se ejecutará automáticamente todos los cada 5 minutos.
    def sync_booking_reminders():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(process_booking_reminders())
        loop.close()

    scheduler.add_job(sync_booking_reminders, 'interval', minutes=5)

    scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
