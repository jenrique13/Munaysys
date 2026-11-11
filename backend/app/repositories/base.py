from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.orm import Session
from app.database import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, skip: int = 0, limit: int = 100) -> List[T]:
        return self.db.query(self.model).offset(skip).limit(limit).all()

    def create(self, obj_in_data: dict) -> T:
        # Filter data to only include fields that exist in the model
        model_fields = {c.name for c in self.model.__table__.columns}
        filtered_data = {k: v for k, v in obj_in_data.items() if k in model_fields}
        db_obj = self.model(**filtered_data)
        self.db.add(db_obj)
        return db_obj

    def update(self, db_obj: T, obj_in_data: dict) -> T:
        for field in obj_in_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, obj_in_data[field])
        self.db.add(db_obj)
        return db_obj

    def remove(self, id: Any) -> Optional[T]:
        obj = self.db.query(self.model).get(id)
        if obj:
            self.db.delete(obj)
        return obj

    def add(self, obj: T) -> T:
        self.db.add(obj)
        return obj

    def delete(self, obj: T) -> T:
        self.db.delete(obj)
        return obj

    def query(self):
        return self.db.query(self.model)

    def get_for_update(self, id: Any) -> Optional[T]:
        return self.db.query(self.model).with_for_update().filter(self.model.id == id).first()

    def flush(self):
        self.db.flush()
