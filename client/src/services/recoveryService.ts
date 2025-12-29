/**
 * Recovery service for managing social recovery shards
 */

import { apiRequest } from "./apiClient";

export interface RecoveryShard {
  id: string;
  userId: string;
  guardianId: string | null; // null for backup shard stored in Supabase
  encryptedShard: string;
  createdAt?: string;
}

export interface CreateShardsRequest {
  shards: Array<{
    guardianId: string | null; // null for backup shard
    encryptedShard: string;
  }>;
}

export interface CreateShardsResponse {
  success: boolean;
  shardIds: string[];
  message: string;
}

export interface GuardianShardRequest {
  guardianId: string;
  encryptedShard: string;
}

export interface GuardianShardResponse {
  success: boolean;
  shardId: string;
  message: string;
}

export interface GetShardsResponse {
  success: boolean;
  shards: RecoveryShard[];
}

/**
 * Create and store multiple recovery shards
 * POST /recovery/shards
 */
export async function createRecoveryShards(
  request: CreateShardsRequest
): Promise<CreateShardsResponse> {
  return apiRequest<CreateShardsResponse>("/recovery/shards", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Store a single guardian shard
 * POST /social/shard
 */
export async function storeGuardianShard(
  request: GuardianShardRequest
): Promise<GuardianShardResponse> {
  return apiRequest<GuardianShardResponse>("/social/shard", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get all recovery shards for the current user
 * GET /recovery/shards
 */
export async function getRecoveryShards(): Promise<GetShardsResponse> {
  return apiRequest<GetShardsResponse>("/recovery/shards", {
    method: "GET",
  });
}

/**
 * Get a specific shard by ID
 * GET /recovery/shards/:shardId
 */
export async function getShardById(shardId: string): Promise<RecoveryShard> {
  return apiRequest<RecoveryShard>(`/recovery/shards/${shardId}`, {
    method: "GET",
  });
}

/**
 * Delete a recovery shard
 * DELETE /recovery/shards/:shardId
 */
export async function deleteRecoveryShard(shardId: string): Promise<void> {
  return apiRequest<void>(`/recovery/shards/${shardId}`, {
    method: "DELETE",
  });
}
