# Mini Issue Triage Dashboard

A small internal tool for creating, triaging, and tracking engineering issues.

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod validation

### Backend
- NestJS
- TypeScript
- Prisma ORM
- Passport JWT auth
- bcrypt
- Multer
- class-validator

### Database
- PostgreSQL

### DevOps
- Docker Compose
- GitHub Actions CI

---

## Project Structure

- frontend/ - Next.js dashboard
- backend/ - NestJS API

---

## Requirements

- Node.js 18+ (recommended)
- npm
- Docker Desktop (optional)

---

# Setup

## 1) Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/triage_dashboard?schema=public"
JWT_SECRET="super-secret-key"
CORS_ORIGIN="http://localhost:3000"
# Optional cookie settings
# AUTH_COOKIE_NAME="triage_auth"
# AUTH_COOKIE_SECURE="false"
# AUTH_COOKIE_MAX_AGE_MS="86400000"
```

Run migrations + seed data:

```bash
npx prisma migrate dev
npm run db:seed
```

Start backend:

```bash
npm run start:dev
```

Backend runs on:

```txt
http://localhost:4000
```

---

## 2) Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

Start frontend:

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:3000
```

---

# Docker Setup

Build and start everything:

```bash
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

Services:

- Frontend → http://localhost:3000
- Backend → http://localhost:4000
- PostgreSQL → localhost:5432

Docker volumes are used for:
- PostgreSQL persistence
- uploaded file persistence

---

# Auth Flow

Authentication uses:
- JWT
- Passport.js strategies
- NestJS guards
- bcrypt password hashing
- httpOnly cookies

Flow:

1. User signs up or logs in
2. Backend validates credentials
3. JWT is set in a secure httpOnly cookie
4. Frontend sends requests with `credentials: "include"`
5. JwtAuthGuard validates the cookie on protected routes
6. Authenticated user injected into request automatically

Passwords are securely hashed using bcrypt before storage.

## Session Behavior

- Frontend calls `GET /auth/me` on load to validate the session.
- Invalid/expired sessions clear auth state and redirect to login.
- Logout clears the auth cookie and broadcasts a cross-tab logout signal.

## Rate Limiting

- `POST /auth/login` and `POST /auth/signup`
- 5 requests per minute per IP

## Security Notes

- JWTs are stored only in httpOnly cookies (no localStorage persistence).
- CORS is restricted to configured origins and supports credentials.
- File uploads enforce MIME type and size limits.

---

# User Roles & Permissions

## ADMIN
Can:
- create/edit/delete issues
- assign issues
- resolve/update issues
- create/edit/delete comments
- delete ANY comment
- access all issue actions

---

## DEVELOPER
Can:
- create issues
- update issue status
- assign issues to themselves
- create comments
- edit/delete OWN comments

Cannot:
- delete issues
- delete others comments

---

## VIEWER
Can:
- view issues
- view comments
- view activity logs

Cannot:
- create/edit/delete anything

---

# Seed User Credentials

Seeded users are created automatically.

| Role | Email | Password |
|---|---|---|
| ADMIN | minahil@example.com | password-minahil |
| DEVELOPER | aisha@example.com | password-aisha |
| DEVELOPER | omar@example.com | password-omar |
| DEVELOPER | zara@example.com | password-zara |
| DEVELOPER | ibrahim@example.com | password-ibrahim |

---

# API Endpoints

Base URL:

```txt
http://localhost:4000
```

---

## Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/signup | Create account |
| POST | /auth/login | Login + JWT |
| POST | /auth/logout | Logout + clear cookie |
| GET | /auth/me | Get current user |

---

## Issues

| Method | Endpoint |
|---|---|
| GET | /issues |
| GET | /issues/summary |
| GET | /issues/:id |
| POST | /issues |
| PATCH | /issues/:id |
| DELETE | /issues/:id |

Supports:
- pagination
- sorting
- search
- filters
- My Issues
- Unassigned Issues

---

## Comments

| Method | Endpoint |
|---|---|
| GET | /comments/issue/:issueId |
| POST | /comments |
| PATCH | /comments/:id |
| DELETE | /comments/:id |

---

## Attachments

| Method | Endpoint |
|---|---|
| POST | /attachments/upload |
| GET | /attachments/:id/download |

---

# Query Parameters

Supported issue query params:

- search
- status
- priority
- category
- assigneeId
- myIssues
- unassigned
- page
- limit
- sortBy
- sortOrder

---

# Implemented Features

- JWT authentication
- RBAC authorization
- relational issue assignments
- comments system
- activity logs
- realtime websocket notifications
- file attachments
- Dockerized setup
- E2E backend tests
- GitHub Actions CI
- pagination/search/filter/sorting
- protected frontend routes
- role-aware UI

---

# Testing

Run backend E2E tests:

```bash
npm run test:e2e
```

Tests include:
- auth flow
- JWT protection
- RBAC permissions
- ownership validation

---

# GitHub Actions CI

CI automatically runs on:
- push
- pull request

Pipeline includes:
- dependency install
- Prisma migrations
- linting
- E2E tests
- frontend/backend builds

---

# Assumptions / Tradeoffs

- WebSockets were chosen over RabbitMQ to keep architecture lightweight and monolithic-friendly.
- File uploads currently use local persistent storage for simplicity and Docker compatibility.
- JWT access-token auth was prioritized over refresh-token rotation due to project scope/time constraints.
- PostgreSQL replaced SQLite because relational auth/comments/activity structures fit PostgreSQL much better.
- Focus was placed on practical full-stack architecture rather than overengineering microservices.

---

# Optional Features Implemented

- realtime websocket notifications
- file attachments
- E2E/integration testing
- Postman collection export
- GitHub Actions CI pipeline

---

### Made in collaboration with Copilot