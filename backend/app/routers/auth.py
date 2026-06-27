
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RoleEnum
from app.schemas import UserCreate, UserOut, LoginRequest, OTPVerifyRequest, TokenResponse
from app.auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    generate_otp, save_otp, verify_otp
)
from app.redis_client import client as redis_client

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")

    if user.role == RoleEnum.editor:
        otp = generate_otp()
        session_token = save_otp(user.id, otp)
        return {
            "requires_otp": True,
            "session_token": session_token,
            "otp_code": otp
        }

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id)
    )

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(data: OTPVerifyRequest):
    if not verify_otp(data.session_token, data.otp_code):
        raise HTTPException(status_code=401, detail="OTP hatalı veya süresi doldu")

    user_id = redis_client.get(f"otp_user:{data.session_token}")
    if not user_id:
        raise HTTPException(status_code=401, detail="Oturum süresi doldu")

    redis_client.delete(f"otp_user:{data.session_token}")

    return TokenResponse(
        access_token=create_access_token(int(user_id)),
        refresh_token=create_refresh_token(int(user_id))
    )