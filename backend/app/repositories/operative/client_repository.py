from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app import models
from app.repositories.base import BaseRepository

class ClientRepository(BaseRepository[models.Client]):
    def __init__(self, db: Session):
        super().__init__(models.Client, db)

    def get_by_identifier(self, ci_rif: str = None, email: str = None, name: str = None) -> Optional[models.Client]:
        """
        Busca un cliente por diferentes identificadores para evitar duplicados.
        """
        # 1. Por CI/RIF
        if ci_rif:
            existing = self.db.query(self.model).filter(
                self.model.ci_rif == ci_rif,
                self.model.status != "deleted"
            ).first()
            if existing: return existing

        # 2. Por Email
        if email:
            existing = self.db.query(self.model).filter(
                func.lower(self.model.email) == email.lower(),
                self.model.status != "deleted"
            ).first()
            if existing: return existing

        # Se removió la búsqueda exclusiva por 'name' (Nombre) porque causaba 
        # falsos positivos al convertir leads (Ej: "Juan" emparejaba con cualquier "Juan" antiguo).
        return None

    def get_or_create_from_lead(self, lead: models.Lead) -> models.Client:
        existing = self.get_by_identifier(ci_rif=lead.ci_rif, email=lead.email, name=lead.name)
        
        if existing:
            # Sync lead_id if empty
            if not existing.lead_id:
                existing.lead_id = lead.id
            return existing

        # Create new client
        db_client = self.model(
            name=lead.name,
            email=lead.email,
            phone=lead.phone,
            ci_rif=lead.ci_rif,
            branch_id=lead.branch_id,
            lead_id=lead.id,
            status="active"
        )
        self.db.add(db_client)
        self.db.flush() # Ensure ID is generated for the return
        return db_client

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100, search: str = None) -> List[models.Client]:
        q = self.db.query(self.model).options(
            joinedload(models.Client.branch),
            joinedload(models.Client.memberships)
        ).filter(self.model.status != "deleted")
        
        # Clients are now global. branch_id parameter is kept for interface compatibility 
        # but the results are no longer filtered by it.
        pass
            
        if search:
            search_filter = f"%{search}%"
            # Try to search by ID if it's a number
            if search.isdigit():
                q = q.filter(
                    (self.model.name.ilike(search_filter)) |
                    (self.model.email.ilike(search_filter)) |
                    (self.model.ci_rif.ilike(search_filter)) |
                    (self.model.id == int(search))
                )
            else:
                q = q.filter(
                    (self.model.name.ilike(search_filter)) |
                    (self.model.email.ilike(search_filter)) |
                    (self.model.ci_rif.ilike(search_filter))
                )
            
        return q.offset(skip).limit(limit).all()
