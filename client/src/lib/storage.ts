/**
 * Local storage utilities for onboarding state and local shard
 */

const STORAGE_KEYS = {
  ONBOARDED: "mediqr_onboarded",
  MNEMONIC: "mediqr_mnemonic", // Only for Phase 1 - should be removed in production
  LOCAL_SHARD: "mediqr_local_shard",
  USER_ID: "mediqr_user_id", // Store user ID after profile creation
} as const;

/**
 * Check if user has completed onboarding
 */
export function isOnboarded(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === "true";
}

/**
 * Mark user as onboarded
 */
export function setOnboarded(value: boolean = true): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDED, String(value));
}

/**
 * Store mnemonic phrase (TEMPORARY - for Phase 1 only)
 * In production, this should never be stored
 */
export function storeMnemonic(mnemonic: string): void {
  localStorage.setItem(STORAGE_KEYS.MNEMONIC, mnemonic);
}

/**
 * Retrieve mnemonic phrase (TEMPORARY - for Phase 1 only)
 */
export function getStoredMnemonic(): string | null {
  return localStorage.getItem(STORAGE_KEYS.MNEMONIC);
}

/**
 * Clear stored mnemonic
 */
export function clearMnemonic(): void {
  localStorage.removeItem(STORAGE_KEYS.MNEMONIC);
}

/**
 * Store local shard (encrypted)
 */
export function storeLocalShard(shard: string): void {
  localStorage.setItem(STORAGE_KEYS.LOCAL_SHARD, shard);
}

/**
 * Retrieve local shard
 */
export function getLocalShard(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LOCAL_SHARD);
}

/**
 * Store user ID after profile creation
 */
export function storeUserId(userId: string): void {
  localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
}

/**
 * Retrieve user ID
 */
export function getUserId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USER_ID);
}

/**
 * Clear all stored data
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
