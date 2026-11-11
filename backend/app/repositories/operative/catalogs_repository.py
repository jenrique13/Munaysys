from sqlalchemy.orm import Session
from app.models import SpaceCategory, RoomType
from app.repositories.base import BaseRepository

class SpaceCategoryRepository(BaseRepository[SpaceCategory]):
    def __init__(self, db: Session):
        super().__init__(SpaceCategory, db)

    def get_by_branch(self, branch_id: int):
        return self.db.query(self.model).filter(
            (self.model.branch_id == branch_id) | (self.model.branch_id == None)
        ).all()

class RoomTypeRepository(BaseRepository[RoomType]):
    def __init__(self, db: Session):
        super().__init__(RoomType, db)

    def get_by_branch(self, branch_id: int):
        return self.db.query(self.model).filter(
            (self.model.branch_id == branch_id) | (self.model.branch_id == None)
        ).all()
