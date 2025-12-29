import { Router } from "express";
import { initAuth } from "../controllers/authController";
import {
  syncVault,
  getVaultItems,
  getVaultItemsForOffline,
} from "../controllers/vaultController";
import { rotateQRToken } from "../controllers/qrController";
import { staffAuth } from "../controllers/staffController";
import { recordAccess } from "../controllers/recordController";
import {
  createRecoveryShards,
  storeGuardianShard,
  getRecoveryShards,
  getShardById,
  deleteRecoveryShard,
} from "../controllers/recoveryController";
import { searchUsers } from "../controllers/guardianController";
import { breakGlass } from "../controllers/emergencyController";
import { rateLimiters } from "../middleware/rateLimiter";

const router = Router();

// Simple health check endpoint for uptime/load balancers.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "mediqr-server" });
});

// Auth endpoints (strict rate limiting)
router.post("/auth/init", rateLimiters.auth, initAuth);

// Vault endpoints (moderate rate limiting)
router.post("/vault/sync", rateLimiters.vault, syncVault);
router.get("/vault/:ownerId", rateLimiters.vault, getVaultItems);
router.get(
  "/vault/:ownerId/offline",
  rateLimiters.vault,
  getVaultItemsForOffline
);

// QR token endpoints (strict rate limiting)
router.post("/qr/rotate", rateLimiters.qrRotate, rotateQRToken);

// Staff endpoints (strict rate limiting for auth)
router.post("/staff/auth", rateLimiters.auth, staffAuth);

// Record access endpoints (requires staff authentication)
router.post("/record/access", recordAccess);

// Recovery & Social Recovery endpoints
router.post("/recovery/shards", createRecoveryShards);
router.get("/recovery/shards", getRecoveryShards);
router.get("/recovery/shards/:shardId", getShardById);
router.delete("/recovery/shards/:shardId", deleteRecoveryShard);
router.post("/social/shard", storeGuardianShard);

// Guardian endpoints
router.post("/guardians/search", searchUsers);

// Emergency endpoints (very strict rate limiting)
router.post("/emergency/break-glass", rateLimiters.emergency, breakGlass);

export default router;
