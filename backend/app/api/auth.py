from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.core import security
from app.config import settings
from app.schemas.user import Token, UserCreate, User
from app.crud import user as crud_user
from app.api import deps

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, para obtener un token de acceso
    """
    user = crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif user.status != "active":
        raise HTTPException(status_code=400, detail="Usuario Inactivo")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=User)
def get_current_user_me(
    current_user = Depends(deps.get_current_user)
):
    """
    Obtener información y permisos del usuario logueado.
    """
    return current_user

@router.post("/register", response_model=User)
def register_initial_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Crea el usuario inicial (Solo debería estar activo al inicio o protegido para Admins posteriormente)
    """
    try:
        user = crud_user.get_user_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="El usuario con este correo electrónico ya existe en el sistema.",
            )
        user = crud_user.create_user(db, user=user_in)
        return user
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
