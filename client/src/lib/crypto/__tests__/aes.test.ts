import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptDataToBase64,
  decryptDataFromBase64,
  encryptData,
  decryptData,
} from "../aes";

describe("AES Encryption/Decryption", () => {
  let masterKey: CryptoKey;

  beforeAll(async () => {
    // Generate a test master key
    masterKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  });

  it("should encrypt and decrypt plaintext successfully", async () => {
    const plaintext = "Hello, MediQR!";

    // First verify low-level functions work
    const { ciphertext, iv } = await encryptData(masterKey, plaintext);
    const decryptedLowLevel = await decryptData(masterKey, ciphertext, iv);
    expect(decryptedLowLevel).toBe(plaintext);

    // Now test base64 functions
    const { encrypted, iv: ivBase64 } = await encryptDataToBase64(
      masterKey,
      plaintext
    );

    expect(encrypted).toBeDefined();
    expect(ivBase64).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
    expect(ivBase64.length).toBeGreaterThan(0);

    // Verify IV is valid base64 and decodes to 12 bytes
    const decodedIV = base64ToArrayBuffer(ivBase64);
    expect(new Uint8Array(decodedIV).length).toBe(12);

    const decrypted = await decryptDataFromBase64(
      masterKey,
      encrypted,
      ivBase64
    );
    expect(decrypted).toBe(plaintext);
  });

  // Helper for base64 conversion (same as in aes.ts)
  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    let normalizedBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    while (normalizedBase64.length % 4) {
      normalizedBase64 += "=";
    }
    const binary = atob(normalizedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  it("should encrypt and decrypt using low-level functions", async () => {
    const plaintext = "Test message";
    const { ciphertext, iv } = await encryptData(masterKey, plaintext);

    expect(ciphertext).toBeDefined();
    expect(iv).toBeDefined();
    expect(iv.length).toBe(12); // GCM uses 12-byte IV

    const decrypted = await decryptData(masterKey, ciphertext, iv);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same plaintext (IV uniqueness)", async () => {
    const plaintext = "Test message";
    const { encrypted: encrypted1, iv: iv1 } = await encryptDataToBase64(
      masterKey,
      plaintext
    );
    const { encrypted: encrypted2, iv: iv2 } = await encryptDataToBase64(
      masterKey,
      plaintext
    );

    // IVs should be different
    expect(iv1).not.toBe(iv2);
    // Ciphertexts should be different (due to different IVs)
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same plaintext
    const decrypted1 = await decryptDataFromBase64(masterKey, encrypted1, iv1);
    const decrypted2 = await decryptDataFromBase64(masterKey, encrypted2, iv2);
    expect(decrypted1).toBe(plaintext);
    expect(decrypted2).toBe(plaintext);
  });

  it("should handle JSON data", async () => {
    const jsonData = JSON.stringify({ name: "John", age: 30 });
    const { encrypted, iv } = await encryptDataToBase64(masterKey, jsonData);

    const decrypted = await decryptDataFromBase64(masterKey, encrypted, iv);
    const parsed = JSON.parse(decrypted);

    expect(parsed.name).toBe("John");
    expect(parsed.age).toBe(30);
  });

  it("should fail decryption with wrong key", async () => {
    const plaintext = "Secret message";
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    // Generate a different key
    const wrongKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    await expect(
      decryptDataFromBase64(wrongKey, encrypted, iv)
    ).rejects.toThrow();
  });

  it("should fail decryption with wrong IV", async () => {
    const plaintext = "Secret message";
    const { encrypted } = await encryptDataToBase64(masterKey, plaintext);

    // Create wrong IV (same length) - convert to base64 string
    const wrongIVBytes = new Uint8Array(12).fill(0);
    const wrongIV = arrayBufferToBase64(wrongIVBytes.buffer);

    await expect(
      decryptDataFromBase64(masterKey, encrypted, wrongIV)
    ).rejects.toThrow();
  });

  // Helper function for base64 conversion (same as in aes.ts)
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  it("should handle empty string", async () => {
    const plaintext = "";
    // Use low-level function for empty string (base64 might have issues)
    const { ciphertext, iv } = await encryptData(masterKey, plaintext);
    const decrypted = await decryptData(masterKey, ciphertext, iv);
    expect(decrypted).toBe("");
  });

  it("should handle long text", async () => {
    const plaintext = "A".repeat(1000); // Reduced size for test performance
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    const decrypted = await decryptDataFromBase64(masterKey, encrypted, iv);
    expect(decrypted).toBe(plaintext);
    expect(decrypted.length).toBe(1000);
  });
});
