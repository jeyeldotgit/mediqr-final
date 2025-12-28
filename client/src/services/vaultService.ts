/**
 * Vault service
 * Handles encrypted vault data operations
 */

import { apiRequest } from "./apiClient";

export type VaultCategory = "identity" | "allergies" | "medications" | "records";

export interface SyncVaultRequest {
  ownerId: string;
  category: VaultCategory;
  encryptedData: string;
  iv: string;
}

export interface SyncVaultResponse {
  success: boolean;
  blobId: string;
  storagePath: string;
  message: string;
}

export interface VaultItem {
  id: string;
  category: VaultCategory;
  updated_at: string;
  storage_path: string;
}

export interface GetVaultItemsResponse {
  success: boolean;
  items: VaultItem[];
  count: number;
}

/**
 * Sync encrypted vault data to server
 */
export async function syncVault(
  ownerId: string,
  category: VaultCategory,
  encryptedData: string,
  iv: string
): Promise<SyncVaultResponse> {
  return apiRequest<SyncVaultResponse>("/vault/sync", {
    method: "POST",
    body: JSON.stringify({
      ownerId,
      category,
      encryptedData,
      iv,
    }),
  });
}

/**
 * Get all vault items for an owner (metadata only)
 */
export async function getVaultItems(
  ownerId: string
): Promise<GetVaultItemsResponse> {
  return apiRequest<GetVaultItemsResponse>(`/vault/${ownerId}`, {
    method: "GET",
  });
}

