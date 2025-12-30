import { mnemonicToSeed } from "./mnemonic";

const SALT = "mediqr-mek-salt-v1"; // Fixed salt for deterministic derivation
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derive the Master Encryption Key (MEK) from a mnemonic phrase
 * Uses PBKDF2-SHA256 for key derivation via Web Crypto API
 */
export async function deriveMEKFromMnemonic(mnemonic: string): Promise<CryptoKey> {
  const seed = mnemonicToSeed(mnemonic);
  const saltBuffer = new TextEncoder().encode(SALT);
  
  // Create a fresh ArrayBuffer to satisfy TypeScript's BufferSource type
  const seedBuffer = new Uint8Array(seed).buffer;
  
  // Import the seed as a key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    seedBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive the AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

