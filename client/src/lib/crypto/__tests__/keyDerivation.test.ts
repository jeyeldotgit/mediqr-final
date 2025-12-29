import { describe, it, expect } from "vitest";
import { deriveMEKFromMnemonic } from "../keyDerivation";
import { generateMnemonicPhrase } from "../mnemonic";

describe("Key Derivation", () => {
  it("should derive the same key from the same mnemonic", async () => {
    const mnemonic = generateMnemonicPhrase();
    const key1 = await deriveMEKFromMnemonic(mnemonic);
    const key2 = await deriveMEKFromMnemonic(mnemonic);

    // Keys should be the same CryptoKey object (or equivalent)
    // We can't directly compare CryptoKey objects, so we'll test by using them
    const testData = "test";
    const testIV = new Uint8Array(12).fill(0); // Fixed IV for comparison
    const plaintextBuffer = new TextEncoder().encode(testData);

    const enc1 = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key1,
      plaintextBuffer
    );
    const enc2 = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key2,
      plaintextBuffer
    );

    // Same key + same IV + same data = same ciphertext
    expect(new Uint8Array(enc1)).toEqual(new Uint8Array(enc2));
  });

  it("should derive different keys from different mnemonics", async () => {
    // Generate two different mnemonics
    let mnemonic1 = generateMnemonicPhrase();
    let mnemonic2 = generateMnemonicPhrase();

    // Ensure they're different (retry if same, though very unlikely)
    let attempts = 0;
    while (mnemonic1 === mnemonic2 && attempts < 10) {
      mnemonic2 = generateMnemonicPhrase();
      attempts++;
    }
    expect(mnemonic1).not.toBe(mnemonic2);

    const key1 = await deriveMEKFromMnemonic(mnemonic1);
    const key2 = await deriveMEKFromMnemonic(mnemonic2);

    // Test by encrypting same data with SAME IV
    // Different keys MUST produce different ciphertext even with same IV and data
    const testData = "test";
    const testIV = new Uint8Array(12).fill(0); // Use fixed IV (all zeros) for comparison

    const enc1Result = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key1,
      new TextEncoder().encode(testData)
    );
    const enc2Result = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key2,
      new TextEncoder().encode(testData)
    );

    // Different keys = different ciphertext (even with same IV and data)
    const enc1Array = new Uint8Array(enc1Result);
    const enc2Array = new Uint8Array(enc2Result);

    // They should be different
    expect(enc1Array).not.toEqual(enc2Array);
  });

  it("should produce a valid AES-256 key", async () => {
    const mnemonic = generateMnemonicPhrase();
    const key = await deriveMEKFromMnemonic(mnemonic);

    expect(key.algorithm.name).toBe("AES-GCM");
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    expect(key.extractable).toBe(false);
    expect(key.usages).toContain("encrypt");
    expect(key.usages).toContain("decrypt");
  });
});
