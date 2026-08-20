# HR Internal Payroll Engine (No Payments)

This repository contains an internal-only HR/payroll calculation engine built on:

- **Backend:** Python 3.11+ / Django 4.2+
- **Database:** MySQL 8.0+ or PostgreSQL 15+ (configurable via env vars)
- **Frontend baseline:** Django templates (ready for Tailwind/JS integration)
- **Hosting target:** On-premises internal server

## Guardrails

- No external banking or payment integrations.
- No ABA/DES/clearing bank file generation.
- Internal data hand-off only (payroll calculation + spreadsheet output for manual finance processing).

## Implemented modules

### A) Employee Registry & Hierarchy

- Employee profile fields: name, employee ID, email, job description, department, duty station.
- User roles via `UserProfile`: System Admin, HR Manager, Line Manager, Staff.
- Permission helpers in `hr_core/permissions.py` for read/edit/signoff decisions.

### B) 7-Day Contract Expiry Warning Engine

- Daily command: `send_contract_expiry_reminders`
- Sends reminder to employee email and CCs `hr-manager@iccc.gov.pg`.
- Sets `reminder_sent_7days=True` after successful send to enforce one-time delivery.

Cron example for 06:00 daily:

```cron
0 6 * * * /path/to/venv/bin/python /path/to/repo/manage.py send_contract_expiry_reminders
```

### C) Internal Calculation Engine & Ledger

- Fortnightly payroll math implemented in `hr_core/services/payroll.py`:
  - Gross earnings = base salary + active allowances
  - SWT calculation function
  - Superannuation:
    - Employee deduction: 6%
    - Employer contribution: 8.4%
- Secure internal export utility in `hr_core/services/export.py`:
  - Exports payroll rows as CSV
  - Encrypts output with password-derived key

## Security controls

- Password minimum length = 10
- Bcrypt password hashing enabled
- Session timeout after 15 minutes of inactivity
- Immutable audit log model stores: timestamp, user, action, IP address

## Setup

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py test hr_core
```

Database engine can be set with env vars:

- `DB_ENGINE` (`django.db.backends.postgresql` or `django.db.backends.mysql`)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

---

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
