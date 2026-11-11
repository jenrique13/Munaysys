from typing import List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from app import models
from app.repositories.base import BaseRepository

from sqlalchemy import or_

class QuoteItemRepository(BaseRepository[models.QuoteItem]):
    def __init__(self, db: Session):
        super().__init__(models.QuoteItem, db)

    def get_by_quote(self, quote_id: int) -> List[models.QuoteItem]:
        return self.db.query(self.model).filter(self.model.quote_id == quote_id).all()

class QuoteRepository(BaseRepository[models.Quote]):
    def __init__(self, db: Session):
        super().__init__(models.Quote, db)

    def get_by_branch(self, branch_id: int, skip: int = 0, limit: int = 1000, search: str = None, status: str = None) -> List[models.Quote]:
        q = self.db.query(self.model).outerjoin(
            models.Lead, self.model.lead_id == models.Lead.id
        ).outerjoin(
            models.Client, self.model.client_id == models.Client.id
        ).options(
            selectinload(models.Quote.items),
            joinedload(models.Quote.lead),
            joinedload(models.Quote.client)
        )
        if branch_id and branch_id > 0:
            q = q.filter(self.model.branch_id == branch_id)

        if status and status != 'all':
            q = q.filter(self.model.status == status)

        if search:
            search_clean = search.strip()
            search_filter = f"%{search_clean}%"
            conditions = [
                self.model.title.ilike(search_filter),
                models.Lead.name.ilike(search_filter),
                models.Client.name.ilike(search_filter)
            ]
            # If search contains digits / ID notation (#0388, 0388, 388)
            clean_num = search_clean.lstrip('#0')
            if not clean_num and '0' in search_clean:
                clean_num = '0'
            if clean_num.isdigit():
                conditions.append(self.model.id == int(clean_num))

            q = q.filter(or_(*conditions))

        return q.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

    def get_with_details(self, quote_id: int) -> Optional[models.Quote]:
        return self.db.query(self.model).options(
            selectinload(models.Quote.items),
            joinedload(models.Quote.lead),
            joinedload(models.Quote.client)
        ).filter(self.model.id == quote_id).first()
