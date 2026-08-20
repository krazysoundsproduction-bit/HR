import { LeaveBalance, LeavePolicy } from '../types.js';

export interface LeaveCalculationInput {
  yearsOfService: number;
  contractType: string;
  policies: LeavePolicy[];
  carryover: number;
  used: number;
  pending: number;
}

export const calculateLeaveBalance = ({
  yearsOfService,
  contractType,
  policies,
  carryover,
  used,
  pending,
}: LeaveCalculationInput): Pick<LeaveBalance, 'annualLeave' | 'sickLeave' | 'specialLeave' | 'remaining'> => {
  const contractPolicies = policies.filter((policy) => policy.contractType === contractType);
  const annualBase = contractPolicies
    .filter((p) => p.leaveType === 'annual')
    .reduce((sum, p) => sum + p.daysPerYear, 0);
  const sickBase = contractPolicies
    .filter((p) => p.leaveType === 'sick')
    .reduce((sum, p) => sum + p.daysPerYear, 0);
  const specialBase = contractPolicies
    .filter((p) => p.leaveType === 'special')
    .reduce((sum, p) => sum + p.daysPerYear, 0);

  const serviceBonus = Math.floor(yearsOfService / 5);
  const annualLeave = annualBase + serviceBonus;
  const sickLeave = sickBase;
  const specialLeave = specialBase;
  const total = annualLeave + sickLeave + specialLeave + carryover;
  const remaining = Math.max(0, total - used - pending);

  return { annualLeave, sickLeave, specialLeave, remaining };
};
