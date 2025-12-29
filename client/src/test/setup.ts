import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.subtle if needed
if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = {
    subtle: crypto.subtle,
    getRandomValues: (arr: any) => crypto.getRandomValues(arr),
  };
}

