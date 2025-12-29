/**
 * Session key derivation for QR-based encryption/decryption
 * 
 * This module provides functions to derive session keys that can be used
 * for encrypting/decrypting data that will be accessed via QR codes.
 * 
 * The approach:
 * 1. Derive a session key from master key + session ID (token)
 * 2. Use this session key for encryption (instead of master key directly)
 * 3. Staff can derive the same session key from fragment + token
 * 4. This allows decryption without exposing the master key
 */

/**
 * Derive a session key from master key and session ID (token)
 * This key can be used to encrypt data that will be accessed via QR
 * 
 * The approach: Generate the QR fragment (deterministic), then use it
 * with the token to derive the session key. This matches the fragment-based
 * derivation used by staff.
 * 
 * @param masterKey - The master encryption key
 * @param sessionId - Session identifier (QR token)
 * @param userId - User ID for salt
 * @returns Session key for encryption/decryption
 */
export async function deriveSessionKeyFromMaster(
  masterKey: CryptoKey,
  sessionId: string,
  userId: string
): Promise<CryptoKey> {
  try {
    // Generate the QR fragment (same process as QRGenerator)
    // This is deterministic: encrypt("mediqr-fragment-{userId}") with master key
    const fragmentPlaintext = new TextEncoder().encode(`mediqr-fragment-${userId}`);
    
    // Use deterministic IV (same as QR fragment generation)
    const ivInput = new TextEncoder().encode(`mediqr-iv-${userId}`);
    const ivHash = await crypto.subtle.digest("SHA-256", ivInput);
    const fixedIV = new Uint8Array(ivHash.slice(0, 12));
    
    // Encrypt to get fragment (same as QR generation)
    const encryptedFragment = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: fixedIV,
        tagLength: 128,
      },
      masterKey,
      fragmentPlaintext
    );
    
    // Use first 16 bytes as fragment (same as QR generation)
    const fragmentBytes = new Uint8Array(encryptedFragment.slice(0, 16));
    
    // Now use fragment + token to derive session key (same as fragment-based derivation)
    const tokenBytes = new TextEncoder().encode(sessionId);
    const combined = new Uint8Array(fragmentBytes.length + tokenBytes.length);
    combined.set(fragmentBytes, 0);
    combined.set(tokenBytes, fragmentBytes.length);
    
    // Hash to get 32-byte key material
    const keyMaterialHash = await crypto.subtle.digest("SHA-256", combined);
    const keyMaterial = new Uint8Array(keyMaterialHash);
    
    // Derive the actual session key using PBKDF2
    const baseKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    // Use same salt as fragment derivation for consistency
    const saltInput = new TextEncoder().encode(`mediqr-session-salt-${userId}`);
    const saltHash = await crypto.subtle.digest("SHA-256", saltInput);
    const salt = new Uint8Array(saltHash.slice(0, 16));
    
    const sessionKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );
    
    return sessionKey;
  } catch (error) {
    console.error("Failed to derive session key from master:", error);
    throw new Error(
      `Failed to derive session key: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Derive a session key from fragment and token (for staff decryption)
 * This should produce the same key as deriveSessionKeyFromMaster
 * 
 * The challenge: We can't replicate encrypt(masterKey, "mediqr-session-{token}-{userId}")
 * because we don't have the master key. However, we can use the fragment which contains
 * information about the master key.
 * 
 * Approach: Use the fragment + token to derive key material in a way that produces
 * the same result as the master key derivation.
 * 
 * @param fragment - Hex string fragment from QR code (16 bytes from encrypt(masterKey, "mediqr-fragment-{userId}"))
 * @param token - JWT token (session ID)
 * @param userId - Patient's user ID
 * @returns Session key for decryption
 */
export async function deriveSessionKeyFromFragment(
  fragment: string,
  token: string,
  userId: string
): Promise<CryptoKey> {
  try {
    // Convert fragment hex to bytes (16 bytes)
    const fragmentBytes = new Uint8Array(
      fragment.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    
    // The fragment is the first 16 bytes of encrypt(masterKey, "mediqr-fragment-{userId}")
    // We need to create key material that matches what deriveSessionKeyFromMaster produces
    
    // Match the master key derivation: combine fragment + token (not session string)
    const tokenBytes = new TextEncoder().encode(token);
    
    // Combine fragment + token (same as master key derivation)
    const combined = new Uint8Array(fragmentBytes.length + tokenBytes.length);
    combined.set(fragmentBytes, 0);
    combined.set(tokenBytes, fragmentBytes.length);
    
    // Hash to get 32-byte key material
    const keyMaterialHash = await crypto.subtle.digest("SHA-256", combined);
    const keyMaterial = new Uint8Array(keyMaterialHash);
    
    // Derive the actual session key using PBKDF2 (same as master key derivation)
    const baseKey = await crypto.subtle.importKey(
      "raw",
      keyMaterial,
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    
    // Use same salt as deriveSessionKeyFromMaster
    const saltInput = new TextEncoder().encode(`mediqr-session-salt-${userId}`);
    const saltHash = await crypto.subtle.digest("SHA-256", saltInput);
    const salt = new Uint8Array(saltHash.slice(0, 16));
    
    const sessionKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );
    
    return sessionKey;
  } catch (error) {
    console.error("Failed to derive session key from fragment:", error);
    throw new Error(
      `Failed to derive session key: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

