const modules = [
  {
    name: "Employee Management",
    summary: "Profiles, personal records, and employee documents."
  },
  {
    name: "Recruitment",
    summary: "Job postings, applicants, and interview scheduling."
  },
  {
    name: "Payroll & Compensation",
    summary: "Salary administration, benefits, and pay stubs."
  },
  {
    name: "Time & Attendance",
    summary: "Time tracking, attendance logs, and leave management."
  },
  {
    name: "Performance Management",
    summary: "Goals, reviews, and continuous feedback."
  },
  {
    name: "Reports & Analytics",
    summary: "Operational dashboards and HR reporting."
  }
];

const databases = ["PostgreSQL", "MySQL", "MongoDB"];

export default function App() {
  return (
    <main className="layout">
      <section className="hero">
        <span className="eyebrow">HR Staff Workspace</span>
        <h1>HR management system foundation</h1>
        <p>
          A scalable starting point for a multi-domain HR platform with a typed
          React frontend, Express API backend, and support for multiple
          databases.
        </p>
      </section>

      <section>
        <h2>Supported databases</h2>
        <div className="badges">
          {databases.map((database) => (
            <span className="badge" key={database}>
              {database}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Scaffolded modules</h2>
        <div className="grid">
          {modules.map((module) => (
            <article className="card" key={module.name}>
              <h3>{module.name}</h3>
              <p>{module.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Next implementation steps</h2>
        <ul className="steps">
          <li>Connect a selected database backend through the API config.</li>
          <li>Expand each domain module with controllers, services, and data access.</li>
          <li>Introduce authentication and role-based permissions for HR staff.</li>
        </ul>
      </section>
    </main>
  );
}
