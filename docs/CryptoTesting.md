## Crypto Testing Overview

This document explains how the client‑side cryptography tests are structured, what they cover, and how they relate to the design described in `Decryption.md`.

### Scope

- **AES primitives**: `client/src/lib/crypto/aes.ts`
  - Low‑level AES‑256‑GCM encrypt/decrypt helpers (`encryptData`, `decryptData`)
  - Base64 helpers used for storage and transport (`encryptDataToBase64`, `decryptDataFromBase64`)
- **Key derivation**: `client/src/lib/crypto/keyDerivation.ts`
  - Master Encryption Key (MEK) from mnemonic using PBKDF2
- **Shamir’s Secret Sharing**: `client/src/lib/crypto/shamir.ts`
  - Splitting and reconstructing the MEK into guardian shards

All tests live under `client/src/lib/crypto/__tests__`.

## Test Files

### `aes.test.ts` – AES Encryption/Decryption

**Goal**: Prove that AES‑GCM + base64 helpers are symmetric and robust for the kinds of payloads used in the app.

Covered behaviors:

- **Round‑trip plaintext**  
  - Encrypt and decrypt a string using the base64 helpers.
  - Ensures IV encoding/decoding and ciphertext handling are correct.

- **Low‑level helpers**  
  - Directly calls `encryptData` and `decryptData` with a generated AES‑GCM key.
  - Confirms that raw `ArrayBuffer`/`Uint8Array` flows work without base64.

- **IV uniqueness and ciphertext diversity**  
  - Encrypts the same plaintext twice and asserts:
    - IVs differ.
    - Ciphertexts differ.
  - Guards against accidental IV reuse, which would break GCM security.

- **JSON payloads**  
  - Encrypts a JSON string and verifies that decryption parses back to the original object.

- **Failure modes**  
  - Decryption with wrong key must fail.
  - Decryption with wrong IV must fail.

- **Edge cases**  
  - Empty string round‑trips correctly via low‑level AES.
  - Long text (e.g. 1000 characters) round‑trips correctly via base64 helpers.

Relation to `Decryption.md`:

- These tests validate the **AES layer** that the session‑key scheme builds on.
- If these tests are green, any decryption failures in the app are likely due to key derivation or token/fragment mismatches, not the AES primitives.

### `keyDerivation.test.ts` – Master Key Derivation

**Goal**: Ensure mnemonic → MEK derivation is deterministic and produces valid AES‑256‑GCM keys.

Covered behaviors:

- **Determinism**  
  - Same mnemonic → same derived key (verified via identical ciphertext for same IV + plaintext).

- **Separation**  
  - Different mnemonics → different keys (verified by different ciphertext under same IV + plaintext).

- **Key shape**  
  - Algorithm name is `AES-GCM`.
  - Key length is 256 bits.
  - Usages include both `encrypt` and `decrypt`.

Relation to `Decryption.md`:

- This is the **MEK layer** used before fragment/session‑key derivation.
- Guarantees that mnemonic handling is stable and safe to build session keys on top of.

### `shamir.test.ts` – Shamir’s Secret Sharing

**Goal**: Validate the 2‑of‑3 guardian shard scheme against both correctness and randomness expectations.

Covered behaviors:

- **Correct reconstruction (2‑of‑3)**  
  - Splits a test MEK into 3 shards.
  - Reconstructs using any 2 shards and confirms the reconstructed key can decrypt data encrypted with the original key.

- **Insufficient shares fail**  
  - Attempts reconstruction with 1 shard and expects failure.

- **Different keys → different shares**  
  - Two different MEKs produce different shard sets.

- **Randomness vs determinism**  
  - Two runs of `splitMEKIntoShards` for the same key should produce either:
    - Different shard strings (preferred), or
    - Identical shards in a deterministic implementation (still acceptable, but both must reconstruct the same key and decrypt correctly).

Relation to `Decryption.md`:

- This corresponds to the **social recovery / guardians** layer, ensuring MEK shards are safe to use for recovery without breaking confidentiality.

## How This Connects to Session‑Key Decryption

The session‑key scheme in `Decryption.md` builds on top of these primitives:

- **MEK from mnemonic** → tested in `keyDerivation.test.ts`.
- **Fragment + deterministic token → session key** → uses the same AES helpers as in `aes.test.ts`.
- **Guardian shards of MEK** → tested in `shamir.test.ts`.

If all three test suites pass:

- The app can trust:
  - MEK derivation to be stable.
  - Session keys to work correctly with AES‑GCM.
  - Guardian shards to reconstruct the correct MEK when threshold is met.

## How to Run the Tests

- From the `client` directory:

```bash
npm test
```

Vitest will run all crypto tests (and any other client tests) under `src/lib/crypto/__tests__`.

## Adding New Crypto Tests

When adding new tests:

- **Mirror real flows** described in `Decryption.md`:
  - For example, add integration‑style tests that:
    - Derive a MEK from a mnemonic.
    - Derive a session key from fragment + token.
    - Encrypt and decrypt a sample medical record JSON.
- **Test failure modes explicitly**:
  - Wrong fragment, wrong token, or wrong patientId should all fail decryption.
- **Keep tests deterministic**:
  - Use fixed IVs only when comparing ciphertexts for equality.
  - Use random IVs when validating uniqueness properties.

Place new tests under `client/src/lib/crypto/__tests__` and prefer small, focused `describe` blocks that match the architecture layers in `Decryption.md`.


