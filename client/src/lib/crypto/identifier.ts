/**
 * Generate a hashed identifier from a mnemonic phrase
 * This is used as a non-identifying user identifier
 */
export async function hashIdentifier(mnemonic: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a simple public key representation from mnemonic
 * For Phase 1, we use a hash of the mnemonic
 * In future phases, this could be a proper public key from keypair generation
 */
export async function derivePublicKey(mnemonic: string): Promise<string> {
  // For Phase 1, use a hash as the "public key"
  // In production, this would be derived from a keypair
  return hashIdentifier(mnemonic);
}
