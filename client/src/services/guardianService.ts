/**
 * Guardian service for managing guardian relationships
 */

import { apiRequest } from "./apiClient";

export interface Guardian {
  id: string;
  userId: string;
  guardianId: string;
  guardianProfile?: {
    id: string;
    role: string;
    publicKey?: string;
  };
  shardId?: string;
  createdAt?: string;
}

export interface SearchUserRequest {
  email?: string;
  userId?: string;
  hashedIdentifier?: string;
}

export interface SearchUserResponse {
  success: boolean;
  users: Array<{
    id: string;
    role: string;
    publicKey?: string;
  }>;
}

/**
 * Search for users to add as guardians
 * This is a placeholder - in production, this would search by email or other identifier
 * For now, we'll use a simple endpoint that returns available users
 */
export async function searchUsers(
  query: SearchUserRequest
): Promise<SearchUserResponse> {
  // For Phase 4 MVP, we'll implement a simple search
  // In production, this would be a proper search endpoint
  return apiRequest<SearchUserResponse>("/guardians/search", {
    method: "POST",
    body: JSON.stringify(query),
  });
}

/**
 * Get all guardians for the current user
 * This fetches from recovery_shards where guardian_id is not null
 */
export async function getGuardians(): Promise<Guardian[]> {
  const { getRecoveryShards } = await import("./recoveryService");
  const response = await getRecoveryShards();

  // Filter to only guardian shards (guardianId is not null and not equal to userId)
  const guardians: Guardian[] = [];
  const userId = response.shards[0]?.userId;

  for (const shard of response.shards) {
    if (shard.guardianId && shard.guardianId !== userId) {
      guardians.push({
        id: shard.id,
        userId: shard.userId,
        guardianId: shard.guardianId,
        shardId: shard.id,
      });
    }
  }

  return guardians;
}
