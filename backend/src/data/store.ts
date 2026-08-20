import {
  AuditLog,
  ContractRenewal,
  EmploymentContract,
  EmploymentHistory,
  LeaveBalance,
  LeavePolicy,
  LeaveRequest,
} from '../types.js';

export const db = {
  contracts: new Map<string, EmploymentContract>(),
  leaveBalances: new Map<string, LeaveBalance>(),
  leaveRequests: new Map<string, LeaveRequest>(),
  leavePolicies: new Map<string, LeavePolicy>(),
  renewals: new Map<string, ContractRenewal>(),
  employmentHistory: new Map<string, EmploymentHistory>(),
  auditLogs: new Map<string, AuditLog>(),
};

export const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const nowIso = () => new Date().toISOString();
