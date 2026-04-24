from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.permissions import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/members")
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    members = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role}
            for u in members]

@router.get("/audit-logs")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin"))  # admin only
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
    )
    logs = result.scalars().all()
    return [{"id": str(l.id), "action": l.action, "user_id": str(l.user_id),
             "resource_type": l.resource_type, "metadata": l.metadata_,
             "created_at": l.created_at} for l in logs]

@router.patch("/members/{user_id}/role")
async def update_member_role(
    user_id: str,
    role: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    from sqlalchemy import select
    import uuid
    result = await db.execute(
        select(User).where(
            User.id == uuid.UUID(user_id),
            User.organization_id == current_user.organization_id
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(404, "User not found in your organization")
    if role not in ("admin", "member"):
        from fastapi import HTTPException
        raise HTTPException(400, "Role must be 'admin' or 'member'")
    user.role = role
    await db.commit()
    return {"message": f"Role updated to {role}"}