import './App.css'

const modules = [
  { name: 'Employment Tracker', summary: 'Contracts, leave lifecycle, renewals, and reporting.' },
  { name: 'Employee Management', summary: 'Profiles, personal records, and employee documents.' },
  { name: 'Recruitment', summary: 'Job postings, applicants, and interview scheduling.' },
  { name: 'Payroll & Compensation', summary: 'Salary administration, benefits, and pay stubs.' },
  { name: 'Time & Attendance', summary: 'Time tracking, attendance logs, and leave management.' },
  { name: 'Performance Management', summary: 'Goals, reviews, and continuous feedback.' },
  { name: 'Reports & Analytics', summary: 'Operational dashboards and HR reporting.' },
]

export default function App() {
  return (
    <main className="layout">
      <section className="hero">
        <span className="eyebrow">HR Staff Workspace</span>
        <h1>HR Management System</h1>
        <p>Comprehensive HR platform with employment tracking, payroll, recruitment, and analytics.</p>
      </section>
      <section>
        <h2>Modules</h2>
        <div className="grid">
          {modules.map((module) => (
            <article className="card" key={module.name}>
              <h3>{module.name}</h3>
              <p>{module.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
