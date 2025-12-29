/**
 * Shard distribution utilities
 * Handles splitting MEK into shards and distributing them
 */

import { splitMEKIntoShards, reconstructMEKFromShards } from "./shamir";
import { storeLocalShard, getLocalShard } from "../storage";
import {
  createRecoveryShards,
  storeGuardianShard,
  getRecoveryShards,
  type RecoveryShard,
} from "../../services/recoveryService";
import { getUserId } from "../storage";

/**
 * Distribute shards: split MEK into 3 shards and store them
 * - Shard A: Local device (stored in localStorage as raw hex)
 * - Shard B: Guardian (stored in recovery_shards with guardian_id as raw hex)
 * - Shard C: Backup in Supabase (stored in recovery_shards with guardian_id = user_id as raw hex)
 *
 * Note: For Phase 4, we store shards as raw hex strings (not encrypted) to avoid
 * the chicken-and-egg problem. In production, shards should be encrypted with
 * guardian's public key or a separate recovery key.
 */
export async function distributeShards(
  masterKey: CryptoKey,
  guardianIds: string[] = []
): Promise<{
  localShard: string;
  guardianShards: Array<{ guardianId: string; shardId: string }>;
  backupShardId: string;
}> {
  // Split MEK into 3 shards
  const rawShards = await splitMEKIntoShards(masterKey);

  if (rawShards.length !== 3) {
    throw new Error("Expected 3 shards from SSS split");
  }

  // For Phase 4 MVP: Store shards as raw hex strings
  // In production, these should be encrypted with guardian's public key or recovery key
  // Format: "hex_shard" (not encrypted for now)

  // Shard A: Store locally (raw hex)
  const localShard = rawShards[0];
  storeLocalShard(localShard);

  const userId = getUserId();
  if (!userId) {
    throw new Error("User ID not found. Please complete onboarding first.");
  }

  // Shard B: Store with guardian (if provided) - raw hex
  const guardianShards: Array<{ guardianId: string; shardId: string }> = [];
  if (guardianIds.length > 0 && guardianIds[0]) {
    const result = await storeGuardianShard({
      guardianId: guardianIds[0],
      encryptedShard: rawShards[1], // Stored as "encrypted_shard" field but contains raw hex
    });
    guardianShards.push({
      guardianId: guardianIds[0],
      shardId: result.shardId,
    });
  }

  // Shard C: Store as backup in Supabase (guardian_id = user_id indicates backup) - raw hex
  const backupResult = await createRecoveryShards({
    shards: [
      {
        guardianId: userId, // Using userId as guardian_id indicates it's a backup shard
        encryptedShard: rawShards[2], // Stored as "encrypted_shard" field but contains raw hex
      },
    ],
  });

  const backupShardId = backupResult.shardIds[0];

  return {
    localShard,
    guardianShards,
    backupShardId,
  };
}

/**
 * Reconstruct MEK from available shards
 * Requires at least 2 of 3 shards
 *
 * For Phase 4: Shards are stored as raw hex strings, so no decryption needed
 */
export async function reconstructFromShards(
  shards: Array<{ shard: string; encrypted: boolean }>
): Promise<CryptoKey> {
  if (shards.length < 2) {
    throw new Error("At least 2 shards are required to reconstruct the key");
  }

  // Extract raw shard strings (for Phase 4, shards are stored as raw hex)
  const rawShards = shards.map((s) => {
    // If shard is in "encrypted:iv" format, extract the encrypted part
    // Otherwise, use the shard directly
    if (s.shard.includes(":")) {
      // This might be an old encrypted format - try to use the first part
      // In production, you'd decrypt this properly
      return s.shard.split(":")[0];
    }
    return s.shard;
  });

  // Reconstruct MEK from raw shards
  return reconstructMEKFromShards(rawShards);
}

/**
 * Collect shards from various sources for recovery
 */
export async function collectShardsForRecovery(): Promise<{
  localShard: string | null;
  guardianShards: RecoveryShard[];
  backupShard: RecoveryShard | null;
}> {
  // Get local shard
  const localShard = getLocalShard();

  // Get all shards from server
  const response = await getRecoveryShards();
  const userId = getUserId();

  // Separate guardian shards from backup shard
  const guardianShards: RecoveryShard[] = [];
  let backupShard: RecoveryShard | null = null;

  for (const shard of response.shards) {
    // Backup shard has guardian_id equal to user_id
    if (shard.guardianId === userId) {
      backupShard = shard;
    } else if (shard.guardianId) {
      guardianShards.push(shard);
    }
  }

  return {
    localShard,
    guardianShards,
    backupShard,
  };
}
