/**
 * Offline vault service
 * Handles storing and retrieving encrypted vault data for offline use
 */

import { getUserId } from "../lib/storage";
import { API_BASE_URL } from "./apiClient";

const OFFLINE_VAULT_KEY = "mediqr_offline_vault";
const OFFLINE_VAULT_TIMESTAMP_KEY = "mediqr_offline_vault_timestamp";

export interface OfflineVaultData {
  userId: string;
  timestamp: number;
  items: Array<{
    id: string;
    category: string;
    storagePath: string;
    encryptedData: string;
    iv: string;
    updatedAt: string;
  }>;
}

/**
 * Download and store vault data for offline use
 * Fetches all vault items with signed URLs and downloads encrypted blobs
 */
export async function downloadOfflineVault(): Promise<OfflineVaultData> {
  const userId = getUserId();
  if (!userId) {
    throw new Error("User ID not found. Please complete onboarding first.");
  }

  try {
    // Get vault items with signed URLs (24-hour expiry for offline use)
    const url = `${API_BASE_URL}/vault/${userId}/offline`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        error.error || error.details || `HTTP ${response.status}`
      );
    }

    const vaultResponse = await response.json();
    const items = vaultResponse.items || [];

    // Download encrypted blobs for each item
    const offlineItems = await Promise.all(
      items.map(
        async (item: {
          id: string;
          category: string;
          storagePath: string;
          iv: string;
          updatedAt: string;
          signedUrl: string | null;
          error?: string;
        }) => {
          try {
            if (!item.signedUrl || item.error) {
              // Skip items without valid URLs
              return null;
            }

            // Fetch the encrypted blob
            const blobResponse = await fetch(item.signedUrl);
            if (!blobResponse.ok) {
              console.error(
                `Failed to fetch blob ${item.id}:`,
                blobResponse.statusText
              );
              return null;
            }

            // Convert blob to base64 for storage
            const blob = await blobResponse.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            );

            return {
              id: item.id,
              category: item.category,
              storagePath: item.storagePath,
              encryptedData: base64,
              iv: item.iv,
              updatedAt: item.updatedAt,
            };
          } catch (err) {
            console.error(`Failed to download blob for item ${item.id}:`, err);
            return null;
          }
        }
      )
    );

    // Filter out null items (failed downloads)
    const validItems = offlineItems.filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

    const offlineVault: OfflineVaultData = {
      userId,
      timestamp: Date.now(),
      items: validItems,
    };

    // Store in localStorage
    localStorage.setItem(OFFLINE_VAULT_KEY, JSON.stringify(offlineVault));
    localStorage.setItem(
      OFFLINE_VAULT_TIMESTAMP_KEY,
      String(offlineVault.timestamp)
    );

    return offlineVault;
  } catch (error) {
    console.error("Failed to download offline vault:", error);
    throw new Error(
      `Failed to download vault for offline use: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get stored offline vault data
 */
export function getOfflineVault(): OfflineVaultData | null {
  try {
    const stored = localStorage.getItem(OFFLINE_VAULT_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as OfflineVaultData;
  } catch (error) {
    console.error("Failed to parse offline vault:", error);
    return null;
  }
}

/**
 * Get offline vault timestamp
 */
export function getOfflineVaultTimestamp(): number | null {
  const timestamp = localStorage.getItem(OFFLINE_VAULT_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

/**
 * Check if offline vault exists and is recent (within 7 days)
 */
export function hasRecentOfflineVault(): boolean {
  const timestamp = getOfflineVaultTimestamp();
  if (!timestamp) {
    return false;
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return timestamp > sevenDaysAgo;
}

/**
 * Clear offline vault data
 */
export function clearOfflineVault(): void {
  localStorage.removeItem(OFFLINE_VAULT_KEY);
  localStorage.removeItem(OFFLINE_VAULT_TIMESTAMP_KEY);
}

/**
 * Get offline vault size estimate (in bytes)
 */
export function getOfflineVaultSize(): number {
  const stored = localStorage.getItem(OFFLINE_VAULT_KEY);
  if (!stored) {
    return 0;
  }
  return new Blob([stored]).size;
}
