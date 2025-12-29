/**
 * Shamir's Secret Sharing (SSS) utilities
 *
 * Splits a secret (MEK) into multiple shards using 2-of-3 threshold scheme.
 * Uses secrets.js-grempe library for SSS implementation.
 */

// Type definitions for secrets.js
interface SecretsJS {
  share(secret: string, numShares: number, threshold: number): string[];
  combine(shares: string[]): string;
  newShare(id: number, shares: string[]): string;
  extractShareComponents(share: string): { id: number; data: string };
}

// Dynamic import for secrets.js-grempe
let secretsJS: SecretsJS | null = null;

async function getSecretsJS(): Promise<SecretsJS> {
  if (secretsJS) {
    return secretsJS;
  }

  try {
    // @ts-ignore - secrets.js-grempe doesn't have TypeScript definitions
    const secrets = await import("secrets.js-grempe");
    secretsJS = secrets.default || secrets;
    return secretsJS;
  } catch (error) {
    throw new Error(
      "Failed to load secrets.js-grempe. Please install it: npm install secrets.js-grempe"
    );
  }
}

/**
 * Convert a CryptoKey to a hex string for SSS
 */
async function keyToHex(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key);
  const bytes = new Uint8Array(exported);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert a hex string back to a CryptoKey
 */
async function hexToKey(hex: string): Promise<CryptoKey> {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Split a Master Encryption Key (MEK) into 3 shards using 2-of-3 threshold
 *
 * @param masterKey - The CryptoKey to split
 * @returns Array of 3 hex-encoded shard strings
 */
export async function splitMEKIntoShards(
  masterKey: CryptoKey
): Promise<string[]> {
  const secrets = await getSecretsJS();

  // Convert key to hex
  const keyHex = await keyToHex(masterKey);

  // Split into 3 shares with threshold of 2
  const shares = secrets.share(keyHex, 3, 2);

  return shares;
}

/**
 * Reconstruct MEK from any 2 of 3 shards
 *
 * @param shards - Array of at least 2 shard strings (hex-encoded)
 * @returns The reconstructed CryptoKey
 */
export async function reconstructMEKFromShards(
  shards: string[]
): Promise<CryptoKey> {
  if (shards.length < 2) {
    throw new Error("At least 2 shards are required to reconstruct the key");
  }

  if (shards.length > 3) {
    throw new Error("Too many shards provided (maximum 3)");
  }

  const secrets = await getSecretsJS();

  // Combine shards to reconstruct the secret
  const keyHex = secrets.combine(shards);

  // Convert hex back to CryptoKey
  return hexToKey(keyHex);
}

/**
 * Validate that a shard string is properly formatted
 */
export function validateShard(shard: string): boolean {
  if (!shard || typeof shard !== "string") {
    return false;
  }

  // secrets.js shares are typically hex strings with a prefix
  // Format: typically starts with a number (share ID) followed by hex data
  return /^[0-9a-f]+$/i.test(shard);
}

/**
 * Get the share ID from a shard (for identification purposes)
 */
export async function getShardId(shard: string): Promise<number> {
  const secrets = await getSecretsJS();
  try {
    const components = secrets.extractShareComponents(shard);
    return components.id;
  } catch (error) {
    throw new Error("Invalid shard format");
  }
}
