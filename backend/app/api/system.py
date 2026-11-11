from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.api.deps import get_uow
from app.uow.unit_of_work import UnitOfWork
from app.schemas.auth.notification import Notification
from app import models

router = APIRouter()

@router.get("/notifications", response_model=List[Notification])
def read_notifications(
    skip: int = 0,
    limit: int = 50,
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Fetch notifications for the current user including role-based broadcasts.
    """
    role_name = current_user.role.name if current_user.role else None
    return uow.notifications.get_for_user(
        user_id=current_user.id,
        role_name=role_name,
        branch_id=current_user.branch_id,
        skip=skip,
        limit=limit
    )

@router.put("/notifications/{notif_id}/read")
def mark_as_read(
    notif_id: int,
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Mark a notification as read.
    """
    if not uow.notifications.mark_read(notif_id):
        raise HTTPException(status_code=404, detail="Notification not found")
    uow.commit()
    return {"ok": True}

@router.get("/bcv-rate")
def get_bcv_rate():
    """
    External service to fetch current exchange rates from BCV.
    No DB interaction needed here.
    """
    import urllib.request
    import json
    import ssl
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req_usd = urllib.request.Request('https://ve.dolarapi.com/v1/dolares/oficial', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_usd, context=ctx, timeout=5) as r:
            usd_rate = json.loads(r.read().decode('utf-8'))['promedio']
            
        req_eur = urllib.request.Request('https://ve.dolarapi.com/v1/euros/oficial', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req_eur, context=ctx, timeout=5) as r:
            eur_rate = json.loads(r.read().decode('utf-8'))['promedio']

        return {"usd": usd_rate, "eur": eur_rate}
    except Exception as e:
        return {"usd": 0, "eur": 0, "error": str(e)}
