# MediQR Client API Documentation

## Overview

The MediQR client uses a simple fetch-based API client to communicate with the backend server. All API calls are made from the client-side React application.

**Base URL:** Configured via `VITE_API_URL` environment variable (default: `http://localhost:4000/api`)

---

## API Client

The API client is located in `src/lib/api.ts` and provides typed functions for backend communication.

### Configuration

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
```

Set `VITE_API_URL` in your `.env` file to configure the API endpoint.

---

## Available Functions

### `initProfile(publicKey: string, hashedIdentifier: string)`

Initialize a user profile after onboarding completion.

**Parameters:**
- `publicKey` (string): Public key derived from the user's mnemonic phrase
- `hashedIdentifier` (string): SHA-256 hash of the mnemonic phrase

**Returns:** `Promise<{ success: boolean; userId: string; message: string }>`

**Throws:** `Error` if the request fails

**Example:**
```typescript
import { initProfile } from "../lib/api";
import { derivePublicKey, hashIdentifier } from "../lib/crypto/identifier";

const mnemonic = "word1 word2 ... word12";
const publicKey = await derivePublicKey(mnemonic);
const hashedId = await hashIdentifier(mnemonic);

try {
  const result = await initProfile(publicKey, hashedId);
  console.log("Profile created:", result.userId);
} catch (error) {
  console.error("Failed to create profile:", error);
}
```

**Error Handling:**
```typescript
try {
  await initProfile(publicKey, hashedId);
} catch (error) {
  // error.message contains the error details
  if (error.message.includes("Validation failed")) {
    // Handle validation error
  } else if (error.message.includes("Failed to create")) {
    // Handle creation error
  }
}
```

---

## Usage in Components

### Onboarding Flow

The `initProfile` function is called automatically during the onboarding process:

```typescript
// In Onboarding.tsx
const publicKey = await derivePublicKey(phrase);
const hashedId = await hashIdentifier(phrase);

try {
  await initProfile(publicKey, hashedId);
  // Profile created successfully
} catch (apiError) {
  // Handle error - user can retry later
  console.error("Failed to initialize profile:", apiError);
}
```

---

## Error Handling

All API functions throw errors that should be caught and handled:

```typescript
try {
  const result = await initProfile(publicKey, hashedId);
} catch (error) {
  // error is an Error object
  // error.message contains the error message from the server
  // Check error.message for specific error types
}
```

**Common Error Messages:**
- `"Validation failed"` - Invalid request parameters
- `"Failed to create auth user"` - User creation failed
- `"Failed to create profile"` - Profile creation failed
- `"HTTP 500"` - Server error

---

## Future API Functions

As more endpoints are implemented, additional functions will be added:

### Planned Functions

```typescript
// Vault Management
syncVault(encryptedBlob: string, category: string): Promise<VaultResponse>
getVaultItem(id: string): Promise<EncryptedBlob>

// QR Management
rotateQRToken(): Promise<QRToken>
generateQRCode(): Promise<QRData>

// Social Recovery
createRecoveryShards(guardians: string[]): Promise<ShardResponse>
storeGuardianShard(guardianId: string, shard: string): Promise<void>

// Emergency Access
requestBreakGlass(reason: string): Promise<AccessResponse>
```

---

## Environment Variables

### Development
Create a `.env` file in the `client/` directory:

```bash
VITE_API_URL=http://localhost:4000/api
```

### Production
Set `VITE_API_URL` to your production API endpoint:

```bash
VITE_API_URL=https://api.mediqr.com/api
```

---

## Type Safety

The API client uses TypeScript for type safety. All functions are typed, and responses match the server's JSON schema.

**Current Types:**
```typescript
interface InitProfileResponse {
  success: boolean;
  userId: string;
  message: string;
}
```

---

## Network Considerations

### CORS
The backend must be configured to allow requests from the client origin. In development, this is typically handled automatically.

### Timeout
Currently, there's no timeout configured. For production, consider adding request timeouts:

```typescript
// Future enhancement
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

fetch(url, { signal: controller.signal })
  .then(response => {
    clearTimeout(timeoutId);
    return response.json();
  });
```

---

---

## Service Structure

Services are organized by domain for better maintainability:

```
src/services/
├── apiClient.ts      # Base API client
├── authService.ts    # Authentication
├── vaultService.ts   # Vault operations
└── README.md         # Service documentation
```

### Adding New Services

See `src/services/README.md` for guidelines on creating new services.

---

## See Also

- [Server API Documentation](../../server/docs/api.md)
- [Client Architecture](./architecture.md)
- [Services README](../src/services/README.md)
- [Crypto Utilities](../src/lib/crypto/README.md)

