from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.repositories.base import BaseRepository

class OfficeRepository(BaseRepository[models.Office]):
    def __init__(self, db: Session):
        super().__init__(models.Office, db)

    def get_by_branch(self, branch_id: int) -> List[models.Office]:
        q = self.db.query(self.model)
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.all()

class RoomRepository(BaseRepository[models.Room]):
    def __init__(self, db: Session):
        super().__init__(models.Room, db)

    def get_by_branch(self, branch_id: int) -> List[models.Room]:
        q = self.db.query(self.model).options(joinedload(models.Room.branch))
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)
        return q.all()

class BookingRepository(BaseRepository[models.Booking]):
    def __init__(self, db: Session):
        super().__init__(models.Booking, db)

    def get_by_room(self, room_id: int) -> List[models.Booking]:
        return self.db.query(self.model).filter(self.model.room_id == room_id).all()

    def get_by_client(self, client_id: int) -> List[models.Booking]:
        return self.db.query(self.model).filter(self.model.client_id == client_id).all()

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 100) -> List[models.Booking]:
        q = self.db.query(self.model).join(models.Room).options(
            joinedload(models.Booking.room),
            joinedload(models.Booking.client)
        )
        if branch_id and branch_id > 0:
            q = q.filter(models.Room.branch_id == branch_id)
        return q.order_by(self.model.start_time.desc()).offset(skip).limit(limit).all()
