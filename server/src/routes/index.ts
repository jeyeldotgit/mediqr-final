import { Router } from "express";
import { initAuth } from "../controllers/authController";
import { syncVault, getVaultItems } from "../controllers/vaultController";

const router = Router();

// Simple health check endpoint for uptime/load balancers.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mediqr-server" });
});

// Auth endpoints
router.post("/auth/init", initAuth);

// Vault endpoints
router.post("/vault/sync", syncVault);
router.get("/vault/:ownerId", getVaultItems);

export default router;
