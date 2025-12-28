import { Router } from "express";
import { initAuth } from "../controllers/authController";

const router = Router();

// Simple health check endpoint for uptime/load balancers.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mediqr-server" });
});

// Auth endpoints
router.post("/auth/init", initAuth);

export default router;
