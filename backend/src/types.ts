export type ContractStatus = 'active' | 'renewed' | 'expired' | 'terminated';
export type LeaveType = 'annual' | 'sick' | 'special' | 'unpaid' | 'off_day';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface EmploymentContract {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  contractType: string;
  position: string;
  department: string;
  status: ContractStatus;
  renewalDates: string[];
  documentUrls: string[];
  version: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  annualLeave: number;
  sickLeave: number;
  specialLeave: number;
  offDays: number;
  carryover: number;
  used: number;
  pending: number;
  remaining: number;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveRequestStatus;
  approvedBy?: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeavePolicy {
  id: string;
  contractType: string;
  leaveType: LeaveType;
  daysPerYear: number;
  carryoverMax: number;
  accrualMethod: 'monthly' | 'yearly';
}

export interface ContractRenewal {
  id: string;
  contractId: string;
  renewalDate: string;
  newContractId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
}

export interface EmploymentHistory {
  id: string;
  employeeId: string;
  eventType: string;
  timestamp: string;
  details: string;
  changedBy: string;
}

export interface AuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changedBy: string;
  changedAt: string;
  payload: Record<string, unknown>;
}
