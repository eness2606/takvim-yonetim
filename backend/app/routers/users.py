from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import UserOut
from app.dependencies import require_editor

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_editor)):
    return db.query(User).all()
