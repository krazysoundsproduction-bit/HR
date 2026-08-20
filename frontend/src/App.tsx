import './App.css'

type Contract = {
  id: string
  employeeId: string
  status: 'active' | 'renewed' | 'expired' | 'terminated'
  department: string
  endDate: string
}

type LeaveBalance = {
  employeeId: string
  annual: number
  sick: number
  special: number
  remaining: number
  pending: number
}

const contracts: Contract[] = [
  { id: 'C-001', employeeId: 'E-100', status: 'active', department: 'Engineering', endDate: '2026-09-15' },
  { id: 'C-002', employeeId: 'E-101', status: 'active', department: 'Finance', endDate: '2026-08-28' },
]

const balances: LeaveBalance[] = [
  { employeeId: 'E-100', annual: 24, sick: 10, special: 2, remaining: 15, pending: 3 },
  { employeeId: 'E-101', annual: 21, sick: 10, special: 1, remaining: 8, pending: 2 },
]

function App() {
  return (
    <main className="page">
      <header>
        <h1>Employment Tracker</h1>
        <p>Contracts, renewals, leave balances, approvals, and reports</p>
      </header>

      <section className="grid">
        <article className="card">
          <h2>Contract Management Dashboard</h2>
          <ul>
            {contracts.map((contract) => (
              <li key={contract.id}>
                {contract.id} · {contract.employeeId} · {contract.department} · {contract.status} · expires {contract.endDate}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Employee Contract Detail + History</h2>
          <p>Employee E-100: hired 2023-01-10, renewed 2024-01-10, probation completed.</p>
        </article>

        <article className="card">
          <h2>Leave Balance Cards</h2>
          {balances.map((balance) => (
            <p key={balance.employeeId}>
              {balance.employeeId}: remaining {balance.remaining} days (annual {balance.annual}, sick {balance.sick}, special {balance.special}, pending {balance.pending})
            </p>
          ))}
        </article>

        <article className="card">
          <h2>Leave Request Submission</h2>
          <form>
            <label>
              Employee ID
              <input placeholder="E-100" />
            </label>
            <label>
              Leave Type
              <select>
                <option>annual</option>
                <option>sick</option>
                <option>special</option>
                <option>unpaid</option>
                <option>off_day</option>
              </select>
            </label>
            <button type="button">Submit Request</button>
          </form>
        </article>

        <article className="card">
          <h2>Manager Approval Workflow</h2>
          <p>Pending approvals: 2 · Approve/Reject actions exposed via API endpoints.</p>
        </article>

        <article className="card">
          <h2>Contract Renewals & Upcoming Calendar</h2>
          <p>Auto reminders configured for 30, 14, and 7 days before expiry.</p>
        </article>

        <article className="card">
          <h2>Leave Usage Trend Chart</h2>
          <p>Monthly trend report endpoint: /api/employment-tracker/reports/leave-trends</p>
        </article>

        <article className="card">
          <h2>Reports & Filters</h2>
          <p>Contracts expiring, upcoming renewals, leave balances, tenure reports.</p>
        </article>

        <article className="card">
          <h2>Bulk Contract Import</h2>
          <p>CSV import endpoint: /api/employment-tracker/contracts/import</p>
        </article>

        <article className="card">
          <h2>Leave Policy Configuration</h2>
          <p>Policy management endpoint: /api/employment-tracker/leave-policies</p>
        </article>

        <article className="card">
          <h2>Employee Self-Service Portal</h2>
          <p>Employees can view personal contract summary and leave balances.</p>
        </article>
      </section>
    </main>
  )
}

export default App
