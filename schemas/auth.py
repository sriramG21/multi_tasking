from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    org_name: str           # creates a new org OR...
    org_slug: str           # ...or join existing by slug

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    role: str
    organization_id: Optional[UUID]

    class Config:
        from_attributes = True