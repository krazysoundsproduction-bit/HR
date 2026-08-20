import { Router } from "express";
import { featureCatalog } from "../catalog.js";

export const recruitmentRouter = Router();

recruitmentRouter.get("/", (_request, response) => {
  response.json({
    status: "scaffolded",
    module: featureCatalog.find((feature) => feature.slug === "recruitment")
  });
});
