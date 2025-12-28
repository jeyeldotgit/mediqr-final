import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeedSync,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Generate a 12-word BIP-39 mnemonic phrase
 */
export function generateMnemonicPhrase(): string {
  return generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validate a mnemonic phrase
 */
export function validateMnemonicPhrase(phrase: string): boolean {
  return validateMnemonic(phrase, wordlist);
}

/**
 * Derive a seed from a mnemonic phrase
 */
export function mnemonicToSeed(phrase: string): Uint8Array {
  return mnemonicToSeedSync(phrase);
}
