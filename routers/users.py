from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.core.permissions import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    users = result.scalars().all()
    return [{"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role}
            for u in users]
