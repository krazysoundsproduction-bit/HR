import {
  AuditLog,
  ContractRenewal,
  EmploymentContract,
  EmploymentHistory,
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
} from '../types.js';
import { DevelopmentPlan, Feedback, Goal, PerformanceReview, ReviewCycle } from '../types/performance.js';
import { Employee, PayrollAudit, PayrollEntry, PayrollRun, SalaryAdjustment } from '../types/payroll.js';
import { Applicant, Interview, JobPosting, OfferLetter } from '../types/recruitment.js';
import { ReportConfig } from '../types/reports.js';
import { AttendanceSummary, HolidayCalendar, ShiftSchedule, TimeEntry, Timesheet } from '../types/timeAttendance.js';

export const db = {
  contracts: new Map<string, EmploymentContract>(),
  leaveBalances: new Map<string, LeaveBalance>(),
  leaveRequests: new Map<string, LeaveRequest>(),
  leavePolicies: new Map<string, LeavePolicy>(),
  renewals: new Map<string, ContractRenewal>(),
  employmentHistory: new Map<string, EmploymentHistory>(),
  auditLogs: new Map<string, AuditLog>(),
  payrollEmployees: new Map<string, Employee>(),
  payrollRuns: new Map<string, PayrollRun>(),
  payrollEntries: new Map<string, PayrollEntry>(),
  salaryAdjustments: new Map<string, SalaryAdjustment>(),
  payrollAudits: new Map<string, PayrollAudit>(),
  timeEntries: new Map<string, TimeEntry>(),
  timesheets: new Map<string, Timesheet>(),
  attendanceSummaries: new Map<string, AttendanceSummary>(),
  holidays: new Map<string, HolidayCalendar>(),
  shiftSchedules: new Map<string, ShiftSchedule>(),
  timeAttendanceAudits: new Map<string, AuditLog>(),
  jobPostings: new Map<string, JobPosting>(),
  applicants: new Map<string, Applicant>(),
  interviews: new Map<string, Interview>(),
  offerLetters: new Map<string, OfferLetter>(),
  recruitmentAudits: new Map<string, AuditLog>(),
  reviewCycles: new Map<string, ReviewCycle>(),
  performanceReviews: new Map<string, PerformanceReview>(),
  goals: new Map<string, Goal>(),
  feedbackEntries: new Map<string, Feedback>(),
  developmentPlans: new Map<string, DevelopmentPlan>(),
  performanceAudits: new Map<string, AuditLog>(),
  reportConfigs: new Map<string, ReportConfig>(),
  reportAudits: new Map<string, AuditLog>(),
};

export const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const nowIso = () => new Date().toISOString();
