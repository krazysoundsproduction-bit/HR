import { Router } from "express";
import { featureCatalog } from "../catalog.js";

export const reportsRouter = Router();

reportsRouter.get("/", (_request, response) => {
  response.json({
    status: "scaffolded",
    module: featureCatalog.find((feature) => feature.slug === "reports")
  });
});
