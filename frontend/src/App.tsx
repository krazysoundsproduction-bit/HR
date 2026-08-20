import { useMemo, useState } from 'react';
import './App.css';

const modules = [
  {
    key: 'employment',
    name: 'Employment Tracker',
    summary: 'Contracts, leave balances, approvals, renewals, and workforce compliance.',
    kpis: [
      { label: 'Active Contracts', value: '128' },
      { label: 'Leave Requests', value: '14 pending' },
      { label: 'Renewals Due', value: '9 in 30 days' },
    ],
  },
  {
    key: 'payroll',
    name: 'Payroll & Compensation',
    summary: 'Payroll runs, salary changes, deductions, and export workflows.',
    kpis: [
      { label: 'Current Cycle', value: 'Aug 2026' },
      { label: 'Runs Locked', value: '3' },
      { label: 'Pending Adjustments', value: '6' },
    ],
  },
  {
    key: 'time',
    name: 'Time & Attendance',
    summary: 'Clock events, timesheets, holiday calendars, and shift coverage.',
    kpis: [
      { label: 'Attendance Rate', value: '96.2%' },
      { label: 'Open Timesheets', value: '22' },
      { label: 'Late Arrivals', value: '4 today' },
    ],
  },
  {
    key: 'recruitment',
    name: 'Recruitment',
    summary: 'Jobs, applicants, interviews, offers, and pipeline health.',
    kpis: [
      { label: 'Open Roles', value: '18' },
      { label: 'Interviews', value: '12 scheduled' },
      { label: 'Offer Accept Rate', value: '71%' },
    ],
  },
  {
    key: 'performance',
    name: 'Performance Management',
    summary: 'Review cycles, goals, feedback, and development plans.',
    kpis: [
      { label: 'Active Cycle', value: 'Q3 2026' },
      { label: 'Reviews Submitted', value: '84%' },
      { label: 'Goals On Track', value: '73%' },
    ],
  },
  {
    key: 'reports',
    name: 'Reports & Analytics',
    summary: 'Executive reporting across headcount, payroll, leave, performance, and turnover.',
    kpis: [
      { label: 'Dashboards', value: '8' },
      { label: 'Trend Alerts', value: '3' },
      { label: 'Export Ready', value: 'Daily' },
    ],
  },
] as const;

const moduleDescriptions: Record<string, { title: string; bullets: string[] }> = {
  employment: {
    title: 'Employment Tracker Dashboard',
    bullets: [
      'Monitor contracts, leave balances, and renewals from a single HR workspace.',
      'Review compliance reminders and upcoming expiry windows in one glance.',
      'Use this landing view as the operational default for HR coordinators.',
    ],
  },
  payroll: {
    title: 'Payroll & Compensation Placeholder',
    bullets: [
      'Add payroll run controls, employee compensation profiles, and CSV exports here.',
      'Surface salary adjustments, gross/net totals, and approval queue widgets.',
      'Reserve this area for upcoming pay-cycle analytics panels.',
    ],
  },
  time: {
    title: 'Time & Attendance Placeholder',
    bullets: [
      'Display clock activity, timesheet approvals, shift coverage, and holiday planning.',
      'Highlight attendance exceptions, overtime, and late-arrival trends.',
      'Prepare this module for supervisor-focused operational views.',
    ],
  },
  recruitment: {
    title: 'Recruitment Placeholder',
    bullets: [
      'Introduce vacancy management, applicant pipeline tracking, and interview boards.',
      'Feature offer acceptance trends and hiring velocity summaries.',
      'This section is ready for ATS-style candidate workflows.',
    ],
  },
  performance: {
    title: 'Performance Management Placeholder',
    bullets: [
      'Present review cycles, goals, 360 feedback, and development plan actions.',
      'Track acknowledgements, rating distribution, and manager completion rates.',
      'Use this as the foundation for coaching and growth dashboards.',
    ],
  },
  reports: {
    title: 'Reports & Analytics Placeholder',
    bullets: [
      'Combine KPI cards, funnel charts, leave utilization, and turnover snapshots.',
      'Expose saved dashboards and scheduled exports for HR leadership.',
      'Keep this section focused on cross-module decision support.',
    ],
  },
};

export default function App() {
  const [activeModule, setActiveModule] = useState<(typeof modules)[number]['key']>('employment');
  const currentModule = useMemo(
    () => modules.find((module) => module.key === activeModule) ?? modules[0],
    [activeModule],
  );
  const currentContent = moduleDescriptions[activeModule];

  return (
    <main className="layout">
      <section className="hero">
        <div>
          <span className="eyebrow">HR Staff Workspace</span>
          <h1>HR Management System</h1>
          <p>
            Unified control center for employment, payroll, attendance, recruitment, performance,
            and reporting operations.
          </p>
        </div>
        <div className="hero-panel">
          <strong>Today&apos;s Focus</strong>
          <span>Employment Tracker remains the default landing dashboard for daily HR operations.</span>
        </div>
      </section>

      <nav className="tabs" aria-label="HR module navigation">
        {modules.map((module) => (
          <button
            key={module.key}
            type="button"
            className={module.key === activeModule ? 'tab active' : 'tab'}
            onClick={() => setActiveModule(module.key)}
          >
            {module.name}
          </button>
        ))}
      </nav>

      <section className="dashboard-shell">
        <header className="section-header">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h2>{currentContent.title}</h2>
          </div>
          <p>{currentModule.summary}</p>
        </header>

        <div className="kpi-grid">
          {currentModule.kpis.map((kpi) => (
            <article className="card metric-card" key={kpi.label}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
            </article>
          ))}
        </div>

        <div className="content-grid">
          <article className="card spotlight-card">
            <h3>Operational Summary</h3>
            <ul>
              {currentContent.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="card spotlight-card">
            <h3>Module Navigation</h3>
            <div className="module-list">
              {modules.map((module) => (
                <div className="module-row" key={module.key}>
                  <div>
                    <strong>{module.name}</strong>
                    <p>{module.summary}</p>
                  </div>
                  <span>{module.key === activeModule ? 'Active' : 'Available'}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
