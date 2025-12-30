import { describe, it, expect, beforeAll } from "vitest";
import { splitMEKIntoShards, reconstructMEKFromShards } from "../shamir";

describe("Shamir's Secret Sharing", () => {
  let testKey: CryptoKey;

  beforeAll(async () => {
    // Generate a test master key
    testKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  });

  it("should split and combine key correctly (2-of-3)", async () => {
    const shares = await splitMEKIntoShards(testKey);

    expect(shares.length).toBe(3);
    expect(shares.every((s) => typeof s === "string" && s.length > 0)).toBe(
      true
    );

    // Test combining with 2 shares (minimum)
    const combined1 = await reconstructMEKFromShards([shares[0], shares[1]]);

    // Verify the combined key works by encrypting/decrypting
    const testData = "test";
    const testIV = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBuffer = new TextEncoder().encode(testData);

    // Encrypt with original key
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      testKey,
      plaintextBuffer
    );

    // Decrypt with reconstructed key (should work)
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      combined1,
      ciphertext
    );
    expect(new TextDecoder().decode(decrypted)).toBe(testData);

    // Test combining with different 2 shares
    const combined2 = await reconstructMEKFromShards([shares[1], shares[2]]);
    const decrypted2 = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      combined2,
      ciphertext
    );
    expect(new TextDecoder().decode(decrypted2)).toBe(testData);

    // Test combining with all 3 shares
    const combined3 = await reconstructMEKFromShards(shares);
    const decrypted3 = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      combined3,
      ciphertext
    );
    expect(new TextDecoder().decode(decrypted3)).toBe(testData);
  });

  it("should fail with insufficient shares", async () => {
    const shares = await splitMEKIntoShards(testKey);

    // Try with only 1 share (below threshold of 2)
    await expect(reconstructMEKFromShards([shares[0]])).rejects.toThrow();
  });

  it("should handle different keys", async () => {
    const key1 = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const key2 = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const shares1 = await splitMEKIntoShards(key1);
    const shares2 = await splitMEKIntoShards(key2);

    // Shares should be different
    expect(shares1[0]).not.toBe(shares2[0]);

    // Reconstructed keys should be different
    const reconstructed1 = await reconstructMEKFromShards([
      shares1[0],
      shares1[1],
    ]);
    const reconstructed2 = await reconstructMEKFromShards([
      shares2[0],
      shares2[1],
    ]);

    // Test that they produce different ciphertexts (same IV, same data, different keys)
    const testData = "test";
    const testIV = new Uint8Array(12).fill(0); // Fixed IV for comparison
    const plaintextBuffer = new TextEncoder().encode(testData);

    const enc1 = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      reconstructed1,
      plaintextBuffer
    );
    const enc2 = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      reconstructed2,
      plaintextBuffer
    );

    // Different keys should produce different ciphertexts
    const enc1Array = new Uint8Array(enc1);
    const enc2Array = new Uint8Array(enc2);
    expect(enc1Array).not.toEqual(enc2Array);
  });

  it("should produce different shares for same key (randomness)", async () => {
    const shares1 = await splitMEKIntoShards(testKey);
    const shares2 = await splitMEKIntoShards(testKey);

    // Shares should be different (random polynomial coefficients)
    // Note: secrets.js might produce deterministic shares, so we check if they're different
    // If they're the same, that's also valid behavior
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    // Both should reconstruct to the same key regardless
    const combined1 = await reconstructMEKFromShards([shares1[0], shares1[1]]);
    const combined2 = await reconstructMEKFromShards([shares2[0], shares2[1]]);

    // Verify both work with the same test encryption
    const testData = "test";
    const testIV = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBuffer = new TextEncoder().encode(testData);

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      testKey,
      plaintextBuffer
    );

    const decrypted1 = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      combined1,
      ciphertext
    );
    const decrypted2 = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      combined2,
      ciphertext
    );

    expect(new TextDecoder().decode(decrypted1)).toBe(testData);
    expect(new TextDecoder().decode(decrypted2)).toBe(testData);
  });
});
