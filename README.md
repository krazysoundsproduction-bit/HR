# HR - Employment Tracker Module

This repository now contains a full Employment Tracker module with:

- Node.js/Express + TypeScript backend (`/home/runner/work/HR/HR/backend`)
- React + TypeScript frontend (`/home/runner/work/HR/HR/frontend`)
- SQL schema for required tracker tables (`/home/runner/work/HR/HR/backend/db/employment_tracker_schema.sql`)

## Backend highlights

- Employment contract CRUD + archive
- Contract renewal workflow + upcoming expiry reminders (30/14/7 days)
- Leave policy configuration
- Leave balance creation/recalculation (carryover, pending, remaining)
- Leave request submission + manager approval/rejection workflow
- Employment summary endpoint (tenure + probation tracking)
- Reporting endpoints (expiry dashboard, renewals, leave balances, trends, tenure)
- CSV export and bulk import for contracts
- Role-based access (`x-role` header: `hr`, `manager`, `employee`)
- Audit log and employment history tracking

## Quick start

```bash
cd /home/runner/work/HR/HR/backend
npm install
npm run build
npm run dev
```

API base URL: `http://localhost:3001/api/employment-tracker`

```bash
cd /home/runner/work/HR/HR/frontend
npm install
npm run dev
```
