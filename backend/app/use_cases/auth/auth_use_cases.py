from typing import Optional
from app.uow.unit_of_work import UnitOfWork
from app.core import security
from app.schemas.auth.token import Token

class AuthUseCases:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    def authenticate_user(self, email: str, password: str) -> Optional[Token]:
        # 1. Fetch user
        user = self.uow.users.get_by_email(email)
        if not user or not user.is_active:
            return None
            
        # 2. Verify password
        if not security.verify_password(password, user.password_hash):
            return None
            
        # 3. Create access token
        access_token = security.create_access_token(user.id)
        return Token(
            access_token=access_token,
            token_type="bearer"
        )

    def register_user(self, user_in: any): # Placeholder for registration logic
        pass
