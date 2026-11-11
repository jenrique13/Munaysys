import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin3@munaysys.com"
ADMIN_PASSWORD = "admin"

def seed_db():
    print("Iniciando Seed de la Base de Datos para CRM Kanban...")
    
    # 1. Login para obtener el token JWT
    print(f"Haciendo login con {ADMIN_EMAIL}...")
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    
    if response.status_code != 200:
        print(f"Error de Login: {response.text}")
        print("Registrando admin por si no existe...")
        requests.post(f"{BASE_URL}/auth/register", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    print("Autenticación Exitosa.")
    
    # 2. Crear Sucursal Base (Sede Principal) - Saltando protección endpoint para el script inicial.
    # Como no hay router para branches aun, lo metemos directo a SQLAlchemy.
    print("Creando Sede Principal y etapas del Kanban en la Base de Datos...")
    from app.database import SessionLocal
    from app import models
    db = SessionLocal()
    
    # Crear Branch si no hay
    branch = db.query(models.Branch).first()
    if not branch:
        branch = models.Branch(name="Sede Principal", address="Av. Central 123", email="sede1@munaysys.com")
        db.add(branch)
        db.commit()
        db.refresh(branch)
    
    branch_id = branch.id
    
    # Crear Stages
    stages = [
        {"name": "Nuevo Lead", "order_index": 0, "color": "#E2E8F0", "probability": 10},
        {"name": "Contactado", "order_index": 1, "color": "#FEFCBF", "probability": 30},
        {"name": "Visita Agendada", "order_index": 2, "color": "#C6F6D5", "probability": 50},
        {"name": "Visita Realizada", "order_index": 3, "color": "#9AE6B4", "probability": 70},
        {"name": "Propuesta Enviada", "order_index": 4, "color": "#BEE3F8", "probability": 85},
        {"name": "Ganado", "order_index": 5, "color": "#48BB78", "probability": 100},
        {"name": "Perdido", "order_index": 6, "color": "#FC8181", "probability": 0}
    ]
    
    existing_stages = db.query(models.PipelineStage).filter_by(branch_id=branch_id).count()
    stage_ids = []
    if existing_stages == 0:
        for stage_data in stages:
            stage_data["branch_id"] = branch_id
            stage = models.PipelineStage(**stage_data)
            db.add(stage)
            db.commit()
            db.refresh(stage)
            stage_ids.append(stage.id)
            print(f"Etapa creada: {stage.name}")
    else:
        print("Las etapas ya existen, recuperando IDs...")
        stage_ids = [s.id for s in db.query(models.PipelineStage).filter_by(branch_id=branch_id).order_by(models.PipelineStage.order_index).all()]
    
    # 3. Crear algunos Leads y Opportunidades usando la API para verificarla
    print("\nCreando Leads via API...")
    
    leads = [
        {"name": "Empresa Innovadora SA", "email": "contacto@innovadora.com", "source": "Web", "branch_id": branch_id},
        {"name": "Juan Perez (Freelance)", "email": "juan@perez.com", "source": "Referido", "branch_id": branch_id},
        {"name": "Agencia de Marketing Digital", "email": "hola@agencia.com", "source": "Llamada Fria", "branch_id": branch_id}
    ]
    
    created_leads = []
    for lead in leads:
        resp = requests.post(f"{BASE_URL}/crm/leads", json=lead, headers=headers)
        if resp.status_code == 200:
            l = resp.json()
            created_leads.append(l)
            print(f"Lead creado: {l['name']}")
        else:
            print(f"Error creando lead: {resp.text}")
            
    print("\nCreando Oportunidades via API...")
    if stage_ids and created_leads:
        opportunities = [
            {"lead_id": created_leads[0]["id"], "stage_id": stage_ids[0], "estimated_value": 1500.0, "probability": 10},
            {"lead_id": created_leads[1]["id"], "stage_id": stage_ids[1], "estimated_value": 300.0, "probability": 30},
            {"lead_id": created_leads[2]["id"], "stage_id": stage_ids[2], "estimated_value": 4500.0, "probability": 50}
        ]
        
        for opp in opportunities:
            resp = requests.post(f"{BASE_URL}/crm/opportunities", json=opp, headers=headers)
            if resp.status_code == 200:
                print(f"Oportunidad creada por {opp['estimated_value']}")
            else:
                 print(f"Error creando oportunidad: {resp.text}")

    print("\n¡Seed completado!")

if __name__ == "__main__":
    seed_db()
