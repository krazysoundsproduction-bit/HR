# HR Management System Foundation

Production-ready scaffold for a role-based HR platform aimed at HR staff. The repository is organized as a small monorepo with:

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Database support:** PostgreSQL, MySQL, MongoDB
- **Local development:** Docker Compose

## Included foundation

### Core domains
- Employee management
- Recruitment
- Payroll & compensation
- Time & attendance
- Performance management
- Reports & analytics

### Architecture
```text
HR/
├── backend/                 # Express API, feature modules, database config
│   ├── database/schemas/    # PostgreSQL/MySQL/MongoDB schema sketches
│   └── src/
│       ├── config/          # environment and database selection
│       ├── modules/         # domain-focused route modules
│       └── routes/          # API composition
├── frontend/                # React app for HR staff dashboard foundation
├── .github/workflows/       # CI build validation
├── docker-compose.yml       # app + database containers
└── .env.example             # shared local environment defaults
```

## Quick start

### Option 1: Docker Compose
1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Start the stack:
   ```bash
   docker compose up --build
   ```
3. Open:
   - Frontend: `http://localhost:5173`
   - API: `http://localhost:4000/api`

### Option 2: Local Node.js development
1. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Run the API:
   ```bash
   cd backend && npm run dev
   ```
3. Run the frontend:
   ```bash
   cd frontend && npm run dev
   ```

## Backend notes

- `GET /api/health` reports service and selected database status.
- `GET /api/modules` returns the scaffolded HR modules.
- Feature endpoints are available under:
  - `/api/employees`
  - `/api/recruitment`
  - `/api/payroll`
  - `/api/time-attendance`
  - `/api/performance`
  - `/api/reports`

Database selection is controlled by `DB_CLIENT`:

- `postgres`
- `mysql`
- `mongodb`

## Frontend notes

The frontend is a React + Vite dashboard shell for HR staff. It highlights the available domains, supported databases, and operational next steps so the project can grow feature-by-feature without reworking the app structure.

## Schema sketches

Initial database sketches are included in:

- `backend/database/schemas/postgresql.sql`
- `backend/database/schemas/mysql.sql`
- `backend/database/schemas/mongodb.collections.json`

These are intentionally minimal starting points covering employees, recruitment, payroll, attendance, performance, and reporting data relationships.

## CI

A GitHub Actions workflow is included to install and build the backend and frontend on every push and pull request.
