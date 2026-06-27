from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import get_db
from app.models import User, RoleEnum
from app.config import settings
from app.redis_client import client as redis_client

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Geçersiz token formatı")
    except ValueError:
        raise HTTPException(status_code=401, detail="Geçersiz token formatı")

    if not redis_client.exists(f"access:{token}"):
        raise HTTPException(status_code=401, detail="Token geçersiz veya süresi doldu")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Token doğrulanamadı")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")

    return user

def require_editor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.editor:
        raise HTTPException(status_code=403, detail="Bu işlem için editor yetkisi gerekli")
    return current_user