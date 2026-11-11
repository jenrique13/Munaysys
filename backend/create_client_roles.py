"""
Script para crear los roles 'Coworker' y 'Cliente' en la base de datos.
Ejecutar una sola vez: python create_client_roles.py
"""
import sys
sys.path.append('.')

from app.database import SessionLocal
from app import models

db = SessionLocal()

roles_to_create = [
    {"name": "Coworker", "permissions_json": {"client_portal": True}},
    {"name": "Cliente",  "permissions_json": {"client_portal": True}},
]

for role_data in roles_to_create:
    existing = db.query(models.Role).filter(models.Role.name == role_data["name"]).first()
    if not existing:
        role = models.Role(**role_data)
        db.add(role)
        print(f"[OK] Rol '{role_data['name']}' creado.")
    else:
        print(f"[INFO] Rol '{role_data['name']}' ya existe (id={existing.id}).")

db.commit()
db.close()
print("Roles inicializados correctamente.")
