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
    const { encrypted: enc1, iv: iv1 } = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(12), tagLength: 128 },
      key1,
      new TextEncoder().encode(testData)
    );
    const { encrypted: enc2, iv: iv2 } = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(12), tagLength: 128 },
      key2,
      new TextEncoder().encode(testData)
    );

    // Same key + same IV + same data = same ciphertext
    expect(new Uint8Array(enc1)).toEqual(new Uint8Array(enc2));
  });

  it("should derive different keys from different mnemonics", async () => {
    const mnemonic1 = generateMnemonicPhrase();
    const mnemonic2 = generateMnemonicPhrase();

    // Ensure they're different
    expect(mnemonic1).not.toBe(mnemonic2);

    const key1 = await deriveMEKFromMnemonic(mnemonic1);
    const key2 = await deriveMEKFromMnemonic(mnemonic2);

    // Test by encrypting same data with same IV
    const testData = "test";
    const testIV = new Uint8Array(12);
    const { encrypted: enc1 } = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key1,
      new TextEncoder().encode(testData)
    );
    const { encrypted: enc2 } = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: testIV, tagLength: 128 },
      key2,
      new TextEncoder().encode(testData)
    );

    // Different keys = different ciphertext
    expect(new Uint8Array(enc1)).not.toEqual(new Uint8Array(enc2));
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

