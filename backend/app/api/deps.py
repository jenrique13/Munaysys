from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app import models
from app.config import settings
from app.database import get_db
from app.schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).options(
        joinedload(models.User.role),
        joinedload(models.User.branch),
    ).filter(models.User.id == token_data.sub).first()
    if not user:
        raise credentials_exception
    if user.status != "active":
        raise HTTPException(status_code=400, detail="Usuario Inactivo")
    return user

def get_target_branch_id(
    current_user: models.User = Depends(get_current_user),
    x_branch_id: Optional[int] = Header(None)
) -> int:
    """
    Determina la sucursal objetivo para la consulta.
    Si el usuario es Gerente o Super Admin, respeta el header X-Branch-Id (0 = todas).
    De lo contrario, SIEMPRE devuelve la sucursal del usuario (nunca 0 por header externo).
    """
    is_privileged = current_user.is_superuser or (current_user.role and current_user.role.name in ["Gerente", "Ventas"])
    
    # Solo usuarios privilegiados pueden ver todas las sedes o cambiar de sede
    if is_privileged and x_branch_id is not None:
        return x_branch_id
    
    # Usuarios normales: siempre su propia sede, ignorando el header
    return current_user.branch_id or 0

def get_current_client(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.Client:
    """
    Busca el registro de Cliente asociado al usuario actual por email.
    """
    client = db.query(models.Client).filter(
        models.Client.email == current_user.email,
        models.Client.status != "deleted"
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un registro de Cliente asociado a este usuario."
        )
    return client
