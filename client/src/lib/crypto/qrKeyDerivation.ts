/**
 * Key derivation for QR code-based decryption
 * 
 * This module now uses session keys for encryption/decryption.
 * When data is encrypted with a session key (derived from master key + token),
 * staff can decrypt it using a session key derived from fragment + token.
 */

import { deriveSessionKeyFromFragment } from "./sessionKey";

/**
 * Derive a decryption key from QR fragment and token
 * 
 * This uses the session key derivation approach, which allows staff to decrypt
 * data that was encrypted with a session key derived from master key + token.
 * 
 * @param fragment - Hex string fragment from QR code (derived from master key)
 * @param token - JWT token from backend
 * @param patientId - Patient's user ID
 * @returns CryptoKey that can be used to decrypt patient records
 */
export async function deriveDecryptionKeyFromQR(
  fragment: string,
  token: string,
  patientId: string
): Promise<CryptoKey> {
  // Use the session key derivation from fragment
  return deriveSessionKeyFromFragment(fragment, token, patientId);
}

