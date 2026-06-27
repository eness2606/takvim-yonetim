from pydantic import BaseModel, EmailStr
from app.models import RoleEnum

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.viewer

class UserOut(BaseModel):
    id: int
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
