import express from "express";
import { swaggerUi, specs } from "../config/swagger.js";

const router = express.Router();

router.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Music API Documentation",
  })
);

export default router;
