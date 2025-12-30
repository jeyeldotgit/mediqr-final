/**
 * AES-256-GCM encryption and decryption utilities
 */

/**
 * Encrypt data using AES-256-GCM
 * @param masterKey - The master encryption key (CryptoKey)
 * @param plaintext - The data to encrypt (string or Uint8Array)
 * @returns Object containing encrypted data and IV
 */
export async function encryptData(
  masterKey: CryptoKey,
  plaintext: string | Uint8Array
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  // Convert plaintext to ArrayBuffer if it's a string
  const plaintextBytes =
    typeof plaintext === "string"
      ? new TextEncoder().encode(plaintext)
      : plaintext;
  
  // Create a fresh ArrayBuffer to satisfy TypeScript's BufferSource type
  const plaintextBuffer = new Uint8Array(plaintextBytes).buffer;

  // Generate a random IV (12 bytes for GCM)
  const ivArray = new Uint8Array(12);
  crypto.getRandomValues(ivArray);
  const iv = new Uint8Array(ivArray.buffer);

  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer,
      tagLength: 128, // 128-bit authentication tag
    },
    masterKey,
    plaintextBuffer
  );

  return { ciphertext, iv };
}

/**
 * Decrypt data using AES-256-GCM
 * @param masterKey - The master encryption key (CryptoKey)
 * @param ciphertext - The encrypted data (ArrayBuffer or Uint8Array)
 * @param iv - The initialization vector (Uint8Array)
 * @returns Decrypted data as string
 */
export async function decryptData(
  masterKey: CryptoKey,
  ciphertext: ArrayBuffer | Uint8Array,
  iv: Uint8Array
): Promise<string> {
  try {
    // Validate IV length
    if (iv.length !== 12) {
      throw new Error(`Invalid IV length: expected 12 bytes, got ${iv.length}`);
    }

    // Always operate on a Uint8Array for compatibility with all Web Crypto implementations
    const data =
      ciphertext instanceof Uint8Array ? ciphertext : new Uint8Array(ciphertext);
    
    // Create fresh ArrayBuffer copies to satisfy TypeScript's BufferSource type
    const ivBuffer = new Uint8Array(iv).buffer;
    const dataBuffer = new Uint8Array(data).buffer;

    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
        tagLength: 128,
      },
      masterKey,
      dataBuffer
    );

    return new TextDecoder().decode(plaintextBuffer);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Decryption failed: ${errorMessage}`);
  }
}

/**
 * Encrypt data and return as base64-encoded string (for storage/transmission)
 */
export async function encryptDataToBase64(
  masterKey: CryptoKey,
  plaintext: string
): Promise<{ encrypted: string; iv: string }> {
  const { ciphertext, iv } = await encryptData(masterKey, plaintext);
  
  // Convert ArrayBuffer to base64
  const encryptedBase64 = arrayBufferToBase64(ciphertext);
  // Convert Uint8Array to base64 - use helper to ensure exact byte count
  const ivBase64 = uint8ArrayToBase64(iv);
  
  return { encrypted: encryptedBase64, iv: ivBase64 };
}

/**
 * Decrypt data from base64-encoded string
 */
export async function decryptDataFromBase64(
  masterKey: CryptoKey,
  encrypted: string,
  iv: string
): Promise<string> {
  try {
    // Validate inputs
    if (!encrypted || !iv) {
      throw new Error("Encrypted data and IV are required");
    }

    // Decode base64 strings
    let ciphertextBuffer: ArrayBuffer;
    let ivBuffer: Uint8Array;

    try {
      ciphertextBuffer = base64ToArrayBuffer(encrypted);
    } catch (error) {
      throw new Error(
        `Failed to decode encrypted data: ${
          error instanceof Error ? error.message : "Invalid base64"
        }`
      );
    }

    try {
      const ivArrayBuffer = base64ToArrayBuffer(iv);
      ivBuffer = new Uint8Array(ivArrayBuffer);
      
      // Validate IV length (should be 12 bytes for AES-GCM)
      if (ivBuffer.length !== 12) {
        throw new Error(
          `Invalid IV length: expected 12 bytes, got ${ivBuffer.length} bytes. IV base64: ${iv.substring(0, 20)}...`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to decode IV: ${
          error instanceof Error ? error.message : "Invalid base64"
        }. IV value: ${iv.substring(0, 50)}...`
      );
    }

    // Convert ciphertext ArrayBuffer to Uint8Array before decryption
    const cipherBytes = new Uint8Array(ciphertextBuffer);
    return decryptData(masterKey, cipherBytes, ivBuffer);
  } catch (error) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Handle potential buffer offset issues by creating a new view
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Uint8Array to base64 (ensures exact byte count)
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  // Create a new array to ensure we only encode the exact bytes
  const bytes = new Uint8Array(arr.length);
  bytes.set(arr);
  return arrayBufferToBase64(bytes.buffer);
}

/**
 * Helper: Convert base64 to ArrayBuffer
 * Handles URL-safe base64 and validates input
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    // Handle URL-safe base64 (replace - with + and _ with /)
    let normalizedBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    
    // Add padding if needed
    while (normalizedBase64.length % 4) {
      normalizedBase64 += "=";
    }
    
    // Validate base64 format (basic check)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedBase64)) {
      throw new Error("Invalid base64 format");
    }
    
    const binary = atob(normalizedBase64);
    // Create a new ArrayBuffer with exactly the right size
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    // Return the buffer directly (it's already a clean ArrayBuffer)
    return buffer;
  } catch (error) {
    throw new Error(
      `Failed to decode base64: ${
        error instanceof Error ? error.message : "Invalid base64 string"
      }`
    );
  }
}

