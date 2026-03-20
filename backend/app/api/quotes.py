from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.api.deps import get_current_user, get_target_branch_id
from app.schemas import quotes as schemas
from app.crud import quotes as crud_quotes

router = APIRouter()


@router.get("/", response_model=List[schemas.Quote])
def read_quotes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    """Lista los presupuestos de la sucursal objetivo."""
    return crud_quotes.get_quotes(db, branch_id=target_branch_id, skip=skip, limit=limit)


@router.get("/{quote_id}", response_model=schemas.Quote)
def read_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = crud_quotes.get_quote(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return quote


@router.post("/", response_model=schemas.Quote, status_code=201)
def create_quote(
    quote_in: schemas.QuoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id)
):
    if not quote_in.branch_id:
        quote_in.branch_id = target_branch_id or current_user.branch_id or 1
    return crud_quotes.create_quote(db, quote_in)


@router.put("/{quote_id}", response_model=schemas.Quote)
def update_quote(
    quote_id: int,
    quote_in: schemas.QuoteUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = crud_quotes.update_quote(db, quote_id=quote_id, obj_in=quote_in)
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return quote


@router.delete("/{quote_id}", status_code=204)
def delete_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quote = crud_quotes.delete_quote(db, quote_id=quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return None


@router.post("/{quote_id}/convert", status_code=200)
def convert_quote_to_order(
    quote_id: int,
    body: schemas.QuoteConvertToOrder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Convierte un presupuesto aprobado en una Orden de Venta."""
    quote = crud_quotes.get_quote(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    if quote.status == "converted":
        raise HTTPException(status_code=400, detail="Este presupuesto ya fue convertido a Orden")

    new_order, updated_quote = crud_quotes.convert_to_order(db, quote_id=quote_id, client_id=body.client_id)

    if not new_order:
        raise HTTPException(status_code=400, detail="No se pudo convertir el presupuesto. Verifica que el cliente pertenezca a la misma sede.")

    return {
        "message": "Presupuesto convertido a Orden exitosamente",
        "order_id": new_order.id,
        "order_total": new_order.total,
        "quote_id": quote_id,
    }
