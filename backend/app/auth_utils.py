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
    # Bu kullanıcı için en son geçerli oturumu işaretle; yeni istek eskisini geçersiz kılar
    redis_client.setex(f"otp_active:{user_id}", 120, session_token)
    return session_token

def verify_otp(session_token: str, otp_code: str) -> int | None:
    user_id = redis_client.get(f"otp_user:{session_token}")
    if not user_id:
        return None

    active_session = redis_client.get(f"otp_active:{user_id}")
    if active_session != session_token:
        return None  # daha yeni bir OTP istenmiş, bu kod artık geçersiz

    stored = redis_client.get(f"otp:{session_token}")
    if stored != otp_code:
        return None

    redis_client.delete(f"otp:{session_token}")
    redis_client.delete(f"otp_user:{session_token}")
    redis_client.delete(f"otp_active:{user_id}")
    return int(user_id)