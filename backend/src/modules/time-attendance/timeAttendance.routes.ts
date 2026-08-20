import { Router } from "express";
import { featureCatalog } from "../catalog.js";

export const timeAttendanceRouter = Router();

timeAttendanceRouter.get("/", (_request, response) => {
  response.json({
    status: "scaffolded",
    module: featureCatalog.find((feature) => feature.slug === "time-attendance")
  });
});
