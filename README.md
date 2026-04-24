cd "C:\Users\Sriram G\OneDrive\Desktop\multi_task"

Set-Content -Path "README.md" -Value @'
# Multi-Tenant Task Management System

A full-stack task management system with multi-tenancy, RBAC, JWT auth, and Google OAuth.

## Tech Stack
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: JWT + Google OAuth
- **Container**: Docker + docker-compose

## Quick Start

```bash
cp .env.example .env
# Add your SECRET_KEY and optionally Google OAuth credentials
docker compose up --build
```

- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Features
- Multi-tenant isolation (org-scoped queries)
- RBAC: Admin (full access) vs Member (own tasks only)
- JWT Authentication (register/login/refresh)
- Google OAuth login
- Full task CRUD (create, read, update, delete)
- Audit logs for all task actions (admin only)
- Dockerized with docker-compose

## Roles
| Action | Admin | Member |
|--------|-------|--------|
| Create task | ✅ | ✅ |
| View all org tasks | ✅ | ✅ |
| Update own task | ✅ | ✅ |
| Update any task | ✅ | ❌ |
| Delete own task | ✅ | ✅ |
| Delete any task | ✅ | ❌ |
| View audit logs | ✅ | ❌ |
| Manage members | ✅ | ❌ |

## API Endpoints
- `POST /auth/register` - Register + create/join org
- `POST /auth/login` - Login
- `GET /auth/me` - Current user
- `GET /auth/google` - Google OAuth
- `POST /tasks/` - Create task
- `GET /tasks/` - List org tasks
- `PATCH /tasks/{id}` - Update task
- `DELETE /tasks/{id}` - Delete task
- `GET /organizations/members` - List members
- `GET /organizations/audit-logs` - Audit logs (admin)
'@ -Encoding UTF8