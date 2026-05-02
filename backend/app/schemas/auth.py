from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class TenantInfo(BaseModel):
    id: int
    name: str
    slug: str
    plan: str

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "admin"
    tenant_name: Optional[str] = None  # for new tenant registration
    tenant_slug: Optional[str] = None


class UserInvite(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "viewer"
    invite_code: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    tenant_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    tenant: TenantInfo


class TokenRefresh(BaseModel):
    refresh_token: str
