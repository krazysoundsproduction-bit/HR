import { Router } from 'express';
import { z } from 'zod';
import { db, id, nowIso } from '../data/store.js';
import { requireRole } from './middleware.js';

const router = Router();

const timeEntrySchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  breakMinutes: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  entryId: z.string().optional(),
}).refine((payload) => payload.clockIn || payload.clockOut || payload.entryId, {
  message: 'clockIn, clockOut, or entryId is required',
});

const timeEntryApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']).default('approved'),
  approvedBy: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const timesheetSchema = z.object({
  employeeId: z.string().min(1),
  weekStart: z.string().min(1),
  weekEnd: z.string().min(1),
  entries: z.array(z.string()).default([]),
});

const timesheetApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected']).default('approved'),
  approvedBy: z.string().min(1).optional(),
});

const holidaySchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  type: z.enum(['public', 'company']),
  country: z.string().min(1),
});

const scheduleSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  shiftStart: z.string().min(1),
  shiftEnd: z.string().min(1),
  shiftType: z.enum(['regular', 'overtime', 'weekend']),
});

const goalPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const round = (value: number) => Number(value.toFixed(2));
const getSearchParam = (url: string, key: string) => {
  const value = new URL(url, 'http://localhost').searchParams.get(key);
  return value ?? undefined;
};

const getSearchNumber = (url: string, key: string, fallback: number) => {
  const value = getSearchParam(url, key);
  return value ? Number(value) : fallback;
};

const paginate = <T,>(items: T[], url: string) => {
  const { limit, offset } = goalPaginationSchema.parse({
    limit: getSearchParam(url, 'limit'),
    offset: getSearchParam(url, 'offset'),
  });
  return {
    total: items.length,
    limit,
    offset,
    items: items.slice(offset, offset + limit),
  };
};

const hoursBetween = (date: string, start?: string, end?: string, breakMinutes = 0) => {
  if (!start || !end) {
    return 0;
  }
  const startTime = new Date(`${date}T${start}`);
  const endTime = new Date(`${date}T${end}`);
  const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  return round(Math.max(0, diff - breakMinutes / 60));
};

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('time_audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.timeAttendanceAudits.set(event.id, event);
  db.auditLogs.set(event.id, event);
};

const buildAttendanceSummary = (employeeId: string, month: number, year: number) => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const entries = [...db.timeEntries.values()].filter(
    (entry) => entry.employeeId === employeeId && entry.date.startsWith(monthKey),
  );
  const schedules = [...db.shiftSchedules.values()].filter(
    (schedule) => schedule.employeeId === employeeId && schedule.date.startsWith(monthKey),
  );
  const trackedDates = new Set([...entries.map((entry) => entry.date), ...schedules.map((schedule) => schedule.date)]);
  const presentDays = entries.filter((entry) => entry.hoursWorked > 0).length;
  const totalDays = trackedDates.size;
  const totalHours = round(entries.reduce((sum, entry) => sum + entry.hoursWorked, 0));
  const overtimeHours = round(entries.reduce((sum, entry) => sum + Math.max(0, entry.hoursWorked - 8), 0));
  const lateDays = entries.filter((entry) => {
    const schedule = schedules.find((item) => item.date === entry.date);
    const threshold = schedule?.shiftStart ?? '09:00';
    return Boolean(entry.clockIn && entry.clockIn > threshold);
  }).length;
  const summary = {
    employeeId,
    month,
    year,
    totalDays,
    presentDays,
    absentDays: Math.max(0, totalDays - presentDays),
    lateDays,
    totalHours,
    overtimeHours,
  };
  db.attendanceSummaries.set(`${employeeId}:${monthKey}`, summary);
  return summary;
};

router.post('/entries', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const parsed = timeEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const requestedEntry = parsed.data.entryId ? db.timeEntries.get(parsed.data.entryId) : undefined;
  const openEntry = requestedEntry ?? [...db.timeEntries.values()].find(
    (entry) => entry.employeeId === parsed.data.employeeId && entry.date === parsed.data.date && !entry.clockOut,
  );

  if (openEntry && parsed.data.clockOut) {
    const updated = {
      ...openEntry,
      clockOut: parsed.data.clockOut,
      breakMinutes: parsed.data.breakMinutes,
      notes: parsed.data.notes ?? openEntry.notes,
      hoursWorked: hoursBetween(openEntry.date, openEntry.clockIn, parsed.data.clockOut, parsed.data.breakMinutes),
    };
    db.timeEntries.set(updated.id, updated);
    buildAttendanceSummary(updated.employeeId, Number(updated.date.slice(5, 7)), Number(updated.date.slice(0, 4)));
    audit('time_entry', updated.id, 'clock_out', req.header('x-employee-id') || updated.employeeId, updated);
    return res.status(201).json(updated);
  }

  const entry = {
    id: id('time_entry'),
    employeeId: parsed.data.employeeId,
    date: parsed.data.date,
    clockIn: parsed.data.clockIn,
    clockOut: parsed.data.clockOut,
    hoursWorked: hoursBetween(parsed.data.date, parsed.data.clockIn, parsed.data.clockOut, parsed.data.breakMinutes),
    breakMinutes: parsed.data.breakMinutes,
    status: 'pending' as const,
    notes: parsed.data.notes,
  };
  db.timeEntries.set(entry.id, entry);
  buildAttendanceSummary(entry.employeeId, Number(entry.date.slice(5, 7)), Number(entry.date.slice(0, 4)));
  audit('time_entry', entry.id, 'create', req.header('x-employee-id') || entry.employeeId, entry);
  return res.status(201).json(entry);
});

router.get('/entries', requireRole(['hr', 'manager']), (req, res) => {
  const employeeId = getSearchParam(req.originalUrl, 'employeeId');
  const date = getSearchParam(req.originalUrl, 'date');
  const items = [...db.timeEntries.values()].filter((entry) => {
    if (employeeId && entry.employeeId !== employeeId) return false;
    if (date && entry.date !== date) return false;
    return true;
  });
  return res.json(paginate(items.sort((a, b) => b.date.localeCompare(a.date)), req.originalUrl));
});

router.get('/entries/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const entry = db.timeEntries.get(String(req.params.id));
  if (!entry) {
    return res.status(404).json({ error: 'Time entry not found' });
  }
  return res.json(entry);
});

router.patch('/entries/:id/approve', requireRole(['manager', 'hr']), (req, res) => {
  const entry = db.timeEntries.get(String(req.params.id));
  if (!entry) {
    return res.status(404).json({ error: 'Time entry not found' });
  }
  const parsed = timeEntryApprovalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = {
    ...entry,
    status: parsed.data.status,
    approvedBy: parsed.data.approvedBy || req.header('x-employee-id') || 'manager',
    notes: parsed.data.notes ?? entry.notes,
  };
  db.timeEntries.set(updated.id, updated);
  buildAttendanceSummary(updated.employeeId, Number(updated.date.slice(5, 7)), Number(updated.date.slice(0, 4)));
  audit('time_entry', updated.id, parsed.data.status, updated.approvedBy, updated);
  return res.json(updated);
});

router.post('/timesheets', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const parsed = timesheetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const totalHours = round(parsed.data.entries.reduce((sum, entryId) => sum + (db.timeEntries.get(entryId)?.hoursWorked ?? 0), 0));
  const timesheet = {
    id: id('timesheet'),
    employeeId: parsed.data.employeeId,
    weekStart: parsed.data.weekStart,
    weekEnd: parsed.data.weekEnd,
    entries: parsed.data.entries,
    totalHours,
    status: 'draft' as const,
  };
  db.timesheets.set(timesheet.id, timesheet);
  audit('timesheet', timesheet.id, 'create', req.header('x-employee-id') || timesheet.employeeId, timesheet);
  return res.status(201).json(timesheet);
});

router.get('/timesheets', requireRole(['hr', 'manager']), (req, res) => {
  const employeeId = getSearchParam(req.originalUrl, 'employeeId');
  const items = [...db.timesheets.values()].filter((timesheet) => !employeeId || timesheet.employeeId === employeeId);
  return res.json(paginate(items.sort((a, b) => b.weekStart.localeCompare(a.weekStart)), req.originalUrl));
});

router.get('/timesheets/:id', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const timesheet = db.timesheets.get(String(req.params.id));
  if (!timesheet) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  const entries = timesheet.entries
    .map((entryId) => db.timeEntries.get(entryId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  return res.json({ ...timesheet, entries });
});

router.post('/timesheets/:id/submit', requireRole(['employee', 'manager']), (req, res) => {
  const timesheet = db.timesheets.get(String(req.params.id));
  if (!timesheet) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  const updated = {
    ...timesheet,
    status: 'submitted' as const,
    submittedAt: nowIso(),
  };
  db.timesheets.set(updated.id, updated);
  audit('timesheet', updated.id, 'submit', req.header('x-employee-id') || updated.employeeId, updated);
  return res.json(updated);
});

router.post('/timesheets/:id/approve', requireRole(['manager', 'hr']), (req, res) => {
  const timesheet = db.timesheets.get(String(req.params.id));
  if (!timesheet) {
    return res.status(404).json({ error: 'Timesheet not found' });
  }
  const parsed = timesheetApprovalSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const updated = {
    ...timesheet,
    status: parsed.data.status,
    approvedBy: parsed.data.approvedBy || req.header('x-employee-id') || 'manager',
  };
  db.timesheets.set(updated.id, updated);
  audit('timesheet', updated.id, parsed.data.status, updated.approvedBy, updated);
  return res.json(updated);
});

router.get('/summary/:employeeId', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const month = getSearchNumber(req.originalUrl, 'month', new Date().getUTCMonth() + 1);
  const year = getSearchNumber(req.originalUrl, 'year', new Date().getUTCFullYear());
  if (Number.isNaN(month) || Number.isNaN(year)) {
    return res.status(400).json({ error: 'month and year must be numeric when provided' });
  }
  return res.json(buildAttendanceSummary(String(req.params.employeeId), month, year));
});

router.post('/holidays', requireRole(['hr']), (req, res) => {
  const parsed = holidaySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const holiday = { id: id('holiday'), ...parsed.data };
  db.holidays.set(holiday.id, holiday);
  audit('holiday', holiday.id, 'create', req.header('x-employee-id') || 'hr', holiday);
  return res.status(201).json(holiday);
});

router.get('/holidays', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const country = getSearchParam(req.originalUrl, 'country');
  const items = [...db.holidays.values()].filter((holiday) => !country || holiday.country === country);
  return res.json(paginate(items.sort((a, b) => a.date.localeCompare(b.date)), req.originalUrl));
});

router.post('/schedules', requireRole(['hr', 'manager']), (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }
  const schedule = { id: id('schedule'), ...parsed.data };
  db.shiftSchedules.set(schedule.id, schedule);
  buildAttendanceSummary(schedule.employeeId, Number(schedule.date.slice(5, 7)), Number(schedule.date.slice(0, 4)));
  audit('shift_schedule', schedule.id, 'create', req.header('x-employee-id') || 'manager', schedule);
  return res.status(201).json(schedule);
});

router.get('/schedules/:employeeId', requireRole(['hr', 'manager', 'employee']), (req, res) => {
  const items = [...db.shiftSchedules.values()].filter((schedule) => schedule.employeeId === String(req.params.employeeId));
  return res.json(paginate(items.sort((a, b) => a.date.localeCompare(b.date)), req.originalUrl));
});

router.get('/audit-logs', requireRole(['hr']), (_req, res) => {
  return res.json([...db.timeAttendanceAudits.values()]);
});

export default router;
