# Decryption Architecture

## Overview

This document describes the session-key-based encryption and decryption system that enables staff members to decrypt patient medical records using only the QR code fragment and token, without requiring access to the patient's master encryption key.

## Problem Statement

The initial implementation encrypted all data with the patient's master key (derived from their mnemonic phrase). However, when staff scanned a patient's QR code, they only had access to:
- A **fragment** (16 bytes derived from the master key via one-way encryption)
- A **token** (JWT from the backend)

Since the fragment is a one-way derivation from the master key, staff cannot reconstruct the master key to decrypt the data. This created an architectural limitation where staff could access blob URLs but could not decrypt the actual medical records.

## Solution: Session-Key-Based Encryption

The solution implements a **session-key-based encryption scheme** where:

1. **Encryption**: Data is encrypted with a session key derived from `masterKey + deterministicToken`
2. **Decryption**: Staff can derive the same session key from `fragment + deterministicToken`
3. **Deterministic Token**: Both sides derive the same token from the fragment itself, ensuring consistency

## Architecture

### Key Derivation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ENCRYPTION SIDE (Patient)                │
└─────────────────────────────────────────────────────────────┘

1. Master Key (from mnemonic)
   ↓
2. Generate Fragment: encrypt(masterKey, "mediqr-fragment-{userId}")[0:16]
   ↓
3. Derive Deterministic Token: SHA-256(fragment)[0:32]
   ↓
4. Derive Session Key: PBKDF2(fragment + token, salt, iterations)
   ↓
5. Encrypt Data: AES-256-GCM(sessionKey, plaintext)

┌─────────────────────────────────────────────────────────────┐
│                  DECRYPTION SIDE (Staff)                     │
└─────────────────────────────────────────────────────────────┘

1. Fragment (from QR code)
   ↓
2. Derive Deterministic Token: SHA-256(fragment)[0:32]
   ↓
3. Derive Session Key: PBKDF2(fragment + token, salt, iterations)
   ↓
4. Decrypt Data: AES-256-GCM(sessionKey, ciphertext)
```

### Why This Works

Both sides use the **same fragment** and derive the **same deterministic token** from it:
- **Patient side**: Generates fragment from master key (deterministic process)
- **Staff side**: Receives fragment from QR code (same value)

Since both sides have the same fragment and use the same token derivation, they produce identical session keys.

## Implementation Details

### 1. Fragment Generation

The fragment is a deterministic 16-byte value derived from the master key:

```typescript
// Location: client/src/components/QRGenerator.tsx
// Also used in: client/src/pages/Vault.tsx

const fragmentPlaintext = new TextEncoder().encode(`mediqr-fragment-${userId}`);
const ivInput = new TextEncoder().encode(`mediqr-iv-${userId}`);
const ivHash = await crypto.subtle.digest("SHA-256", ivInput);
const fixedIV = new Uint8Array(ivHash.slice(0, 12));

const encryptedFragment = await crypto.subtle.encrypt(
  {
    name: "AES-GCM",
    iv: fixedIV,
    tagLength: 128,
  },
  masterKey,
  fragmentPlaintext
);

const fragmentBytes = new Uint8Array(encryptedFragment.slice(0, 16));
```

**Key Properties:**
- Deterministic: Same master key + userId = same fragment
- One-way: Cannot reverse fragment to get master key
- Consistent: Same fragment used in QR code and encryption

### 2. Deterministic Token Derivation

Instead of using a rotating backend token (which would differ between encryption and decryption), we derive a deterministic token from the fragment:

```typescript
// Location: client/src/pages/Vault.tsx (encryption)
// Location: client/src/pages/StaffPatientView.tsx (decryption)

const tokenMaterial = await crypto.subtle.digest("SHA-256", fragmentBytes);
const tokenBytes = new Uint8Array(tokenMaterial.slice(0, 32));
const deterministicToken = Array.from(tokenBytes)
  .map((b) => b.toString(16).padStart(2, "0"))
  .join("");
```

**Why Deterministic?**
- Ensures both encryption and decryption use the same token
- No need to store or transmit the token separately
- Eliminates token synchronization issues

### 3. Session Key Derivation

Both sides derive the session key using the same process:

```typescript
// Location: client/src/lib/crypto/sessionKey.ts

// From Master Key (encryption side)
export async function deriveSessionKeyFromMaster(
  masterKey: CryptoKey,
  sessionId: string,  // deterministic token
  userId: string
): Promise<CryptoKey> {
  // 1. Generate fragment from master key
  const fragmentPlaintext = new TextEncoder().encode(`mediqr-fragment-${userId}`);
  // ... (fragment generation code)
  const fragmentBytes = new Uint8Array(encryptedFragment.slice(0, 16));
  
  // 2. Combine fragment + token
  const tokenBytes = new TextEncoder().encode(sessionId);
  const combined = new Uint8Array(fragmentBytes.length + tokenBytes.length);
  combined.set(fragmentBytes, 0);
  combined.set(tokenBytes, fragmentBytes.length);
  
  // 3. Hash to get key material
  const keyMaterialHash = await crypto.subtle.digest("SHA-256", combined);
  const keyMaterial = new Uint8Array(keyMaterialHash);
  
  // 4. Derive session key using PBKDF2
  const baseKey = await crypto.subtle.importKey("raw", keyMaterial, "PBKDF2", false, ["deriveKey"]);
  const saltInput = new TextEncoder().encode(`mediqr-session-salt-${userId}`);
  const saltHash = await crypto.subtle.digest("SHA-256", saltInput);
  const salt = new Uint8Array(saltHash.slice(0, 16));
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// From Fragment (decryption side)
export async function deriveSessionKeyFromFragment(
  fragment: string,  // hex string from QR
  token: string,     // deterministic token
  userId: string
): Promise<CryptoKey> {
  // 1. Convert fragment hex to bytes
  const fragmentBytes = new Uint8Array(
    fragment.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  
  // 2. Combine fragment + token (same as master key derivation)
  const tokenBytes = new TextEncoder().encode(token);
  const combined = new Uint8Array(fragmentBytes.length + tokenBytes.length);
  combined.set(fragmentBytes, 0);
  combined.set(tokenBytes, fragmentBytes.length);
  
  // 3. Hash to get key material (same process)
  const keyMaterialHash = await crypto.subtle.digest("SHA-256", combined);
  const keyMaterial = new Uint8Array(keyMaterialHash);
  
  // 4. Derive session key using PBKDF2 (same parameters)
  // ... (same PBKDF2 derivation as above)
}
```

**Key Parameters:**
- **PBKDF2 iterations**: 100,000 (security vs performance balance)
- **Salt**: Deterministic based on `userId` (`mediqr-session-salt-{userId}`)
- **Key length**: 256 bits (AES-256)
- **Algorithm**: AES-GCM (authenticated encryption)

### 4. Encryption Process

When a patient saves medical data:

```typescript
// Location: client/src/pages/Vault.tsx

const handleSubmit = async (category: Category) => {
  // 1. Generate fragment from master key
  const fragmentBytes = /* ... fragment generation ... */;
  
  // 2. Derive deterministic token
  const deterministicToken = /* ... token derivation ... */;
  
  // 3. Derive session key
  const sessionKey = await deriveSessionKeyFromMaster(
    masterKey,
    deterministicToken,
    userId
  );
  
  // 4. Encrypt with session key
  const { encrypted, iv } = await encryptDataToBase64(sessionKey, jsonData);
  
  // 5. Store encrypted blob
  await syncVault(userId, category, encrypted, iv);
};
```

### 5. Decryption Process

When staff scans a QR code and accesses patient records:

```typescript
// Location: client/src/pages/StaffPatientView.tsx

const loadAndDecryptRecords = async (data: PatientData) => {
  // 1. Get fragment from QR code
  const fragmentBytes = new Uint8Array(
    data.fragment.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  
  // 2. Derive deterministic token (same as encryption side)
  const tokenMaterial = await crypto.subtle.digest("SHA-256", fragmentBytes);
  const deterministicToken = /* ... token derivation ... */;
  
  // 3. Derive session key
  const decryptionKey = await deriveSessionKeyFromFragment(
    data.fragment,
    deterministicToken,
    data.patientId
  );
  
  // 4. Decrypt each blob
  for (const blob of data.blobs) {
    const encryptedBase64 = /* fetch blob */;
    const decryptedData = await decryptDataFromBase64(
      decryptionKey,
      encryptedBase64,
      blob.iv
    );
  }
};
```

## Security Considerations

### 1. Master Key Protection

- **Master key never leaves the patient's device**
- Fragment is a one-way derivation (cannot reverse to master key)
- Session keys are ephemeral (derived per encryption operation)

### 2. Token Security

- Deterministic token is derived from fragment (not stored or transmitted)
- No token rotation needed (eliminates synchronization issues)
- Token is only used for key derivation, not authentication

### 3. Key Derivation Security

- **PBKDF2 with 100,000 iterations**: Resistant to brute-force attacks
- **Deterministic salt**: Based on userId (ensures consistency)
- **SHA-256 hashing**: Cryptographically secure hash function

### 4. Encryption Security

- **AES-256-GCM**: Authenticated encryption (prevents tampering)
- **Unique IV per encryption**: Stored with each blob
- **Session keys**: Different key per encryption (forward secrecy)

## Limitations

### 1. Break-Glass Access

Break-glass (emergency) access cannot decrypt records because:
- Emergency access provides blob URLs but not the QR token
- Decryption requires the fragment (from QR) + deterministic token
- This is an intentional security limitation

**Workaround**: Emergency responders can still access blob URLs, but decryption requires the patient's QR code.

### 2. Legacy Data

Data encrypted with the master key directly (before session-key implementation) cannot be decrypted by staff. Only new data encrypted with session keys can be decrypted.

**Migration**: Consider re-encrypting legacy data with session keys if staff access is required.

### 3. Token Independence

The deterministic token is independent of the backend QR token system. This means:
- QR tokens can still be used for authentication/authorization
- But decryption uses the deterministic token (not the QR token)
- This separation is intentional for security

## Testing

To verify the implementation works:

1. **Save new data**: Patient saves a new medical record
2. **Generate QR**: Patient generates QR code
3. **Scan QR**: Staff scans QR code
4. **Verify decryption**: Staff should be able to decrypt the newly saved record

**Expected behavior:**
- ✅ New data (encrypted with session key) → Decrypts successfully
- ❌ Old data (encrypted with master key) → Decryption fails (expected)

## Code Locations

### Core Implementation

- **Session Key Derivation**: `client/src/lib/crypto/sessionKey.ts`
- **Encryption**: `client/src/pages/Vault.tsx` (handleSubmit)
- **Decryption**: `client/src/pages/StaffPatientView.tsx` (loadAndDecryptRecords)
- **Fragment Generation**: `client/src/components/QRGenerator.tsx`

### Supporting Files

- **AES Utilities**: `client/src/lib/crypto/aes.ts`
- **QR Key Derivation**: `client/src/lib/crypto/qrKeyDerivation.ts` (wrapper)
- **Crypto Context**: `client/src/contexts/CryptoProvider.tsx`

## Future Improvements

1. **Re-encryption Service**: Migrate legacy data to session-key encryption
2. **Key Rotation**: Implement session key rotation for forward secrecy
3. **Performance**: Cache derived session keys (with appropriate invalidation)
4. **Audit Logging**: Log successful/failed decryption attempts
5. **Error Handling**: Better error messages for decryption failures

## References

- [Phase 2 Implementation](./Phase2-Implementation.md) - Initial encryption architecture
- [Phase 3 Implementation](./Phase3-Implementation.md) - QR token system
- [AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [PBKDF2 Specification](https://datatracker.ietf.org/doc/html/rfc2898)

