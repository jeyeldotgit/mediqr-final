/**
 * API client for MediQR backend
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Initialize user profile after onboarding
 */
export async function initProfile(publicKey: string, hashedIdentifier: string) {
  const response = await fetch(`${API_BASE_URL}/auth/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey,
      hashedIdentifier,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Sync encrypted vault data to server
 */
export async function syncVault(
  ownerId: string,
  category: "identity" | "allergies" | "medications" | "records",
  encryptedData: string,
  iv: string
) {
  const response = await fetch(`${API_BASE_URL}/vault/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ownerId,
      category,
      encryptedData,
      iv,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get all vault items for an owner (metadata only)
 */
export async function getVaultItems(ownerId: string) {
  const response = await fetch(`${API_BASE_URL}/vault/${ownerId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
