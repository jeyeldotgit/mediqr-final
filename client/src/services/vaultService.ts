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
 * Falls back to offline vault if online fetch fails
 */
export async function getVaultItems(
  ownerId: string
): Promise<GetVaultItemsResponse> {
  try {
    // Try to fetch from server first
    return await apiRequest<GetVaultItemsResponse>(`/vault/${ownerId}`, {
      method: "GET",
    });
  } catch (error) {
    // If online fetch fails (network error or HTTP error), try to use offline vault
    console.warn("Online vault fetch failed, checking offline vault:", error);
    
    // Dynamic import to avoid circular dependency
    const { getOfflineVault } = await import("./offlineVaultService");
    const offlineVault = getOfflineVault();
    
    // Use offline vault if it exists and matches the user ID (even if items array is empty)
    if (offlineVault && offlineVault.userId === ownerId) {
      // Convert offline vault items to VaultItem format
      const items: VaultItem[] = offlineVault.items.map((item) => ({
        id: item.id,
        category: item.category as VaultCategory,
        updated_at: item.updatedAt,
        storage_path: item.storagePath,
      }));
      
      console.log(`Using offline vault with ${items.length} items`);
      return {
        success: true,
        items,
        count: items.length,
      };
    }
    
    // If no offline vault available, return empty result instead of throwing
    // This allows the UI to render even when offline and no vault is downloaded
    console.warn("No offline vault available, returning empty result");
    return {
      success: true,
      items: [],
      count: 0,
    };
  }
}

