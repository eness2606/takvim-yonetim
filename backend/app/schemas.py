from pydantic import BaseModel, EmailStr, field_validator
from app.models import RoleEnum

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.viewer

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 8:
            raise ValueError("Şifre en az 8 karakter olmalı")
        if not any(c.isupper() for c in value):
            raise ValueError("Şifre en az bir büyük harf içermeli")
        if not any(c.isdigit() for c in value):
            raise ValueError("Şifre en az bir rakam içermeli")
        return value

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: RoleEnum

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerifyRequest(BaseModel):
    session_token: str
    otp_code: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
