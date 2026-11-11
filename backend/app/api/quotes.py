from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models
from app.api.deps import get_current_user, get_target_branch_id, get_uow
from app.schemas import quotes as schemas
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.financial import QuoteUseCases

router = APIRouter()

@router.get("/", response_model=List[schemas.Quote])
def read_quotes(
    skip: int = 0,
    limit: int = 1000,
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    """Lista los presupuestos de la sucursal objetivo con soporte para búsqueda y filtrado por estado."""
    return uow.quotes.get_by_branch(target_branch_id, skip=skip, limit=limit, search=search, status=status)

@router.get("/{quote_id}", response_model=schemas.Quote)
def read_quote(
    quote_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    quote = uow.quotes.get_with_details(quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return quote

@router.post("/", response_model=schemas.Quote, status_code=201)
def create_quote(
    quote_in: schemas.QuoteCreate,
    current_user: models.User = Depends(get_current_user),
    target_branch_id: int = Depends(get_target_branch_id),
    uow: UnitOfWork = Depends(get_uow),
):
    if not quote_in.branch_id:
        quote_in.branch_id = target_branch_id or current_user.branch_id or 1
    
    use_case = QuoteUseCases(uow)
    return use_case.create(quote_in)

@router.put("/{quote_id}", response_model=schemas.Quote)
def update_quote(
    quote_id: int,
    quote_in: schemas.QuoteUpdate,
    uow: UnitOfWork = Depends(get_uow),
):
    # For now, simple update via repository
    db_quote = uow.quotes.get(quote_id)
    if not db_quote:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    
    uow.quotes.update(db_quote, quote_in.model_dump(exclude={"items"}, exclude_unset=True))
    uow.commit()
    uow.refresh(db_quote)
    return db_quote

@router.delete("/{quote_id}", status_code=204)
def delete_quote(
    quote_id: int,
    uow: UnitOfWork = Depends(get_uow),
):
    use_case = QuoteUseCases(uow)
    if not use_case.delete(quote_id):
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return None

@router.post("/{quote_id}/convert", status_code=200)
def convert_quote_to_order(
    quote_id: int,
    body: schemas.QuoteConvertToOrder,
    uow: UnitOfWork = Depends(get_uow),
):
    """Convierte un presupuesto aprobado en una Orden de Venta."""
    use_case = QuoteUseCases(uow)
    new_order, updated_quote = use_case.convert_to_order(quote_id=quote_id, client_id=body.client_id)

    if not new_order:
        raise HTTPException(status_code=400, detail="No se pudo convertir el presupuesto. Verifica que el cliente pertenezca a la misma sede.")

    return {
        "message": "Presupuesto convertido a Orden exitosamente",
        "order_id": new_order.id,
        "order_total": new_order.total,
        "quote_id": quote_id,
    }
