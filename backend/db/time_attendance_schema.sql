CREATE TABLE time_entries (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  work_date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  notes TEXT,
  approved_by TEXT
);

CREATE TABLE timesheets (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  submitted_at TIMESTAMP,
  approved_by TEXT
);

CREATE TABLE timesheet_entries (
  timesheet_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  PRIMARY KEY (timesheet_id, entry_id),
  FOREIGN KEY (timesheet_id) REFERENCES timesheets(id),
  FOREIGN KEY (entry_id) REFERENCES time_entries(id)
);

CREATE TABLE holiday_calendar (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  type TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE shift_schedules (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  shift_type TEXT NOT NULL
);

CREATE TABLE attendance_summaries (
  employee_id TEXT NOT NULL,
  summary_month INTEGER NOT NULL,
  summary_year INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  present_days INTEGER NOT NULL,
  absent_days INTEGER NOT NULL,
  late_days INTEGER NOT NULL,
  total_hours NUMERIC NOT NULL,
  overtime_hours NUMERIC NOT NULL,
  PRIMARY KEY (employee_id, summary_month, summary_year)
);
