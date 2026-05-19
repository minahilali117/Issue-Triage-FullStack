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
