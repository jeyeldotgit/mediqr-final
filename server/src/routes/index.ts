import { Router } from "express";

const router = Router();

// Simple health check endpoint for uptime/load balancers.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mediqr-server" });
});

export default router;
