from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .seed import seed_db
from .routers import auth, patrol, logs, analytics, reports, locations, users

# Initialize FastAPI
app = FastAPI(
    title="NFC-Based Security Logger System API",
    description="Backend services for patrol logging, security checkins, map visualizing and PDF analytics reporting.",
    version="1.0.0"
)

# CORS configurations allowing local Next.js client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto seed database on startup
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()

# Include routers
app.include_router(auth.router)
app.include_router(patrol.router)
app.include_router(logs.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(locations.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "NFC Security Logger API",
        "version": "1.0.0"
    }
