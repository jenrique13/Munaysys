# Script de prueba e inicialización
from app.database import engine
from app import models

print("Creando tablas si no existen...")
models.Base.metadata.create_all(bind=engine)
print("Tablas creadas exitosamente.")
