import sys
import os

# Añadir el path del backend para poder importar los módulos
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.crud import crm
from app import models

def verify_crm_global():
    db = SessionLocal()
    try:
        print("--- Verificando Stages Globales ---")
        stages_all = crm.get_stages(db, branch_id=0)
        print(f"Total stages (global): {len(stages_all)}")
        
        if len(stages_all) > 0:
            for s in stages_all[:3]:
                print(f"  - Stage: {s.name} (Sede: {s.branch_id})")
            
            first_branch_id = stages_all[0].branch_id
            stages_branch = crm.get_stages(db, branch_id=first_branch_id)
            print(f"Stages para sede {first_branch_id}: {len(stages_branch)}")
            
        print("\n--- Verificando Leads Globales ---")
        leads_all = crm.get_leads(db, branch_id=0)
        print(f"Total leads (global): {len(leads_all)}")
        
        if len(leads_all) > 0:
            for l in leads_all[:3]:
                print(f"  - Lead: {l.name} (Sede: {l.branch_id})")
                
            first_lead_branch = leads_all[0].branch_id
            leads_branch = crm.get_leads(db, branch_id=first_lead_branch)
            print(f"Leads para sede {first_lead_branch}: {len(leads_branch)}")

        print("\n--- Verificando Oportunidades Globales ---")
        opps_all = crm.get_opportunities(db, branch_id=0)
        print(f"Total oportunidades (global): {len(opps_all)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    verify_crm_global()
