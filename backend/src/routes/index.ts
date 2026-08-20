import { Router } from "express";

import { resolveDatabaseConfig, supportedDatabases } from "../config/database.js";
import { env } from "../config/env.js";
import { employeesRouter } from "../modules/employees/employees.routes.js";
import { featureCatalog } from "../modules/catalog.js";
import { payrollRouter } from "../modules/payroll/payroll.routes.js";
import { performanceRouter } from "../modules/performance/performance.routes.js";
import { recruitmentRouter } from "../modules/recruitment/recruitment.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { timeAttendanceRouter } from "../modules/time-attendance/timeAttendance.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
  response.json({
    name: "HR Management API",
    audience: "HR department staff",
    modules: featureCatalog.map(({ slug, name }) => ({ slug, name })),
    supportedDatabases
  });
});

apiRouter.get("/health", (_request, response) => {
  const database = resolveDatabaseConfig(env);

  response.json({
    status: "ok",
    environment: env.nodeEnv,
    database: {
      client: database.client,
      configured: Boolean(database.connectionUrl),
      message: database.healthLabel
    }
  });
});

apiRouter.get("/modules", (_request, response) => {
  response.json(featureCatalog);
});

apiRouter.use("/employees", employeesRouter);
apiRouter.use("/recruitment", recruitmentRouter);
apiRouter.use("/payroll", payrollRouter);
apiRouter.use("/time-attendance", timeAttendanceRouter);
apiRouter.use("/performance", performanceRouter);
apiRouter.use("/reports", reportsRouter);
