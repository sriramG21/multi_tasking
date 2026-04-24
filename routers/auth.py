from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.permissions import get_current_user
import uuid, re

router = APIRouter(prefix="/auth", tags=["Auth"])

def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9-]', '-', text.lower().strip()).strip('-')

@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # Find or create organization by slug
    slug = slugify(payload.org_slug) if payload.org_slug else slugify(payload.org_name)
    org_result = await db.execute(select(Organization).where(Organization.slug == slug))
    org = org_result.scalar_one_or_none()

    if not org:
        # First user creates the org and becomes admin
        org = Organization(name=payload.org_name, slug=slug)
        db.add(org)
        await db.flush()  # get org.id without committing
        role = "admin"
    else:
        role = "member"   # subsequent users joining an org are members

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        organization_id=org.id,
        role=role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token_data = {"sub": str(user.id), "org_id": str(org.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password or ""):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {"sub": str(user.id), "org_id": str(user.organization_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")

    token_data = {"sub": str(user.id), "org_id": str(user.organization_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data)
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
from app.core.oauth import oauth
from starlette.requests import Request
from fastapi.responses import RedirectResponse

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    email = user_info["email"]
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create org from email domain
        domain = email.split("@")[1].replace(".", "-")
        org_result = await db.execute(select(Organization).where(Organization.slug == domain))
        org = org_result.scalar_one_or_none()
        if not org:
            org = Organization(name=domain, slug=domain)
            db.add(org)
            await db.flush()

        user = User(
            email=email,
            full_name=user_info.get("name"),
            oauth_provider="google",
            oauth_id=user_info["sub"],
            organization_id=org.id,
            role="admin" if not org else "member"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": str(user.id), "org_id": str(user.organization_id), "role": user.role}
    access_token = create_access_token(token_data)
    refresh_token_str = create_refresh_token(token_data)

    # Redirect to frontend with tokens
    return RedirectResponse(
        f"{settings.FRONTEND_URL}/oauth-callback?access_token={access_token}&refresh_token={refresh_token_str}"
    )