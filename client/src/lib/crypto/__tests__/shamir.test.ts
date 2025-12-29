import { describe, it, expect } from "vitest";
import { splitSecret, combineShares } from "../shamir";

describe("Shamir's Secret Sharing", () => {
  it("should split and combine secret correctly (2-of-3)", async () => {
    const secret = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const threshold = 2;
    const totalShares = 3;

    const shares = await splitSecret(secret, threshold, totalShares);

    expect(shares.length).toBe(totalShares);

    // Test combining with 2 shares (minimum)
    const combined1 = await combineShares([shares[0], shares[1]]);
    expect(combined1).toEqual(secret);

    // Test combining with different 2 shares
    const combined2 = await combineShares([shares[1], shares[2]]);
    expect(combined2).toEqual(secret);

    // Test combining with all 3 shares
    const combined3 = await combineShares(shares);
    expect(combined3).toEqual(secret);
  });

  it("should fail with insufficient shares", async () => {
    const secret = new Uint8Array([1, 2, 3, 4, 5]);
    const threshold = 2;
    const totalShares = 3;

    const shares = await splitSecret(secret, threshold, totalShares);

    // Try with only 1 share (below threshold)
    await expect(combineShares([shares[0]])).rejects.toThrow();
  });

  it("should work with different threshold configurations", async () => {
    const secret = new Uint8Array([42, 43, 44]);
    
    // Test 3-of-5
    const shares3of5 = await splitSecret(secret, 3, 5);
    expect(shares3of5.length).toBe(5);
    const combined3of5 = await combineShares([
      shares3of5[0],
      shares3of5[1],
      shares3of5[2],
    ]);
    expect(combined3of5).toEqual(secret);

    // Test 2-of-2
    const shares2of2 = await splitSecret(secret, 2, 2);
    expect(shares2of2.length).toBe(2);
    const combined2of2 = await combineShares(shares2of2);
    expect(combined2of2).toEqual(secret);
  });

  it("should handle empty secret", async () => {
    const secret = new Uint8Array([]);
    const shares = await splitSecret(secret, 2, 3);
    const combined = await combineShares([shares[0], shares[1]]);
    expect(combined).toEqual(secret);
  });

  it("should handle large secrets", async () => {
    const secret = new Uint8Array(1000).fill(42);
    const shares = await splitSecret(secret, 2, 3);
    const combined = await combineShares([shares[0], shares[1]]);
    expect(combined).toEqual(secret);
    expect(combined.length).toBe(1000);
  });

  it("should produce different shares for same secret", async () => {
    const secret = new Uint8Array([1, 2, 3, 4, 5]);
    
    const shares1 = await splitSecret(secret, 2, 3);
    const shares2 = await splitSecret(secret, 2, 3);

    // Shares should be different (random polynomial coefficients)
    expect(shares1[0]).not.toEqual(shares2[0]);
    expect(shares1[1]).not.toEqual(shares2[1]);
    expect(shares1[2]).not.toEqual(shares2[2]);

    // But both should combine to the same secret
    const combined1 = await combineShares([shares1[0], shares1[1]]);
    const combined2 = await combineShares([shares2[0], shares2[1]]);
    expect(combined1).toEqual(secret);
    expect(combined2).toEqual(secret);
  });
});

