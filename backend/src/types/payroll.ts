export type SalaryType = 'hourly' | 'salary';
export type PayrollRunStatus = 'draft' | 'approved' | 'locked' | 'paid';
export type SalaryAdjustmentStatus = 'pending' | 'approved';

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  salaryType: SalaryType;
  baseSalary: number;
  allowances: number;
  taxRate: number;
  superRate: number;
}

export interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  createdBy: string;
  approvedBy?: string;
  lockedAt?: string;
  totalGross: number;
  totalNet: number;
  totalTax: number;
}

export interface PayrollEntry {
  id: string;
  runId: string;
  employeeId: string;
  grossPay: number;
  basePay: number;
  allowances: number;
  overtimePay: number;
  deductions: number;
  taxWithheld: number;
  superContribution: number;
  netPay: number;
  notes?: string;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  oldSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  approvedBy?: string;
  status: SalaryAdjustmentStatus;
}

export interface PayrollAudit {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  changedBy: string;
  changedAt: string;
  payload: Record<string, unknown>;
}
