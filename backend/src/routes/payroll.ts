import { Router } from 'express';
import { z } from 'zod';
import { db, id, nowIso } from '../data/store.js';
import { calculatePayrollEntry, generatePayrollCSV } from '../services/payrollService.js';
import { requireRole } from './middleware.js';

const router = Router();

const DEFAULT_TAX_RATE = 0.3;
const DEFAULT_SUPER_RATE = 0.084;
const DEFAULT_EMPLOYEE_ID = 'system';

const employeeSchema = z.object({
  name: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  salaryType: z.enum(['hourly', 'salary']),
  baseSalary: z.number().nonnegative(),
  allowances: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(1).default(DEFAULT_TAX_RATE),
  superRate: z.number().min(0).max(1).default(DEFAULT_SUPER_RATE),
});

const employeeUpdateSchema = employeeSchema.partial().refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required',
});

const payrollRunSchema = z.object({
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  createdBy: z.string().min(1).default('hr'),
});

const payrollEntrySchema = z.object({
  employeeId: z.string().min(1),
  hoursWorked: z.number().nonnegative().optional(),
  overtimeHours: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

const salaryAdjustmentSchema = z.object({
  employeeId: z.string().min(1),
  oldSalary: z.number().nonnegative().optional(),
  newSalary: z.number().nonnegative(),
  effectiveDate: z.string().min(1),
  reason: z.string().min(1),
});

const approvalSchema = z.object({
  approvedBy: z.string().min(1).optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const round = (value: number) => Number(value.toFixed(2));

const paginate = <T,>(items: T[], query: unknown) => {
  const { limit, offset } = paginationSchema.parse(query);
  return {
    total: items.length,
    limit,
    offset,
    items: items.slice(offset, offset + limit),
  };
};

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('pay_audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.payrollAudits.set(event.id, event);
  db.auditLogs.set(event.id, event);
};

const recalculateRunTotals = (runId: string) => {
  const run = db.payrollRuns.get(runId);
  if (!run) {
    return undefined;
  }
  const entries = [...db.payrollEntries.values()].filter((entry) => entry.runId === runId);
  const totalGross = round(entries.reduce((sum, entry) => sum + entry.grossPay, 0));
  const totalNet = round(entries.reduce((sum, entry) => sum + entry.netPay, 0));
  const totalTax = round(entries.reduce((sum, entry) => sum + entry.taxWithheld, 0));
  const updatedRun = { ...run, totalGross, totalNet, totalTax };
  db.payrollRuns.set(runId, updatedRun);
  return updatedRun;
};

router.post('/employees', requireRole(['hr']), (req, res) => {
  const parsed = employeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const employee = {
    id: id('pay_emp'),
    ...parsed.data,
  };
  db.payrollEmployees.set(employee.id, employee);
  audit('payroll_employee', employee.id, 'create', req.header('x-employee-id') || 'hr', employee);
  return res.status(201).json(employee);
});

router.get('/employees', requireRole(['hr', 'manager']), (req, res) => {
  const department = typeof req.query.department === 'string' ? req.query.department : undefined;
  const name = typeof req.query.name === 'string' ? req.query.name.toLowerCase() : undefined;
  const employees = [...db.payrollEmployees.values()].filter((employee) => {
    if (department && employee.department !== department) return false;
    if (name && !employee.name.toLowerCase().includes(name)) return false;
    return true;
  });
  return res.json(paginate(employees, req.query));
});

router.get('/employees/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const employee = db.payrollEmployees.get(String(req.params.id));
  if (!employee) {
    return res.status(404).json({ error: 'Payroll employee not found' });
  }
  return res.json(employee);
});

router.patch('/employees/:id', requireRole(['hr']), (req, res) => {
  const existing = db.payrollEmployees.get(String(req.params.id));
  if (!existing) {
    return res.status(404).json({ error: 'Payroll employee not found' });
  }
  const parsed = employeeUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = { ...existing, ...parsed.data };
  db.payrollEmployees.set(updated.id, updated);
  audit('payroll_employee', updated.id, 'update', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.post('/runs', requireRole(['hr']), (req, res) => {
  const parsed = payrollRunSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const run = {
    id: id('pay_run'),
    periodStart: parsed.data.periodStart,
    periodEnd: parsed.data.periodEnd,
    status: 'draft' as const,
    createdBy: parsed.data.createdBy,
    totalGross: 0,
    totalNet: 0,
    totalTax: 0,
  };
  db.payrollRuns.set(run.id, run);
  audit('payroll_run', run.id, 'create', req.header('x-employee-id') || run.createdBy, run);
  return res.status(201).json(run);
});

router.get('/runs', requireRole(['hr', 'manager']), (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const runs = [...db.payrollRuns.values()].filter((run) => !status || run.status === status);
  return res.json(paginate(runs.sort((a, b) => b.periodStart.localeCompare(a.periodStart)), req.query));
});

router.get('/runs/:id', requireRole(['hr', 'manager']), (req, res) => {
  const run = db.payrollRuns.get(String(req.params.id));
  if (!run) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }
  const entries = [...db.payrollEntries.values()].filter((entry) => entry.runId === run.id);
  return res.json({ ...run, entries });
});

router.post('/runs/:id/entries', requireRole(['hr']), (req, res) => {
  const run = db.payrollRuns.get(String(req.params.id));
  if (!run) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }
  if (run.status !== 'draft') {
    return res.status(400).json({ error: 'Entries can only be added to draft payroll runs' });
  }
  const parsed = payrollEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const employee = db.payrollEmployees.get(parsed.data.employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Payroll employee not found' });
  }

  const computed = calculatePayrollEntry(
    employee,
    parsed.data.hoursWorked ?? 0,
    parsed.data.overtimeHours ?? 0,
    parsed.data.deductions,
  );
  const entry = {
    id: id('pay_entry'),
    runId: run.id,
    employeeId: employee.id,
    ...computed,
    notes: parsed.data.notes,
  };
  db.payrollEntries.set(entry.id, entry);
  const updatedRun = recalculateRunTotals(run.id);
  audit('payroll_entry', entry.id, 'create', req.header('x-employee-id') || 'hr', { ...entry, runTotals: updatedRun });
  return res.status(201).json(entry);
});

router.post('/runs/:id/approve', requireRole(['manager']), (req, res) => {
  const run = db.payrollRuns.get(String(req.params.id));
  if (!run) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }
  const parsed = approvalSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = {
    ...run,
    status: 'approved' as const,
    approvedBy: parsed.data.approvedBy || req.header('x-employee-id') || 'manager',
  };
  db.payrollRuns.set(updated.id, updated);
  audit('payroll_run', updated.id, 'approve', updated.approvedBy, updated);
  return res.json(updated);
});

router.post('/runs/:id/lock', requireRole(['hr']), (req, res) => {
  const run = db.payrollRuns.get(String(req.params.id));
  if (!run) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }
  if (run.status !== 'approved') {
    return res.status(400).json({ error: 'Payroll run must be approved before locking' });
  }
  const updated = {
    ...run,
    status: 'locked' as const,
    lockedAt: nowIso(),
  };
  db.payrollRuns.set(updated.id, updated);
  audit('payroll_run', updated.id, 'lock', req.header('x-employee-id') || 'hr', updated);
  return res.json(updated);
});

router.get('/runs/:id/export', requireRole(['hr', 'manager']), (req, res) => {
  const run = db.payrollRuns.get(String(req.params.id));
  if (!run) {
    return res.status(404).json({ error: 'Payroll run not found' });
  }
  const entries = [...db.payrollEntries.values()].filter((entry) => entry.runId === run.id);
  const csv = generatePayrollCSV(run, entries, [...db.payrollEmployees.values()]);
  res.header('content-type', 'text/csv');
  res.header('content-disposition', `attachment; filename="${run.id}.csv"`);
  return res.send(csv);
});

router.post('/salary-adjustments', requireRole(['hr']), (req, res) => {
  const parsed = salaryAdjustmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const employee = db.payrollEmployees.get(parsed.data.employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Payroll employee not found' });
  }
  const adjustment = {
    id: id('salary_adj'),
    employeeId: employee.id,
    oldSalary: parsed.data.oldSalary ?? employee.baseSalary,
    newSalary: parsed.data.newSalary,
    effectiveDate: parsed.data.effectiveDate,
    reason: parsed.data.reason,
    status: 'pending' as const,
  };
  db.salaryAdjustments.set(adjustment.id, adjustment);
  audit('salary_adjustment', adjustment.id, 'create', req.header('x-employee-id') || 'hr', adjustment);
  return res.status(201).json(adjustment);
});

router.post('/salary-adjustments/:id/approve', requireRole(['manager']), (req, res) => {
  const adjustment = db.salaryAdjustments.get(String(req.params.id));
  if (!adjustment) {
    return res.status(404).json({ error: 'Salary adjustment not found' });
  }
  const parsed = approvalSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const employee = db.payrollEmployees.get(adjustment.employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Payroll employee not found' });
  }
  const approvedBy = parsed.data.approvedBy || req.header('x-employee-id') || 'manager';
  const updatedAdjustment = { ...adjustment, approvedBy, status: 'approved' as const };
  db.salaryAdjustments.set(updatedAdjustment.id, updatedAdjustment);
  const updatedEmployee = { ...employee, baseSalary: updatedAdjustment.newSalary };
  db.payrollEmployees.set(updatedEmployee.id, updatedEmployee);
  audit('salary_adjustment', updatedAdjustment.id, 'approve', approvedBy, updatedAdjustment);
  audit('payroll_employee', updatedEmployee.id, 'salary_update', approvedBy, updatedEmployee);
  return res.json(updatedAdjustment);
});

router.get('/summary', requireRole(['hr', 'manager']), (_req, res) => {
  const employees = [...db.payrollEmployees.values()];
  const runs = [...db.payrollRuns.values()];
  const entries = [...db.payrollEntries.values()];
  const adjustments = [...db.salaryAdjustments.values()];
  const currentMonth = nowIso().slice(0, 7);
  const currentMonthRuns = runs.filter((run) => run.periodStart.slice(0, 7) === currentMonth || run.periodEnd.slice(0, 7) === currentMonth);

  return res.json({
    employees: employees.length,
    runs: {
      total: runs.length,
      draft: runs.filter((run) => run.status === 'draft').length,
      approved: runs.filter((run) => run.status === 'approved').length,
      locked: runs.filter((run) => run.status === 'locked').length,
      paid: runs.filter((run) => run.status === 'paid').length,
    },
    totals: {
      gross: round(entries.reduce((sum, entry) => sum + entry.grossPay, 0)),
      net: round(entries.reduce((sum, entry) => sum + entry.netPay, 0)),
      tax: round(entries.reduce((sum, entry) => sum + entry.taxWithheld, 0)),
      superContribution: round(entries.reduce((sum, entry) => sum + entry.superContribution, 0)),
    },
    currentMonth: {
      period: currentMonth,
      gross: round(currentMonthRuns.reduce((sum, run) => sum + run.totalGross, 0)),
      net: round(currentMonthRuns.reduce((sum, run) => sum + run.totalNet, 0)),
      tax: round(currentMonthRuns.reduce((sum, run) => sum + run.totalTax, 0)),
    },
    adjustments: {
      pending: adjustments.filter((adjustment) => adjustment.status === 'pending').length,
      approved: adjustments.filter((adjustment) => adjustment.status === 'approved').length,
    },
  });
});

router.get('/audit-logs', requireRole(['hr']), (_req, res) => {
  return res.json([...db.payrollAudits.values()]);
});

export default router;
