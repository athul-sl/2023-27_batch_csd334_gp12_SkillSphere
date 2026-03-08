"""All utility functions: security, exceptions, logging."""
from datetime import datetime, timedelta
from typing import Optional, Union
import re
import logging
import sys
import uuid

from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import get_db

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token
security = HTTPBearer()


# ============ PASSWORD FUNCTIONS ============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ============ EMAIL VALIDATION ============

def validate_college_email(email: str) -> bool:
    domain = settings.allowed_email_domain
    pattern = rf"^[a-zA-Z0-9._%+-]+@{re.escape(domain)}$"
    return bool(re.match(pattern, email, re.IGNORECASE))


# ============ JWT TOKENS ============

def create_access_token(subject: Union[str, int], additional_claims: Optional[dict] = None, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": str(subject), "exp": expire, "type": "access"}
    if additional_claims:
        to_encode.update(additional_claims)
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def create_refresh_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.utcnow() + (expires_delta or timedelta(days=settings.refresh_token_expire_days))
    to_encode = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})


# ============ AUTH DEPENDENCIES ============

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    from app.models import User, UserStatus
    
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="User account is not active")
    
    return user

async def get_admin_user(current_user = Depends(get_current_user)):
    from app.models import UserRole
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ============ HELPER FUNCTIONS ============

def generate_order_number() -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"ORD-{timestamp}-{unique_id}"


# ============ LOGGING ============

def setup_logging(log_level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# ============ EXCEPTION HANDLERS ============

class AppException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def app_exception_handler(request: Request, exc: AppException):
    logger.error(f"AppException: {exc.message}", exc_info=True)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": exc.errors()})

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error: {str(exc)}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Database error occurred"})

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred"})
