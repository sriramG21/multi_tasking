from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.database import engine, Base
from app.models import *
from app.config import settings
from app.routers import auth, tasks, organizations
from app.routers import auth, tasks, organizations, users

# and at the bottom:


app = FastAPI(title="MultiTenant Task Manager", version="1.0.0")

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(organizations.router)
from starlette.middleware.sessions import SessionMiddleware
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
from app.routers import auth, tasks, users, organizations

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(organizations.router)
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(organizations.router)
app.include_router(users.router)