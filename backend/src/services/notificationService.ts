import { EmploymentContract } from '../types.js';

export const EXPIRY_REMINDER_WINDOWS = [30, 14, 7];

export interface ContractReminder {
  contractId: string;
  employeeId: string;
  daysToExpiry: number;
  subject: string;
  body: string;
}

const msPerDay = 24 * 60 * 60 * 1000;

export const buildContractExpiryReminders = (contracts: EmploymentContract[], today = new Date()): ContractReminder[] => {
  const now = new Date(today.toDateString()).getTime();
  return contracts
    .filter((contract) => contract.status === 'active')
    .flatMap((contract) => {
      const end = new Date(contract.endDate).getTime();
      const daysToExpiry = Math.ceil((end - now) / msPerDay);
      if (!EXPIRY_REMINDER_WINDOWS.includes(daysToExpiry)) {
        return [];
      }
      return [{
        contractId: contract.id,
        employeeId: contract.employeeId,
        daysToExpiry,
        subject: `Contract expiry reminder: ${daysToExpiry} days remaining`,
        body: `Contract ${contract.id} for employee ${contract.employeeId} expires in ${daysToExpiry} day(s).`,
      }];
    });
};

export const renderRenewalApprovalEmail = (contractId: string, renewalDate: string) => ({
  subject: `Contract renewal approval required: ${contractId}`,
  body: `Please review renewal scheduled for contract ${contractId} on ${renewalDate}.`,
});
