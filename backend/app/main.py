from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.tasks.billing import process_monthly_billing, process_expiration_alerts
from app.config import settings
from app.api import auth
from app.database import engine
from app import models

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
    allow_origins=["*"],
    allow_credentials=False,
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
scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    # Se ejecutará automáticamente los días 01 de cada mes a las 00:05 AM.
    scheduler.add_job(process_monthly_billing, 'cron', day=1, hour=0, minute=5)
    
    # Se ejecutará automáticamente todos los días a la 01:00 AM.
    scheduler.add_job(process_expiration_alerts, 'cron', hour=1, minute=0)

    scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
