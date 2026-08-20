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