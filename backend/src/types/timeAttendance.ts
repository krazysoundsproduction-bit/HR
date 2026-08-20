export type TimeEntryStatus = 'pending' | 'approved' | 'rejected';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type HolidayType = 'public' | 'company';
export type ShiftType = 'regular' | 'overtime' | 'weekend';

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked: number;
  breakMinutes: number;
  status: TimeEntryStatus;
  notes?: string;
  approvedBy?: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  entries: string[];
  totalHours: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedBy?: string;
}

export interface AttendanceSummary {
  employeeId: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
}

export interface HolidayCalendar {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  country: string;
}

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  shiftType: ShiftType;
}
