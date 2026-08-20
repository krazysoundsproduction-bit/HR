import { Router } from 'express';
import { z } from 'zod';
import { db, id, nowIso } from '../data/store.js';
import { calculateLeaveBalance } from '../services/leaveCalculationService.js';
import {
  buildContractExpiryReminders,
  renderRenewalApprovalEmail,
} from '../services/notificationService.js';
import { requireRole } from './middleware.js';

const router = Router();

const contractSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  contractType: z.string().min(1),
  position: z.string().min(1),
  department: z.string().min(1),
  status: z.enum(['active', 'renewed', 'expired', 'terminated']).default('active'),
  renewalDates: z.array(z.string()).default([]),
  documentUrls: z.array(z.string()).default([]),
});

const leavePolicySchema = z.object({
  contractType: z.string().min(1),
  leaveType: z.enum(['annual', 'sick', 'special', 'unpaid', 'off_day']),
  daysPerYear: z.number().nonnegative(),
  carryoverMax: z.number().nonnegative(),
  accrualMethod: z.enum(['monthly', 'yearly']),
});

const leaveBalanceSchema = z.object({
  employeeId: z.string().min(1),
  year: z.number().int(),
  contractType: z.string().min(1),
  yearsOfService: z.number().nonnegative(),
  carryover: z.number().nonnegative().default(0),
  used: z.number().nonnegative().default(0),
  pending: z.number().nonnegative().default(0),
  offDays: z.number().nonnegative().default(0),
});

const leaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['annual', 'sick', 'special', 'unpaid', 'off_day']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  days: z.number().positive(),
  reason: z.string().min(1),
});

const renewalSchema = z.object({
  renewalDate: z.string().min(1),
  requestedBy: z.string().min(1),
});

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.auditLogs.set(event.id, event);
};

const history = (employeeId: string, eventType: string, details: string, changedBy: string) => {
  const event = {
    id: id('hist'),
    employeeId,
    eventType,
    timestamp: nowIso(),
    details,
    changedBy,
  };
  db.employmentHistory.set(event.id, event);
};

router.get('/contracts', requireRole(['hr', 'manager']), (req, res) => {
  const status = req.query.status as string | undefined;
  const employeeId = req.query.employeeId as string | undefined;
  const department = req.query.department as string | undefined;
  const records = [...db.contracts.values()].filter((contract) => {
    if (status && contract.status !== status) return false;
    if (employeeId && contract.employeeId !== employeeId) return false;
    if (department && contract.department !== department) return false;
    return true;
  });
  res.json(records);
});

router.post('/contracts', requireRole(['hr']), (req, res) => {
  const parsed = contractSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const contractId = id('contract');
  const record = {
    id: contractId,
    ...parsed.data,
    version: 1,
    archived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.contracts.set(contractId, record);
  history(record.employeeId, 'contract_created', `Contract ${contractId} created`, 'hr');
  audit('contract', contractId, 'create', 'hr', record);
  return res.status(201).json(record);
});

router.get('/contracts/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const record = db.contracts.get(String(req.params.id));
  if (!record) return res.status(404).json({ error: 'Contract not found' });
  return res.json(record);
});

router.put('/contracts/:id', requireRole(['hr']), (req, res) => {
  const existing = db.contracts.get(String(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Contract not found' });
  const parsed = contractSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const updated = {
    ...existing,
    ...parsed.data,
    version: existing.version + 1,
    updatedAt: nowIso(),
  };
  db.contracts.set(updated.id, updated);
  history(updated.employeeId, 'contract_updated', `Contract ${updated.id} updated`, 'hr');
  audit('contract', updated.id, 'update', 'hr', updated);
  return res.json(updated);
});

router.delete('/contracts/:id', requireRole(['hr']), (req, res) => {
  const existing = db.contracts.get(String(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Contract not found' });
  const archived = { ...existing, archived: true, status: 'terminated' as const, updatedAt: nowIso() };
  db.contracts.set(archived.id, archived);
  history(archived.employeeId, 'contract_archived', `Contract ${archived.id} archived`, 'hr');
  audit('contract', archived.id, 'archive', 'hr', archived);
  return res.status(204).send();
});

router.post('/contracts/import', requireRole(['hr']), (req, res) => {
  const csv = (req.body.csv as string | undefined) ?? '';
  const lines = csv.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return res.status(400).json({ error: 'CSV requires header and at least one row' });

  const [header, ...rows] = lines;
  const cols = header.split(',').map((s) => s.trim());
  const required = ['employeeId', 'startDate', 'endDate', 'contractType', 'position', 'department'];
  if (!required.every((column) => cols.includes(column))) {
    return res.status(400).json({ error: `CSV header must include: ${required.join(', ')}` });
  }

  const created = rows.map((row) => {
    const parts = row.split(',').map((s) => s.trim());
    const map = Object.fromEntries(cols.map((col, idx) => [col, parts[idx] || '']));
    const contractId = id('contract');
    const record = {
      id: contractId,
      employeeId: map.employeeId,
      startDate: map.startDate,
      endDate: map.endDate,
      contractType: map.contractType,
      position: map.position,
      department: map.department,
      status: 'active' as const,
      renewalDates: [],
      documentUrls: [],
      version: 1,
      archived: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.contracts.set(contractId, record);
    history(record.employeeId, 'contract_imported', `Contract ${contractId} imported`, 'hr');
    audit('contract', contractId, 'import', 'hr', record);
    return record;
  });

  return res.status(201).json({ createdCount: created.length, created });
});

router.post('/contracts/:id/renewals', requireRole(['hr']), (req, res) => {
  const contract = db.contracts.get(String(req.params.id));
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const parsed = renewalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const renewalId = id('renewal');
  const renewal = {
    id: renewalId,
    contractId: contract.id,
    renewalDate: parsed.data.renewalDate,
    status: 'pending' as const,
    requestedBy: parsed.data.requestedBy,
  };
  db.renewals.set(renewalId, renewal);

  const updatedContract = {
    ...contract,
    renewalDates: [...contract.renewalDates, parsed.data.renewalDate],
    updatedAt: nowIso(),
  };
  db.contracts.set(contract.id, updatedContract);

  const email = renderRenewalApprovalEmail(contract.id, parsed.data.renewalDate);
  history(contract.employeeId, 'renewal_requested', email.subject, parsed.data.requestedBy);
  audit('renewal', renewal.id, 'create', parsed.data.requestedBy, renewal);

  return res.status(201).json({ renewal, notification: email });
});

router.post('/renewals/:id/approve', requireRole(['manager', 'hr']), (req, res) => {
  const renewal = db.renewals.get(String(req.params.id));
  if (!renewal) return res.status(404).json({ error: 'Renewal not found' });
  const approver = (req.body.approvedBy as string | undefined) ?? 'manager';
  const updated = { ...renewal, status: 'approved' as const, approvedBy: approver };
  db.renewals.set(updated.id, updated);
  audit('renewal', updated.id, 'approve', approver, updated);
  return res.json(updated);
});

router.get('/renewals/upcoming', requireRole(['hr', 'manager']), (_req, res) => {
  const today = new Date();
  const reminders = buildContractExpiryReminders([...db.contracts.values()], today);
  res.json(reminders);
});

router.get('/leave-policies', requireRole(['hr', 'manager', 'employee']), (_req, res) => {
  res.json([...db.leavePolicies.values()]);
});

router.post('/leave-policies', requireRole(['hr']), (req, res) => {
  const parsed = leavePolicySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const record = { id: id('policy'), ...parsed.data };
  db.leavePolicies.set(record.id, record);
  audit('leave_policy', record.id, 'create', 'hr', record);
  return res.status(201).json(record);
});

router.post('/leave-balances', requireRole(['hr']), (req, res) => {
  const parsed = leaveBalanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const policyList = [...db.leavePolicies.values()];
  const calculated = calculateLeaveBalance({
    yearsOfService: parsed.data.yearsOfService,
    contractType: parsed.data.contractType,
    policies: policyList,
    carryover: parsed.data.carryover,
    used: parsed.data.used,
    pending: parsed.data.pending,
  });

  const record = {
    id: id('balance'),
    employeeId: parsed.data.employeeId,
    year: parsed.data.year,
    annualLeave: calculated.annualLeave,
    sickLeave: calculated.sickLeave,
    specialLeave: calculated.specialLeave,
    offDays: parsed.data.offDays,
    carryover: parsed.data.carryover,
    used: parsed.data.used,
    pending: parsed.data.pending,
    remaining: calculated.remaining,
    updatedAt: nowIso(),
  };
  db.leaveBalances.set(record.id, record);
  audit('leave_balance', record.id, 'create', 'hr', record);
  return res.status(201).json(record);
});

router.get('/leave-balances', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const employeeId = req.query.employeeId as string | undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const records = [...db.leaveBalances.values()].filter((record) => {
    if (employeeId && record.employeeId !== employeeId) return false;
    if (year && record.year !== year) return false;
    return true;
  });
  res.json(records);
});

router.put('/leave-balances/:id/recalculate', requireRole(['hr']), (req, res) => {
  const existing = db.leaveBalances.get(String(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Leave balance not found' });
  const yearsOfService = Number(req.body.yearsOfService ?? 0);
  const contractType = (req.body.contractType as string | undefined) ?? 'default';
  const calculated = calculateLeaveBalance({
    yearsOfService,
    contractType,
    policies: [...db.leavePolicies.values()],
    carryover: existing.carryover,
    used: existing.used,
    pending: existing.pending,
  });
  const updated = { ...existing, ...calculated, updatedAt: nowIso() };
  db.leaveBalances.set(updated.id, updated);
  audit('leave_balance', updated.id, 'recalculate', 'hr', updated);
  return res.json(updated);
});

router.post('/leave-requests', requireRole(['employee', 'hr']), (req, res) => {
  const parsed = leaveRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const record = {
    id: id('leave_req'),
    ...parsed.data,
    status: 'pending' as const,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.leaveRequests.set(record.id, record);

  const balance = [...db.leaveBalances.values()]
    .find((b) => b.employeeId === record.employeeId && b.year === new Date(record.startDate).getUTCFullYear());
  if (balance) {
    const updatedBalance = { ...balance, pending: balance.pending + record.days, remaining: Math.max(0, balance.remaining - record.days), updatedAt: nowIso() };
    db.leaveBalances.set(updatedBalance.id, updatedBalance);
  }

  history(record.employeeId, 'leave_requested', `Leave request ${record.id} submitted`, record.employeeId);
  audit('leave_request', record.id, 'create', record.employeeId, record);

  return res.status(201).json(record);
});

router.get('/leave-requests', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const status = req.query.status as string | undefined;
  const employeeId = req.query.employeeId as string | undefined;
  const records = [...db.leaveRequests.values()].filter((item) => {
    if (status && item.status !== status) return false;
    if (employeeId && item.employeeId !== employeeId) return false;
    return true;
  });
  return res.json(records);
});

router.post('/leave-requests/:id/approve', requireRole(['manager', 'hr']), (req, res) => {
  const request = db.leaveRequests.get(String(req.params.id));
  if (!request) return res.status(404).json({ error: 'Leave request not found' });
  const approvedBy = (req.body.approvedBy as string | undefined) ?? 'manager';
  const updated = { ...request, status: 'approved' as const, approvedBy, updatedAt: nowIso() };
  db.leaveRequests.set(updated.id, updated);

  const balance = [...db.leaveBalances.values()]
    .find((b) => b.employeeId === request.employeeId && b.year === new Date(request.startDate).getUTCFullYear());
  if (balance) {
    const updatedBalance = {
      ...balance,
      pending: Math.max(0, balance.pending - request.days),
      used: balance.used + request.days,
      updatedAt: nowIso(),
    };
    updatedBalance.remaining = Math.max(
      0,
      updatedBalance.annualLeave + updatedBalance.sickLeave + updatedBalance.specialLeave + updatedBalance.carryover - updatedBalance.used - updatedBalance.pending,
    );
    db.leaveBalances.set(updatedBalance.id, updatedBalance);
  }

  history(request.employeeId, 'leave_approved', `Leave request ${request.id} approved`, approvedBy);
  audit('leave_request', request.id, 'approve', approvedBy, updated);
  return res.json(updated);
});

router.post('/leave-requests/:id/reject', requireRole(['manager', 'hr']), (req, res) => {
  const request = db.leaveRequests.get(String(req.params.id));
  if (!request) return res.status(404).json({ error: 'Leave request not found' });
  const approvedBy = (req.body.approvedBy as string | undefined) ?? 'manager';
  const updated = { ...request, status: 'rejected' as const, approvedBy, updatedAt: nowIso() };
  db.leaveRequests.set(updated.id, updated);

  const balance = [...db.leaveBalances.values()]
    .find((b) => b.employeeId === request.employeeId && b.year === new Date(request.startDate).getUTCFullYear());
  if (balance) {
    const updatedBalance = {
      ...balance,
      pending: Math.max(0, balance.pending - request.days),
      remaining: balance.remaining + request.days,
      updatedAt: nowIso(),
    };
    db.leaveBalances.set(updatedBalance.id, updatedBalance);
  }

  history(request.employeeId, 'leave_rejected', `Leave request ${request.id} rejected`, approvedBy);
  audit('leave_request', request.id, 'reject', approvedBy, updated);
  return res.json(updated);
});

router.get('/employees/:employeeId/employment-summary', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const employeeId = req.params.employeeId;
  const contracts = [...db.contracts.values()].filter((contract) => contract.employeeId === employeeId);
  const events = [...db.employmentHistory.values()].filter((entry) => entry.employeeId === employeeId);

  if (contracts.length === 0) {
    return res.status(404).json({ error: 'Employee has no contracts' });
  }

  const firstContract = contracts.reduce((earliest, current) =>
    new Date(current.startDate) < new Date(earliest.startDate) ? current : earliest,
  );
  const latestContract = contracts.reduce((latest, current) =>
    new Date(current.endDate) > new Date(latest.endDate) ? current : latest,
  );

  const tenureYears = (Date.now() - new Date(firstContract.startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const probationEnd = new Date(firstContract.startDate);
  probationEnd.setMonth(probationEnd.getMonth() + 3);

  return res.json({
    employeeId,
    hireDate: firstContract.startDate,
    latestContractEndDate: latestContract.endDate,
    renewalDates: contracts.flatMap((contract) => contract.renewalDates),
    tenureYears: Number(tenureYears.toFixed(2)),
    probationEnd: probationEnd.toISOString().slice(0, 10),
    probationStatus: Date.now() > probationEnd.getTime() ? 'completed' : 'active',
    employmentStatus: latestContract.status,
    historyTimeline: events.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  });
});

router.get('/reports/contracts-expiring', requireRole(['hr', 'manager']), (_req, res) => {
  const reminders = buildContractExpiryReminders([...db.contracts.values()]);
  return res.json(reminders);
});

router.get('/reports/upcoming-renewals', requireRole(['hr', 'manager']), (_req, res) => {
  const list = [...db.renewals.values()].filter((r) => r.status === 'pending' || r.status === 'approved');
  return res.json(list);
});

router.get('/reports/leave-balances', requireRole(['hr', 'manager']), (_req, res) => {
  const byEmployee = [...db.leaveBalances.values()].map((balance) => ({
    employeeId: balance.employeeId,
    department: [...db.contracts.values()].find((c) => c.employeeId === balance.employeeId)?.department ?? 'unknown',
    remaining: balance.remaining,
    used: balance.used,
    pending: balance.pending,
  }));

  return res.json(byEmployee);
});

router.get('/reports/leave-trends', requireRole(['hr', 'manager']), (_req, res) => {
  const trend = [...db.leaveRequests.values()].reduce<Record<string, number>>((acc, reqItem) => {
    const month = reqItem.startDate.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + reqItem.days;
    return acc;
  }, {});
  return res.json(trend);
});

router.get('/reports/employee-tenure', requireRole(['hr', 'manager']), (_req, res) => {
  const result = [...db.contracts.values()].reduce<Record<string, { employeeId: string; department: string; tenureYears: number }>>((acc, contract) => {
    if (acc[contract.employeeId]) return acc;
    const tenureYears = (Date.now() - new Date(contract.startDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    acc[contract.employeeId] = {
      employeeId: contract.employeeId,
      department: contract.department,
      tenureYears: Number(tenureYears.toFixed(2)),
    };
    return acc;
  }, {});

  return res.json(Object.values(result));
});

router.get('/reports/export/contracts.csv', requireRole(['hr', 'manager']), (_req, res) => {
  const rows = ['contract_id,employee_id,start_date,end_date,contract_type,status,department'];
  for (const contract of db.contracts.values()) {
    rows.push([
      contract.id,
      contract.employeeId,
      contract.startDate,
      contract.endDate,
      contract.contractType,
      contract.status,
      contract.department,
    ].join(','));
  }
  res.header('content-type', 'text/csv');
  res.send(rows.join('\n'));
});

router.get('/audit-logs', requireRole(['hr']), (_req, res) => {
  res.json([...db.auditLogs.values()]);
});

export default router;
