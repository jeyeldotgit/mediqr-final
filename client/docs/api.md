# MediQR Client API Documentation

## Overview

The MediQR client uses a modular service-based architecture for API communication. All services are located in `src/services/` and provide typed functions for backend communication.

**Base URL:** Configured via `VITE_API_URL` environment variable (default: `http://localhost:4000/api`)

---

## API Client

The base API client is located in `src/services/apiClient.ts` and provides a shared fetch wrapper with error handling and authentication.

### Configuration

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";
```

### Base Request Function

```typescript
import { apiRequest } from "./apiClient";

// All services use this base function
const result = await apiRequest<ResponseType>("/endpoint", {
  method: "POST",
  body: JSON.stringify(data),
});
```

**Features:**

- Automatic `x-user-id` header injection from storage
- Network error handling with descriptive messages
- JSON parsing with error extraction

---

## Service Modules

### Authentication Service (`authService.ts`)

Handles user profile initialization and authentication.

#### `initProfile(publicKey, hashedIdentifier)`

Initialize a user profile after onboarding completion.

```typescript
import { initProfile } from "../services/authService";

const result = await initProfile(publicKey, hashedIdentifier);
// Returns: { success: boolean; userId: string; message: string }
```

---

### Vault Service (`vaultService.ts`)

Handles encrypted vault data operations with offline fallback support.

#### `syncVault(ownerId, category, encryptedData, iv)`

Sync encrypted vault data to server.

```typescript
import { syncVault } from "../services/vaultService";

const result = await syncVault(userId, "identity", encryptedBlob, iv);
// Returns: { success: boolean; blobId: string; storagePath: string; message: string }
```

#### `getVaultItems(ownerId)`

Get all vault items for an owner (metadata only). Falls back to offline vault if online fetch fails.

```typescript
import { getVaultItems } from "../services/vaultService";

const result = await getVaultItems(userId);
// Returns: { success: boolean; items: VaultItem[]; count: number }
```

---

### QR Service (`qrService.ts`)

Handles QR token rotation for patient identification.

#### `rotateQRToken(ownerId)`

Get a new short-lived access token for QR code generation.

```typescript
import { rotateQRToken } from "../services/qrService";

const result = await rotateQRToken(userId);
// Returns: { success: boolean; qrToken: string; expiresIn: string; message: string }
```

---

### Staff Service (`staffService.ts`)

Handles staff authentication and patient record access.

#### `staffAuth(data)`

Authenticate a staff member.

```typescript
import { staffAuth } from "../services/staffService";

const result = await staffAuth({
  email: "doctor@hospital.com",
  password: "secure123",
  role: "doctor", // "doctor" | "paramedic" | "er_admin"
});
// Returns: { success: boolean; token: string; staffId: string; role: string; isNewUser: boolean; message: string }
```

#### `recordAccess(data, staffToken)`

Access patient records using QR token.

```typescript
import { recordAccess } from "../services/staffService";

const result = await recordAccess(
  { qrToken: "token123", patientId: "patient-uuid" },
  staffJwtToken
);
// Returns: { success: boolean; patientId: string; staffId: string; staffRole: string; blobs: BlobAccess[]; count: number; message: string }
```

---

### Recovery Service (`recoveryService.ts`)

Handles social recovery shard management.

#### `createRecoveryShards(request)`

Create and store multiple recovery shards.

```typescript
import { createRecoveryShards } from "../services/recoveryService";

const result = await createRecoveryShards({
  shards: [
    { guardianId: null, encryptedShard: "..." }, // Backup shard
    { guardianId: "guardian-uuid", encryptedShard: "..." },
  ],
});
// Returns: { success: boolean; shardIds: string[]; message: string }
```

#### `storeGuardianShard(request)`

Store a single guardian shard.

```typescript
import { storeGuardianShard } from "../services/recoveryService";

const result = await storeGuardianShard({
  guardianId: "guardian-uuid",
  encryptedShard: "encrypted-shard-data",
});
// Returns: { success: boolean; shardId: string; message: string }
```

#### `getRecoveryShards()`

Get all recovery shards for the current user.

```typescript
import { getRecoveryShards } from "../services/recoveryService";

const result = await getRecoveryShards();
// Returns: { success: boolean; shards: RecoveryShard[] }
```

#### `getShardById(shardId)`

Get a specific shard by ID.

#### `deleteRecoveryShard(shardId)`

Delete a recovery shard.

---

### Guardian Service (`guardianService.ts`)

Handles guardian relationship management.

#### `searchUsers(query)`

Search for users to add as guardians.

```typescript
import { searchUsers } from "../services/guardianService";

const result = await searchUsers({ email: "guardian@example.com" });
// Returns: { success: boolean; users: Array<{ id: string; role: string; publicKey?: string }> }
```

#### `getGuardians()`

Get all guardians for the current user.

```typescript
import { getGuardians } from "../services/guardianService";

const guardians = await getGuardians();
// Returns: Guardian[]
```

---

### Emergency Service (`emergencyService.ts`)

Handles break-glass emergency access.

#### `requestBreakGlass(request)`

Request emergency break-glass access to patient records. Requires `er_admin` role.

```typescript
import { requestBreakGlass } from "../services/emergencyService";

const result = await requestBreakGlass({
  patientId: "patient-uuid",
  justification: "Emergency admission - unconscious patient",
});
// Returns: { success: boolean; patientId: string; staffId: string; staffRole: string; blobs: BlobAccess[]; count: number; method: "BREAK_GLASS"; justification: string; message: string }
```

---

### Offline Vault Service (`offlineVaultService.ts`)

Handles storing and retrieving encrypted vault data for offline use.

#### `downloadOfflineVault()`

Download and store vault data for offline use.

```typescript
import { downloadOfflineVault } from "../services/offlineVaultService";

const offlineVault = await downloadOfflineVault();
// Returns: OfflineVaultData
```

#### `getOfflineVault()`

Get stored offline vault data.

#### `hasRecentOfflineVault()`

Check if offline vault exists and is recent (within 7 days).

#### `clearOfflineVault()`

Clear offline vault data.

#### `getOfflineVaultSize()`

Get offline vault size estimate in bytes.

---

## Type Definitions

Types are centralized in `src/types/` and exported via barrel file.

```typescript
import type {
  VaultCategory,
  VaultItem,
  VaultBlob,
  PatientData,
  DecryptedRecord,
} from "../types";
```

### Vault Types (`vault.types.ts`)

```typescript
type VaultCategory = "identity" | "allergies" | "medications" | "records";

interface VaultItem {
  id: string;
  category: VaultCategory;
  updated_at: string;
  storage_path: string;
}

interface VaultBlob {
  id: string;
  category: string;
  storagePath: string;
  iv: string;
  updatedAt: string;
  signedUrl: string | null;
  error?: string;
}
```

### Patient Types (`patient.types.ts`)

```typescript
type AccessMethod = "QR_SCAN" | "BREAK_GLASS";

interface PatientData {
  patientId: string;
  blobs: VaultBlob[];
  fragment: string;
  token?: string;
  accessMethod?: AccessMethod;
  justification?: string;
}

interface DecryptedRecord {
  id: string;
  category: string;
  data: Record<string, unknown> | { error: string; message?: string };
  updatedAt: string;
}
```

---

## Error Handling

All services throw errors that should be caught and handled:

```typescript
try {
  const result = await someService();
} catch (error) {
  if (error instanceof Error) {
    // Network errors: "Network error: Unable to reach server..."
    // HTTP errors: "HTTP 500" or server error message
    console.error(error.message);
  }
}
```

**Common Error Messages:**

- `"Network error: Unable to reach server..."` - Server unreachable
- `"Validation failed"` - Invalid request parameters
- `"Staff authentication required"` - Missing staff token
- `"HTTP 500"` - Server error

---

## Environment Variables

### Development

Create a `.env` file in the `client/` directory:

```bash
VITE_API_URL=http://localhost:4000/api
```

### Production

```bash
VITE_API_URL=https://api.mediqr.com/api
```

---

## Service Architecture

```
src/services/
├── apiClient.ts          # Base API client with shared config
├── authService.ts        # Authentication & profile management
├── vaultService.ts       # Vault CRUD operations
├── qrService.ts          # QR token management
├── staffService.ts       # Staff auth & record access
├── recoveryService.ts    # Social recovery shards
├── guardianService.ts    # Guardian relationships
├── emergencyService.ts   # Break-glass access
├── offlineVaultService.ts # Offline vault storage
└── README.md             # Service documentation
```

### Service Pattern

All services follow a consistent pattern:

```typescript
import { apiRequest } from "./apiClient";

export interface MyRequest {
  /* ... */
}
export interface MyResponse {
  /* ... */
}

export async function myServiceFunction(data: MyRequest): Promise<MyResponse> {
  return apiRequest<MyResponse>("/endpoint", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

---

## See Also

- [Client Architecture](./architecture.md)
- [Services README](../src/services/README.md)
- [Server API Documentation](../../server/docs/api.md)
