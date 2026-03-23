from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app import schemas, models
from app.schemas.system import Notification
from app.crud import system as crud_sys

router = APIRouter()

@router.get("/notifications", response_model=List[Notification])
def read_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    return crud_sys.get_notifications_for_user(db=db, user=current_user, skip=skip, limit=limit)

@router.put("/notifications/{notif_id}/read")
def mark_as_read(
    notif_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    if not crud_sys.mark_notification_read(db=db, notification_id=notif_id):
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}

@router.get("/bcv-rate")
async def get_bcv_rate():
    try:
        from currency_rate_bcv import Currency
        currency = Currency()
        usd_rate = await currency.getDollar
        eur_rate = await currency.getEuro
        return {"usd": usd_rate, "eur": eur_rate}
    except Exception as e:
        return {"usd": 0, "eur": 0, "error": str(e)}
