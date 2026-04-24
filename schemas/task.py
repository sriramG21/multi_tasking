from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    organization_id: UUID
    created_by: UUID
    assigned_to: Optional[UUID]
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True