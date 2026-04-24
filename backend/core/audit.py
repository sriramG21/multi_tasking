from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.models.user import User
import uuid

async def log_action(
    db: AsyncSession,
    user: User,
    action: str,
    resource_type: str,
    resource_id: uuid.UUID,
    metadata: dict = None
):
    log = AuditLog(
        organization_id=user.organization_id,
        user_id=user.id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_=metadata or {}
    )
    db.add(log)
    # Don't commit here — caller commits with the main transaction