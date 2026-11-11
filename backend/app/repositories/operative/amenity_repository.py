from typing import List, Optional
from sqlalchemy.orm import Session
from app import models
from app.repositories.base import BaseRepository

class AmenityRepository(BaseRepository[models.Amenity]):
    def __init__(self, db: Session):
        super().__init__(models.Amenity, db)

    def get_by_branch(self, branch_id: int) -> List[models.Amenity]:
        return self.db.query(self.model).filter(
            self.model.branch_id == branch_id,
            self.model.is_active == True
        ).all()

    def get_filtered(self, branch_id: int, client_id: Optional[int] = None, space_id: Optional[int] = None, space_type: Optional[str] = None) -> List[models.Amenity]:
        query = self.db.query(self.model).filter(
            self.model.branch_id == branch_id,
            self.model.is_active == True
        )
        if client_id is not None:
            query = query.filter(self.model.client_id == client_id)
        if space_id is not None:
            query = query.filter(self.model.space_id == space_id)
        if space_type is not None:
            query = query.filter(self.model.space_type == space_type)
        return query.all()

    def get_by_client(self, client_id: int) -> List[models.Amenity]:
        return self.db.query(self.model).filter(
            self.model.client_id == client_id,
            self.model.is_active == True
        ).all()

class AmenityHistoryRepository(BaseRepository[models.AmenityHistory]):
    def __init__(self, db: Session):
        super().__init__(models.AmenityHistory, db)

    def get_by_client(self, client_id: int) -> List[models.AmenityHistory]:
        return self.db.query(self.model).filter(self.model.client_id == client_id).all()

class AmenityTemplateRepository(BaseRepository[models.AmenityTemplate]):
    def __init__(self, db: Session):
        super().__init__(models.AmenityTemplate, db)

    def get_by_branch(self, branch_id: int) -> List[models.AmenityTemplate]:
        return self.db.query(self.model).filter(
            (self.model.branch_id == branch_id) | (self.model.branch_id == None),
            self.model.is_active == True
        ).all()

    def get_by_space_category(self, space_type: str, category_name: str, branch_id: Optional[int] = None) -> Optional[models.AmenityTemplate]:
        from sqlalchemy import func
        query = self.db.query(self.model).filter(
            func.lower(self.model.space_type) == space_type.lower(),
            func.lower(self.model.category_name) == category_name.lower(),
            self.model.is_active == True
        )
        if branch_id:
            # Check for specific branch OR global
            query = query.filter((self.model.branch_id == branch_id) | (self.model.branch_id == None))
        else:
            query = query.filter(self.model.branch_id == None)
        
        # Sort by branch_id desc so specific branch overrides global (null)
        return query.order_by(self.model.branch_id.desc()).first()
