# MediQR Server API Documentation

## Overview

The MediQR backend API is a Zero-Knowledge "Blind Postman" that routes encrypted data between clients and Supabase. The server never sees plaintext PHI (Protected Health Information) and only handles encrypted blobs and metadata.

**Base URL:** `http://localhost:4000/api` (development)

All endpoints return JSON responses.

---

## Authentication

The API uses a combination of Supabase Auth (service role) and JWTs:

- **Citizens**

  - Profiles are initialized via `POST /auth/init` using the Supabase service role key.
  - Citizens authenticate on the client with their mnemonic; the server never sees their keys or plaintext data.

- **Staff**

  - Staff authenticate via `POST /staff/auth` with email/password and role.
  - On success, the server issues a **staff JWT** that must be sent in the `Authorization: Bearer <token>` header to protected endpoints.

- **QR Tokens**
  - Citizens request short‑lived QR access tokens via `POST /qr/rotate`.
  - These tokens are embedded in QR codes and verified when staff access a patient’s records.

---

## Endpoints

### Health Check

#### `GET /health`

Simple health check endpoint for uptime monitoring and load balancers.

**Response:**

```json
{
  "status": "ok",
  "service": "mediqr-server"
}
```

**Status Codes:**

- `200 OK` – Service is healthy

---

### Identity & Authentication (Citizens)

#### `POST /auth/init`

Initialize a new citizen profile with public key and hashed identifier. This endpoint creates a user in Supabase Auth and then creates the corresponding profile record.

**Request Body:**

```json
{
  "publicKey": "string",
  "hashedIdentifier": "string"
}
```

**Request Schema:**

- `publicKey` (string, required): Public key derived from the user's mnemonic phrase
- `hashedIdentifier` (string, required): SHA-256 hash of the mnemonic phrase used as a non-identifying identifier

**Response (Success):**

```json
{
  "success": true,
  "userId": "uuid",
  "message": "Profile initialized successfully"
}
```

**Response (Error):**

```json
{
  "error": "Failed to create auth user",
  "details": "Error message",
  "hint": "Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly..."
}
```

**Status Codes:**

- `201 Created` – Profile created successfully
- `400 Bad Request` – Validation error (missing or invalid fields)
- `500 Internal Server Error` – Server error (database, auth creation failure, etc.)

**Example Request:**

```bash
curl -X POST http://localhost:4000/api/auth/init \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "abc123...",
    "hashedIdentifier": "def456..."
  }'
```

**Notes:**

- This endpoint uses the Supabase **service role** key on the backend.
- Creates a user in `auth.users` and a corresponding profile in `profiles`.
- The user ID is a UUID generated server-side.
- A temporary email is derived from the hashed identifier for Phase 1.

---

### Staff Authentication

#### `POST /staff/auth`

Authenticate a staff member (doctor, paramedic, ER admin) and issue a JWT.

**Request Body:**

```json
{
  "email": "doctor@example.com",
  "password": "string",
  "role": "doctor | paramedic | er_admin"
}
```

**Response (Success):**

```json
{
  "success": true,
  "token": "jwt-token",
  "staffId": "uuid",
  "role": "doctor",
  "isNewUser": false,
  "message": "Staff authenticated successfully"
}
```

**Status Codes:**

- `200 OK` – Authenticated successfully
- `400 Bad Request` – Validation failed
- `403 Forbidden` – Role mismatch
- `500 Internal Server Error` – Auth or profile creation failure

Use the returned `token` in the `Authorization` header:

```http
Authorization: Bearer <token>
```

---

### Vault Management

#### `POST /vault/sync`

Accept an encrypted blob and persist it to Supabase Storage plus metadata in `medical_blobs`.

**Request Body (simplified):**

```json
{
  "ownerId": "uuid",
  "category": "identity | allergies | medications | records",
  "encryptedData": "base64-string",
  "iv": "base64-iv"
}
```

**Response (Success):**

```json
{
  "success": true,
  "blobId": "uuid",
  "storagePath": "vault/abcd1234/....enc",
  "message": "Vault item synced successfully"
}
```

**Status Codes:**

- `201 Created` – Blob stored successfully
- `400 Bad Request` – Validation failed
- `404 Not Found` – Owner profile not found
- `500 Internal Server Error` – Storage or metadata failure

---

#### `GET /vault/:ownerId`

Fetch metadata for all vault items for a specific owner (no PHI content).

If Supabase is unreachable (e.g. offline), the endpoint returns:

```json
{
  "error": "Service unavailable",
  "details": "Unable to connect to database. Please try again later or use offline mode.",
  "offline": true
}
```

---

#### `GET /vault/:ownerId/offline`

Fetch vault items with **signed URLs** for offline access (24‑hour expiry).

**Response (Success):**

```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "category": "records",
      "storagePath": "vault/abcd1234/....enc",
      "iv": "base64-iv",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "signedUrl": "https://...supabase.../vault/..."
    }
  ],
  "count": 1
}
```

---

### QR & Record Access

#### `POST /qr/rotate`

Issue a short‑lived QR access token for a citizen owner.

**Request Body:**

```json
{
  "ownerId": "uuid"
}
```

**Response (Success):**

```json
{
  "success": true,
  "qrToken": "jwt-token",
  "expiresIn": "1h",
  "message": "QR token generated successfully"
}
```

---

#### `POST /record/access`

Validate **staff JWT + patient QR token**, then return storage references and signed URLs for encrypted blobs. Also logs a `QR_SCAN` entry in `access_logs`.

**Headers:**

- `Authorization: Bearer <staff-token>`

**Request Body (simplified):**

```json
{
  "qrToken": "string",
  "patientId": "uuid"
}
```

**Response (Success, simplified):**

```json
{
  "success": true,
  "patientId": "uuid",
  "staffId": "uuid",
  "blobs": [
    {
      "id": "uuid",
      "category": "records",
      "storagePath": "vault/abcd1234/....enc",
      "iv": "base64-iv",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "signedUrl": "https://...supabase.../vault/..."
    }
  ],
  "count": 1
}
```

---

### Social Recovery & Guardians

#### `POST /recovery/shards`

Create and persist social recovery shards for a user (2‑of‑3 scheme).

#### `GET /recovery/shards`

List recovery shards.

#### `GET /recovery/shards/:shardId`

Fetch a single recovery shard by ID.

#### `DELETE /recovery/shards/:shardId`

Delete a recovery shard.

#### `POST /social/shard`

Store a guardian's encrypted shard in PostgreSQL.

#### `POST /guardians/search`

Search for potential guardians by criteria (e.g. email or identifier).

---

### Emergency Break‑Glass

#### `POST /emergency/break-glass`

Emergency break‑glass access for ER admins.

**Headers:**

- `Authorization: Bearer <staff-token>`

**Request Body (simplified):**

```json
{
  "patientId": "uuid",
  "justification": "string"
}
```

**Behavior:**

1. Verifies staff JWT and requires `role === "er_admin"`.
2. Validates patient ID and justification.
3. Returns signed URLs for all blobs for the patient.
4. Writes a `BREAK_GLASS` entry into `access_logs` with justification.

---

## Error Handling

All endpoints follow a structured JSON error pattern.

Common patterns:

- Validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "email",
      "message": "Invalid email address",
      "code": "invalid_string"
    }
  ]
}
```

- Authentication / authorization errors:

```json
{
  "error": "Unauthorized",
  "details": "Staff JWT token required in Authorization header"
}
```

Common status codes:

- `400` – Bad Request (validation errors)
- `401` – Unauthorized (authentication required)
- `403` – Forbidden (insufficient permissions or role mismatch)
- `404` – Not Found
- `429` – Too Many Requests (rate limiting)
- `500` – Internal Server Error

---

## Rate Limiting

Rate limiting is implemented in `src/middleware/rateLimiter.ts`:

- **Global API limiter** – applied to all `/api` routes  
  100 requests per 15 minutes per IP.
- **Auth limiter** – for `/auth/init` and `/staff/auth`  
  5 attempts per 15 minutes keyed by email (or IP).
- **Vault limiter** – for `/vault/sync` and `/vault/:ownerId*`  
  20 requests per minute.
- **QR rotate limiter** – for `/qr/rotate`  
  10 rotations per hour keyed by `ownerId`/IP.
- **Emergency limiter** – for `/emergency/break-glass`  
  3 attempts per hour per staff member (approx., keyed by Authorization header).

---

## Security Considerations

1. **Service Role Key**: The backend uses the Supabase service role key to bypass RLS. This key must be kept secret and never exposed to clients.
2. **Zero-Knowledge**: The server never sees plaintext PHI. All sensitive data is encrypted client-side before transmission.
3. **Input Validation**: All inputs are validated using Zod schemas and/or controller‑level `safeParse` calls.
4. **Security Headers**: CSP, X‑Frame‑Options, X‑Content-Type-Options, X‑XSS-Protection, Referrer-Policy, and Permissions-Policy are set in `src/app.ts`.
5. **Structured Logging**: `src/lib/logger.ts` writes JSON logs with PHI‑like fields stripped from metadata before logging.

---

## Environment Variables

Required environment variables for the server:

- `SUPABASE_URL` – Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (bypasses RLS)
- `PORT` – Server port (default: 4000)
- `NODE_ENV` – Environment (development/production)
- `ALLOWED_ORIGINS` – Comma‑separated list of allowed frontend origins (for CORS)

---

## See Also

- [Architecture Documentation](./architecture.md)
- [Final Plan](../../docs/FinalPlan.md)
