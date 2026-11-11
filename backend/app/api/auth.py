from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.api.deps import get_uow, get_current_user
from app.uow.unit_of_work import UnitOfWork
from app.use_cases.auth import AuthUseCases, UserUseCases
from app.schemas.auth.token import Token
from app.schemas.auth.user import User as UserSchema
from app import models
from app.schemas.auth.user import UserCreate    

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    uow: UnitOfWork = Depends(get_uow),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    Logic is delegated to AuthUseCases for security and consistency.
    """
    use_case = AuthUseCases(uow)
    token = use_case.authenticate_user(form_data.username, form_data.password)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    return token

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: models.User = Depends(get_current_user),
):
    """
    Get current user.
    """
    return current_user

@router.post("/refresh", response_model=Token)
def refresh_token(
    current_user: models.User = Depends(get_current_user),
):
    """
    Refresh the access token for the current user.
    """
    from app.core import security
    access_token = security.create_access_token(current_user.id)
    return Token(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/register", response_model=UserSchema)
def register_user(
    user_in: UserCreate,
    uow: UnitOfWork = Depends(get_uow),
    current_user: models.User = Depends(get_current_user),
):
    """
    Register a new user.
    """
    # only admin can register users
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to register users",
        )
    
    use_case = UserUseCases(uow)
    try:
        return use_case.create(user_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
