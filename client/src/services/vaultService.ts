/**
 * Vault service
 * Handles encrypted vault data operations
 */

import { apiRequest } from "./apiClient";
import type {
  VaultCategory,
  VaultItem,
  SyncVaultResponse,
  GetVaultItemsResponse,
} from "../types";

// Re-export types for backwards compatibility
export type { VaultCategory, VaultItem };

/**
 * Sync encrypted vault data to server
 */
export const syncVault = async (
  ownerId: string,
  category: VaultCategory,
  encryptedData: string,
  iv: string
): Promise<SyncVaultResponse> => {
  return apiRequest<SyncVaultResponse>("/vault/sync", {
    method: "POST",
    body: JSON.stringify({
      ownerId,
      category,
      encryptedData,
      iv,
    }),
  });
};

/**
 * Get all vault items for an owner (metadata only)
 * Falls back to offline vault if online fetch fails
 */
export const getVaultItems = async (
  ownerId: string
): Promise<GetVaultItemsResponse> => {
  try {
    return await apiRequest<GetVaultItemsResponse>(`/vault/${ownerId}`, {
      method: "GET",
    });
  } catch (error) {
    console.warn("Online vault fetch failed, checking offline vault:", error);

    const { getOfflineVault } = await import("./offlineVaultService");
    const offlineVault = getOfflineVault();

    if (offlineVault && offlineVault.userId === ownerId) {
      const items: VaultItem[] = offlineVault.items.map((item) => ({
        id: item.id,
        category: item.category as VaultCategory,
        updated_at: item.updatedAt,
        storage_path: item.storagePath,
      }));

      console.log(`Using offline vault with ${items.length} items`);
      return { success: true, items, count: items.length };
    }

    console.warn("No offline vault available, returning empty result");
    return { success: true, items: [], count: 0 };
  }
};
