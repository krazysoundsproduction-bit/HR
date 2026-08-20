import { Employee, PayrollEntry, PayrollRun } from '../types/payroll.js';

const PERIODS_PER_YEAR = 12;
const STANDARD_HOURS_PER_YEAR = 2080;
const DEFAULT_TAX_RATE = 0.3;
const DEFAULT_SUPER_RATE = 0.084;
const EMPLOYEE_SUPER_DEDUCTION_RATE = 0.06;

const round = (value: number) => Number(value.toFixed(2));

export function calculatePayrollEntry(
  employee: Employee,
  hoursWorked = 0,
  overtimeHours = 0,
  extraDeductions = 0,
) {
  const hourlyRate = employee.salaryType === 'hourly'
    ? employee.baseSalary
    : employee.baseSalary / STANDARD_HOURS_PER_YEAR;
  const basePay = employee.salaryType === 'hourly'
    ? hourlyRate * hoursWorked
    : employee.baseSalary / PERIODS_PER_YEAR;
  const overtimePay = overtimeHours > 0 ? hourlyRate * 1.5 * overtimeHours : 0;
  const allowances = employee.allowances;
  const grossPay = basePay + allowances + overtimePay;
  const taxRate = employee.taxRate || DEFAULT_TAX_RATE;
  const taxWithheld = grossPay * taxRate;
  const superContribution = grossPay * (employee.superRate || DEFAULT_SUPER_RATE);
  const employeeSuperDeduction = grossPay * EMPLOYEE_SUPER_DEDUCTION_RATE;
  const deductions = extraDeductions + employeeSuperDeduction;
  const netPay = grossPay - taxWithheld - deductions;

  return {
    grossPay: round(grossPay),
    basePay: round(basePay),
    allowances: round(allowances),
    overtimePay: round(overtimePay),
    deductions: round(deductions),
    taxWithheld: round(taxWithheld),
    superContribution: round(superContribution),
    netPay: round(netPay),
  };
}

const csvEscape = (value: string | number | undefined) => {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export function generatePayrollCSV(
  run: PayrollRun,
  entries: PayrollEntry[],
  employees: Employee[],
) {
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const rows = [
    [
      'run_id',
      'period_start',
      'period_end',
      'employee_id',
      'employee_name',
      'department',
      'gross_pay',
      'base_pay',
      'allowances',
      'overtime_pay',
      'deductions',
      'tax_withheld',
      'super_contribution',
      'net_pay',
      'notes',
    ].join(','),
  ];

  for (const entry of entries) {
    const employee = employeeById.get(entry.employeeId);
    rows.push([
      csvEscape(run.id),
      csvEscape(run.periodStart),
      csvEscape(run.periodEnd),
      csvEscape(entry.employeeId),
      csvEscape(employee?.name),
      csvEscape(employee?.department),
      csvEscape(entry.grossPay),
      csvEscape(entry.basePay),
      csvEscape(entry.allowances),
      csvEscape(entry.overtimePay),
      csvEscape(entry.deductions),
      csvEscape(entry.taxWithheld),
      csvEscape(entry.superContribution),
      csvEscape(entry.netPay),
      csvEscape(entry.notes),
    ].join(','));
  }

  return rows.join('\n');
}
