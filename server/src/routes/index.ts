import { Router } from "express";
import { initAuth } from "../controllers/authController";
import { syncVault, getVaultItems } from "../controllers/vaultController";
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

// QR token endpoints
router.post("/qr/rotate", rotateQRToken);

// Staff endpoints
router.post("/staff/auth", staffAuth);

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

export default router;
