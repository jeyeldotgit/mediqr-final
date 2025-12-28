# Services

This directory contains service modules that handle API communication with the backend.

## Structure

- **`apiClient.ts`** - Base API client with shared configuration and error handling
- **`authService.ts`** - Authentication and profile management
- **`vaultService.ts`** - Vault operations (encrypted blob storage)

## Usage

Import services from their respective modules:

```typescript
import { initProfile } from "../services/authService";
import { syncVault, getVaultItems } from "../services/vaultService";
```

## Adding New Services

1. Create a new service file (e.g., `qrService.ts`)
2. Import `apiRequest` from `apiClient.ts`
3. Define TypeScript interfaces for requests/responses
4. Export service functions

Example:

```typescript
import { apiRequest } from "./apiClient";

export interface MyServiceRequest {
  // ...
}

export interface MyServiceResponse {
  // ...
}

export async function myServiceFunction(
  data: MyServiceRequest
): Promise<MyServiceResponse> {
  return apiRequest<MyServiceResponse>("/my-endpoint", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

