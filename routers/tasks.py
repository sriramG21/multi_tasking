from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.core.permissions import get_current_user, check_task_ownership
from app.core.audit import log_action
from typing import List
import uuid

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/", response_model=TaskOut)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = Task(
        **payload.model_dump(),
        organization_id=current_user.organization_id,  # ← tenant isolation
        created_by=current_user.id
    )
    db.add(task)
    await db.flush()
    await log_action(db, current_user, "task.created", "task", task.id,
                     {"title": task.title})
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/", response_model=List[TaskOut])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ALWAYS filter by org — strict tenant isolation
    result = await db.execute(
        select(Task)
        .where(Task.organization_id == current_user.organization_id)
        .order_by(Task.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.organization_id == current_user.organization_id  # tenant check
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.organization_id == current_user.organization_id
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    check_task_ownership(task, current_user, "update")  # RBAC check

    before = {"status": task.status, "title": task.title}
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await log_action(db, current_user, "task.updated", "task", task.id,
                     {"before": before, "after": payload.model_dump(exclude_unset=True)})
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Task).where(
            Task.id == task_id,
            Task.organization_id == current_user.organization_id
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    check_task_ownership(task, current_user, "delete")  # RBAC check

    await log_action(db, current_user, "task.deleted", "task", task.id,
                     {"title": task.title})
    await db.delete(task)
    await db.commit()