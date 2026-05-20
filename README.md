# Mini Issue Triage Dashboard

A small internal tool for creating, triaging, and tracking engineering issues.

## Tech Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: NestJS + TypeScript + Prisma
- Database: SQLite (local)

## Project Structure

- frontend/ - Next.js dashboard
- backend/ - NestJS API

## Requirements

- Node.js 18+ (recommended)
- npm

## Setup

### 1) Backend

```bash
cd backend
npm install
```

Create the database and seed data:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Start the API:

```bash
npm run start:dev
```

The API runs on http://localhost:4000 by default.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:3000 by default.

## Docker

Build and run both services with Docker Compose:

```bash
docker compose up --build
```

Stop and remove containers:

```bash
docker compose down
```

Ports:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Environment Variables

### backend/.env

```bash
DATABASE_URL="file:./dev.db"
```

### frontend/.env.local

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## API Endpoints

Base URL: http://localhost:4000

- GET /issues - List issues with filters, pagination, and sorting
- GET /issues/summary - Summary counts for dashboard cards
- GET /issues/:id - Get a single issue
- POST /issues - Create an issue
- PATCH /issues/:id - Update an issue
- DELETE /issues/:id - Remove an issue

### Query Parameters

- search
- status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- priority (LOW, MEDIUM, HIGH, CRITICAL)
- category
- assignee
- page (default 1)
- limit (default 10, max 100)
- sortBy (createdAt, updatedAt, priority)
- sortOrder (asc, desc)


## Default seeded accounts

The backend seed script creates sample users and issues when the database is empty. Seeded user emails follow the pattern <name>@example.com and their passwords are `password-<name>` (all lowercase). Example seeded accounts:

- **Admin**: minahil@example.com / password-minahil
- **Developer**: aisha@example.com / password-aisha
- **Developer**: omar@example.com / password-omar
- **Developer**: zara@example.com / password-zara
- **Developer**: ibrahim@example.com / password-ibrahim

You can see the seeding logic in [backend/prisma/seed.cjs](backend/prisma/seed.cjs#L1-L40).

Use these accounts to log in via the API or in the frontend during development.

## Auth API examples

Sign up (creates a Viewer role by default):

```bash
curl -X POST http://localhost:4000/auth/signup \
	-H "Content-Type: application/json" \
	-d '{"email":"newuser@example.com","password":"securepass","name":"New User"}'
```

Log in (returns `user` and `accessToken`):

```bash
curl -X POST http://localhost:4000/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"minahil@example.com","password":"password-minahil"}'
```

Example response:

```json
{
	"user": {
		"id": 1,
		"email": "minahil@example.com",
		"name": "Minahil",
		"role": "ADMIN",
		"createdAt": "...",
		"updatedAt": "..."
	},
	"accessToken": "<JWT_TOKEN>"
}
```

Use the token to call authenticated endpoints (replace <JWT_TOKEN> with the token from login):

```bash
curl http://localhost:4000/auth/me \
	-H "Authorization: Bearer <JWT_TOKEN>"
```

## Implemented features

- Authentication: signup, login, JWT-based `Authorization: Bearer` tokens, and `GET /auth/me`.
- Role-based permissions: `ADMIN`, `DEVELOPER`, and `VIEWER` roles with different update rights.
- Issues API: create, list (filters, search, pagination, sorting), get by id (includes comments & activity), update (role-aware), delete.
- Summary endpoint: `GET /issues/summary` for dashboard cards.
- Seed data: sample users and 20 sample issues created by the seed script (see [backend/prisma/seed.cjs](backend/prisma/seed.cjs#L1-L200)).
- Frontend: Next.js App Router with components for listing, creating, filtering, and editing issues.

If you'd like, I can also add example Postman collection or update the frontend README with how to use the seeded accounts in the UI.

### Made in collaboration with Copilot

