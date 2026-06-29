from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import Event, User
from app.dependencies import get_current_user, require_editor

router = APIRouter(prefix="/events", tags=["events"])

class EventCreate(BaseModel):
    title: str
    description: str = ""
    start_time: datetime
    end_time: datetime

class EventOut(BaseModel):
    id: int
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    owner_id: int

    class Config:
        from_attributes = True

@router.get("/", response_model=List[EventOut])
def list_events(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    title: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Event)
    if start_date:
        query = query.filter(Event.start_time >= start_date)
    if end_date:
        query = query.filter(Event.start_time <= end_date)
    if title:
        query = query.filter(Event.title.ilike(f"%{title}%"))

    response.headers["X-Total-Count"] = str(query.count())
    return query.order_by(Event.start_time).offset(skip).limit(limit).all()

@router.post("/", response_model=EventOut, status_code=201)
def create_event(data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_editor)):
    event = Event(**data.model_dump(), owner_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, data: EventCreate, db: Session = Depends(get_db), current_user: User = Depends(require_editor)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı")
    for key, value in data.model_dump().items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_editor)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı")
    db.delete(event)
    db.commit()
    return {"message": "Etkinlik silindi"}