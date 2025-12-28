# MediQR Server API Documentation

## Overview

The MediQR backend API is a Zero-Knowledge "Blind Postman" that routes encrypted data between clients and Supabase. The server never sees plaintext PHI (Protected Health Information) and only handles encrypted blobs and metadata.

**Base URL:** `http://localhost:4000/api` (development)

All endpoints return JSON responses.

---

## Authentication

Currently, the API uses service role authentication for Phase 1. In future phases, JWT-based authentication will be implemented for citizens and staff.

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

- `200 OK` - Service is healthy

---

### Identity & Authentication

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

- `201 Created` - Profile created successfully
- `400 Bad Request` - Validation error (missing or invalid fields)
- `500 Internal Server Error` - Server error (database, auth creation failure, etc.)

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

- This endpoint requires the service role key to bypass RLS policies
- Creates a user in `auth.users` first, then creates the profile in `profiles` table
- The user ID is a UUID generated server-side
- For Phase 1, a temporary email is generated from the hashed identifier

---

## Planned Endpoints (Future Phases)

### Vault Management

#### `POST /vault/sync`

Accept encrypted JSON/PDF blobs and persist them to Supabase Storage.

#### `GET /vault/:id`

Fetch encrypted blob by ID (after token and RBAC validation).

#### `POST /record/access`

Validate Staff JWT + Patient QR token, then return storage reference to encrypted blob.

### Social Recovery

#### `POST /recovery/shards`

Create/distribute encrypted SSS shards to guardian IDs and Supabase backup.

#### `POST /social/shard`

Store guardian's encrypted shard in PostgreSQL.

### QR & Emergency Workflows

#### `POST /qr/rotate`

Issue or update the temporary access token for the user's MediQR.

#### `POST /emergency/break-glass`

Log emergency override access, release necessary blobs, notify guardians.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error type",
  "details": "Detailed error message",
  "code": "Error code (if applicable)"
}
```

**Common Error Codes:**

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Rate limiting will be implemented in future phases to prevent abuse.

---

## Security Considerations

1. **Service Role Key**: The backend uses the Supabase service role key to bypass RLS. This key must be kept secret and never exposed to clients.

2. **Zero-Knowledge**: The server never sees plaintext PHI. All sensitive data is encrypted client-side before transmission.

3. **Input Validation**: All inputs are validated using Zod schemas before processing.

4. **Error Messages**: Error messages are sanitized to avoid leaking sensitive information.

---

## Environment Variables

Required environment variables for the server:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (bypasses RLS)
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)

---

## See Also

- [Architecture Documentation](./architecture.md)
- [Final Plan](../../docs/FinalPlan.md)
