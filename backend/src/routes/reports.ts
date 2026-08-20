import { Router } from 'express';
import { db, id, nowIso } from '../data/store.js';
import { requireRole } from './middleware.js';

const router = Router();

const audit = (entity: string, entityId: string, action: string, changedBy: string, payload: Record<string, unknown>) => {
  const event = {
    id: id('report_audit'),
    entity,
    entityId,
    action,
    changedBy,
    changedAt: nowIso(),
    payload,
  };
  db.reportAudits.set(event.id, event);
  db.auditLogs.set(event.id, event);
};

const contractExpiry = () => {
  const now = new Date();
  const windows = [30, 60, 90];
  return windows.map((days) => {
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + days);
    const count = [...db.contracts.values()].filter((contract) => {
      const endDate = new Date(contract.endDate);
      return endDate >= now && endDate <= threshold;
    }).length;
    return { days, count };
  });
};

const headcountByDepartment = () => {
  const grouped = [...db.payrollEmployees.values()].reduce<Record<string, number>>((acc, employee) => {
    acc[employee.department] = (acc[employee.department] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([department, headcount]) => ({ department, headcount }));
};

const payrollSummary = () => {
  return [...db.payrollRuns.values()]
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
    .map((run) => ({
      runId: run.id,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      status: run.status,
      totalGross: run.totalGross,
      totalNet: run.totalNet,
      totalTax: run.totalTax,
    }));
};

const leaveUtilization = () => {
  return [...db.leaveBalances.values()].map((balance) => {
    const entitlement = balance.annualLeave + balance.sickLeave + balance.specialLeave + balance.carryover;
    const utilizationRate = entitlement > 0 ? Number(((balance.used / entitlement) * 100).toFixed(2)) : 0;
    return {
      employeeId: balance.employeeId,
      entitlement,
      used: balance.used,
      pending: balance.pending,
      remaining: balance.remaining,
      utilizationRate,
    };
  });
};

const attendanceRates = () => {
  return [...db.attendanceSummaries.values()].map((summary) => ({
    employeeId: summary.employeeId,
    month: summary.month,
    year: summary.year,
    attendanceRate: summary.totalDays > 0 ? Number(((summary.presentDays / summary.totalDays) * 100).toFixed(2)) : 0,
    lateDays: summary.lateDays,
    overtimeHours: summary.overtimeHours,
  }));
};

const recruitmentFunnel = () => {
  const applicants = [...db.applicants.values()];
  const total = applicants.length || 1;
  const count = (status: string) => applicants.filter((applicant) => applicant.status === status).length;
  return {
    applied: applicants.length,
    screening: count('screening'),
    interview: count('interview'),
    offer: count('offer'),
    hired: count('hired'),
    rejected: count('rejected'),
    conversionRates: {
      screening: Number(((count('screening') / total) * 100).toFixed(2)),
      interview: Number(((count('interview') / total) * 100).toFixed(2)),
      offer: Number(((count('offer') / total) * 100).toFixed(2)),
      hired: Number(((count('hired') / total) * 100).toFixed(2)),
    },
  };
};

const performanceRatings = () => {
  const distribution = [...db.performanceReviews.values()].reduce<Record<string, number>>((acc, review) => {
    const key = String(review.overallRating ?? 'unrated');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(distribution).map(([rating, count]) => ({ rating, count }));
};

const turnover = () => {
  const histories = [...db.employmentHistory.values()];
  const hires = histories.filter((event) => event.eventType.includes('contract_created') || event.eventType.includes('contract_imported')).length;
  const terminations = [...db.contracts.values()].filter((contract) => contract.status === 'terminated').length;
  const employeeBase = db.payrollEmployees.size || 1;
  return {
    hires,
    terminations,
    hireRate: Number(((hires / employeeBase) * 100).toFixed(2)),
    turnoverRate: Number(((terminations / employeeBase) * 100).toFixed(2)),
  };
};

router.use(requireRole(['hr', 'manager']));

router.get('/headcount', (req, res) => {
  const data = headcountByDepartment();
  audit('report', 'headcount', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/payroll-summary', (req, res) => {
  const data = payrollSummary();
  audit('report', 'payroll-summary', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/leave-utilization', (req, res) => {
  const data = leaveUtilization();
  audit('report', 'leave-utilization', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/attendance-rates', (req, res) => {
  const data = attendanceRates();
  audit('report', 'attendance-rates', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/recruitment-funnel', (req, res) => {
  const data = recruitmentFunnel();
  audit('report', 'recruitment-funnel', 'view', req.header('x-employee-id') || 'manager', data);
  return res.json(data);
});

router.get('/performance-ratings', (req, res) => {
  const data = performanceRatings();
  audit('report', 'performance-ratings', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/contract-expiry', (req, res) => {
  const data = contractExpiry();
  audit('report', 'contract-expiry', 'view', req.header('x-employee-id') || 'manager', { records: data.length });
  return res.json(data);
});

router.get('/turnover', (req, res) => {
  const data = turnover();
  audit('report', 'turnover', 'view', req.header('x-employee-id') || 'manager', data);
  return res.json(data);
});

router.get('/dashboard', (req, res) => {
  const data = {
    headcount: headcountByDepartment(),
    payroll: payrollSummary().slice(0, 5),
    leaveUtilization: leaveUtilization().slice(0, 5),
    attendance: attendanceRates().slice(0, 5),
    recruitment: recruitmentFunnel(),
    performance: performanceRatings(),
    contractExpiry: contractExpiry(),
    turnover: turnover(),
  };
  audit('report', 'dashboard', 'view', req.header('x-employee-id') || 'manager', { sections: Object.keys(data) });
  return res.json(data);
});

export default router;
