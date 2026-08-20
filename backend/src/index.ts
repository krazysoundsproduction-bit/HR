import express from 'express';
import employmentTrackerRouter from './routes/employmentTracker.js';
import payrollRouter from './routes/payroll.js';
import performanceRouter from './routes/performance.js';
import recruitmentRouter from './routes/recruitment.js';
import reportsRouter from './routes/reports.js';
import timeAttendanceRouter from './routes/timeAttendance.js';
import { db } from './data/store.js';
import { buildContractExpiryReminders } from './services/notificationService.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', module: 'hr-management-system' });
});

app.use('/api/employment-tracker', employmentTrackerRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/time-attendance', timeAttendanceRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/reports', reportsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: 'Internal server error', detail: err.message });
});

const runDailyExpiryCheck = () => buildContractExpiryReminders([...db.contracts.values()]);

if (process.env.ENABLE_DAILY_EXPIRY_CHECK === 'true') {
  setInterval(() => {
    runDailyExpiryCheck();
  }, 24 * 60 * 60 * 1000);
}

const port = Number(process.env.PORT ?? 3001);
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`HR Management API listening on port ${port}`);
  });
}

export { app, runDailyExpiryCheck };
