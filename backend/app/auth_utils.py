import random
import string
import uuid
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.config import settings
from app.redis_client import client as redis_client

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

def create_access_token(user_id: int) -> str:
    token = create_token(
        {"sub": str(user_id), "type": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    redis_client.setex(f"access:{token}", settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, str(user_id))
    return token

def create_refresh_token(user_id: int) -> str:
    token = create_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    redis_client.setex(f"refresh:{token}", settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, str(user_id))
    return token

def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))

def save_otp(user_id: int, otp: str) -> str:
    session_token = str(uuid.uuid4())
    redis_client.setex(f"otp:{session_token}", 120, otp)
    redis_client.setex(f"otp_user:{session_token}", 120, str(user_id))
    return session_token

def verify_otp(session_token: str, otp_code: str) -> bool:
    stored = redis_client.get(f"otp:{session_token}")
    if stored and stored == otp_code:
        redis_client.delete(f"otp:{session_token}")
        return True
    return False