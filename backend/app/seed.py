from sqlalchemy.orm import Session
from app.models import User, Event, RoleEnum
from app.auth_utils import hash_password
from datetime import datetime

def seed_db(db: Session):
    if db.query(User).first():
        return

    editor = User(
        email="editor@test.com",
        hashed_password=hash_password("Editor123"),
        role=RoleEnum.editor
    )
    viewer = User(
        email="viewer@test.com",
        hashed_password=hash_password("Viewer123"),
        role=RoleEnum.viewer
    )
    db.add_all([editor, viewer])
    db.commit()
    db.refresh(editor)

    events = [
        Event(title="Proje Toplantısı", description="Haftalık proje değerlendirmesi",
              start_time=datetime(2026, 6, 27, 10, 0), end_time=datetime(2026, 6, 27, 11, 0),
              owner_id=editor.id),
        Event(title="Doktor Randevusu", description="Yıllık kontrol",
              start_time=datetime(2026, 6, 28, 14, 0), end_time=datetime(2026, 6, 28, 15, 0),
              owner_id=editor.id),
        Event(title="Spor", description="Gym",
              start_time=datetime(2026, 6, 29, 18, 0), end_time=datetime(2026, 6, 29, 19, 0),
              owner_id=editor.id),
    ]
    db.add_all(events)
    db.commit()