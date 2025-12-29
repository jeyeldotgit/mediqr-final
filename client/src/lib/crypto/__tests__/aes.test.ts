import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptDataToBase64,
  decryptDataFromBase64,
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
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    expect(encrypted).toBeDefined();
    expect(iv).toBeDefined();
    expect(encrypted.length).toBeGreaterThan(0);
    expect(iv.length).toBeGreaterThan(0);

    const decrypted = await decryptDataFromBase64(masterKey, encrypted, iv);
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
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    // Create wrong IV (same length)
    const wrongIV = new Uint8Array(12).fill(0);

    await expect(
      decryptDataFromBase64(masterKey, encrypted, wrongIV)
    ).rejects.toThrow();
  });

  it("should handle empty string", async () => {
    const plaintext = "";
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    const decrypted = await decryptDataFromBase64(masterKey, encrypted, iv);
    expect(decrypted).toBe("");
  });

  it("should handle long text", async () => {
    const plaintext = "A".repeat(10000);
    const { encrypted, iv } = await encryptDataToBase64(masterKey, plaintext);

    const decrypted = await decryptDataFromBase64(masterKey, encrypted, iv);
    expect(decrypted).toBe(plaintext);
    expect(decrypted.length).toBe(10000);
  });
});

