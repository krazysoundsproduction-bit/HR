import { Router } from 'express';

import { resolveDatabaseConfig, supportedDatabases } from '../config/database.js';
import { env } from '../config/env.js';
import { employeesRouter } from '../modules/employees/employees.routes.js';
import { featureCatalog } from '../modules/catalog.js';
import employmentTrackerRouter from './employmentTracker.js';
import payrollRouter from './payroll.js';
import performanceRouter from './performance.js';
import recruitmentRouter from './recruitment.js';
import reportsRouter from './reports.js';
import timeAttendanceRouter from './timeAttendance.js';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    name: 'HR Management API',
    audience: 'HR department staff',
    modules: featureCatalog.map(({ slug, name }) => ({ slug, name })),
    supportedDatabases,
  });
});

apiRouter.get('/health', (_request, response) => {
  const database = resolveDatabaseConfig(env);

  response.json({
    status: 'ok',
    environment: env.nodeEnv,
    database: {
      client: database.client,
      configured: Boolean(database.connectionUrl),
      message: database.healthLabel,
    },
  });
});

apiRouter.get('/modules', (_request, response) => {
  response.json(featureCatalog);
});

apiRouter.use('/employees', employeesRouter);
apiRouter.use('/employment-tracker', employmentTrackerRouter);
apiRouter.use('/recruitment', recruitmentRouter);
apiRouter.use('/payroll', payrollRouter);
apiRouter.use('/time-attendance', timeAttendanceRouter);
apiRouter.use('/performance', performanceRouter);
apiRouter.use('/reports', reportsRouter);
