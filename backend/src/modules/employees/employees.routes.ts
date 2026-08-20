import { Router } from "express";
import { featureCatalog } from "../catalog.js";

export const employeesRouter = Router();

employeesRouter.get("/", (_request, response) => {
  response.json({
    status: "scaffolded",
    module: featureCatalog.find((feature) => feature.slug === "employees")
  });
});
