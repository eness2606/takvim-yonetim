from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.routers import auth, events, users
from app.seed import seed_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Takvim Yönetim API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(users.router)

@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Takvim API çalışıyor"}