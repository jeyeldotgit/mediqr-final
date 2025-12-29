# MediQR Server Architecture

## Overview

The MediQR backend is an Express + TypeScript API that acts as a **Zero-Knowledge "Blind Postman"** between clients and Supabase. The server routes encrypted data but never sees plaintext PHI (Protected Health Information).

---

## Core Principles

### Zero-Knowledge Architecture

The server operates under a strict zero-knowledge model:

- ✅ **Can do:**

  - Route encrypted blobs between clients and storage
  - Authenticate and authorize requests
  - Manage access tokens and QR rotation
  - Maintain audit logs
  - Enforce RBAC policies and rate limits

- ❌ **Cannot do:**
  - Derive encryption keys
  - Decrypt medical data
  - Inspect PHI content
  - Read plaintext health records

### Blind Postman Analogy

The server is like a postman who can:

- Deliver sealed envelopes (encrypted blobs)
- Read addresses (metadata)
- Verify delivery permissions (authentication)
- Log deliveries (audit trails)

But cannot:

- Open envelopes (decrypt data)
- Read letters (access PHI)

---

## System Architecture

```text
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ HTTPS
       │ (Encrypted Blobs + JWTs)
       ▼
┌─────────────┐
│   Server    │
│  (Express)  │
└──────┬──────┘
       │ Service Role (Supabase)
       ▼
┌─────────────┐
│  Supabase   │
│ PostgreSQL  │
│  + Storage  │
└─────────────┘
```

---

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Validation:** Zod
- **Authentication:**
  - Supabase Auth (service role) for citizen profile initialization
  - Custom JWTs for staff and QR tokens (`src/lib/jwt.ts`)
- **Rate Limiting:** Custom in‑memory limiter (`src/middleware/rateLimiter.ts`)
- **Logging:** Structured JSON logging (`src/lib/logger.ts`)

---

## Project Structure

```text
server/
├── src/
│   ├── app.ts              # Express app configuration (CORS, security headers, rate limiters)
│   ├── index.ts            # Application entry point
│   ├── config/
│   │   └── supabase.ts     # Supabase client configuration
│   ├── controllers/        # Request handlers
│   │   ├── authController.ts
│   │   ├── staffController.ts
│   │   ├── vaultController.ts
│   │   ├── qrController.ts
│   │   ├── recordController.ts
│   │   ├── recoveryController.ts
│   │   ├── guardianController.ts
│   │   └── emergencyController.ts
│   ├── routes/
│   │   └── index.ts        # Route definitions and per‑route rate limiting
│   ├── schemas/            # Zod validation schemas
│   │   ├── auth.ts
│   │   ├── vault.ts
│   │   ├── qr.ts
│   │   ├── emergency.ts
│   │   └── recovery.ts
│   ├── middleware/         # Express middleware
│   │   ├── rateLimiter.ts  # Global + per‑route rate limiting
│   │   ├── inputValidation.ts # Zod validation + sanitization helpers
│   │   ├── auditLog.ts     # Access logging into access_logs
│   │   └── errorHandler.ts # 404 + error handler using structured logger
│   ├── lib/
│   │   ├── jwt.ts          # Staff and QR token helpers
│   │   └── logger.ts       # PHI‑safe structured logging
│   ├── db/
│   │   └── migrations/     # Database migrations
│   │       ├── 001_init.sql
│   │       ├── 002_add_justification_to_access_logs.sql
│   │       └── 002_vault_storage_policies.sql
│   ├── types/              # TypeScript types
│   └── test/
│       └── setup.ts        # Vitest setup
├── package.json
├── tsconfig.json
└── README.md
```

---

## Request Flow

### 1. Request Reception

```text
Client → Express App → CORS & Security Headers → Body Parsing → Sanitization → Rate Limiting → Routes
```

### 2. Validation

```text
Routes → Zod Schema Validation (schemas/*) → Controller
```

Validation is done either via explicit `safeParse` calls inside controllers or via `validateInput` middleware in `inputValidation.ts`.

### 3. Business Logic

```text
Controller → Supabase (PostgreSQL + Storage)
```

There is currently no separate service layer; controllers perform Supabase operations directly.

### 4. Response & Error Handling

```text
Supabase result → Controller → JSON Response → Client
        ↓
Error → errorHandler → Structured logger + 500 JSON
```

- `notFound` logs unknown routes and returns a 404 JSON.
- `errorHandler` logs unhandled errors via `logger` and returns a generic 500 (with more detail in development).

---

## Database Schema (Key Tables)

### `profiles`

Stores user identity and role information.

**Fields:**

- `id` (UUID, PK) – References `auth.users(id)`
- `role` (enum) – `citizen`, `doctor`, `paramedic`, `er_admin`
- `public_key` (text | null) – Citizen's public key; staff may have `null`
- `is_verified` (boolean) – Verification status
- `created_at` (timestamp)

### `medical_blobs`

Metadata for encrypted medical files.

**Fields:**

- `id` (UUID, PK)
- `owner_id` (UUID, FK → `profiles.id`)
- `storage_path` (text) – Path in Supabase Storage
- `category` (enum) – `identity`, `allergies`, `medications`, `records`
- `iv` (text) – AES‑GCM initialization vector (base64)
- `updated_at` (timestamp)

### `recovery_shards`

Encrypted social recovery shards.

**Fields:**

- `id` (UUID, PK)
- `user_id` (UUID, FK → `profiles.id`)
- `guardian_id` (UUID, FK → `profiles.id`)
- `encrypted_shard` (text) – Encrypted SSS shard

### `access_logs`

Immutable audit log of all access attempts.

**Fields:**

- `id` (UUID, PK)
- `staff_id` (UUID, FK → `profiles.id`)
- `patient_id` (UUID, FK → `profiles.id`)
- `method` (enum) – `QR_SCAN`, `BREAK_GLASS`
- `justification` (text, nullable) – Required for `BREAK_GLASS`
- `timestamp` (timestamp)

`logAccess` in `auditLog.ts` writes entries for both QR‑based access and break‑glass access.

---

## Row-Level Security (RLS)

Supabase RLS policies enforce data access:

### Profiles

- **Service Role:** Full access (bypasses RLS)
- **Users:** Can read/update their own profile

### Medical Blobs

- **Service Role:** Full access (only way to access)
- **Users:** No direct access (must go through API)

### Recovery Shards

- **Service Role:** Full access
- **Users:** No direct access

### Access Logs

- **Service Role:** Full access (append-only)
- **Users:** No direct access

---

## Security Model

### Authentication

- **Citizens**

  - Managed via Supabase Auth under the hood (service role).
  - Decryption keys are never sent to the server.

- **Staff**

  - Authenticated via `POST /staff/auth`.
  - Receive a JWT with `staffId` and `role` claims.
  - JWT is required for `/record/access` and `/emergency/break-glass`.

- **QR Tokens**
  - Generated via `POST /qr/rotate`.
  - Used together with staff JWTs to gate access to encrypted blobs.

### Data Protection

- All PHI is encrypted client-side using AES‑256‑GCM.
- The server only handles:
  - Encrypted blobs (base64)
  - IVs
  - Metadata (owner, category, storage path)
- No plaintext PHI is ever stored or logged by the server.

### Rate Limiting

Implemented in `rateLimiter.ts`:

- Global API limiter on `/api`.
- Stricter per‑route limits for auth, vault, QR rotation, and emergency endpoints.

### Input Validation & Sanitization

- Zod schemas in `schemas/*` validate request bodies.
- `validateInput` and controller‑level `safeParse` ensure invalid input is rejected with structured errors.
- `sanitizeInput` strips dangerous characters from string inputs to reduce injection risk.

### Logging

- `logger` in `lib/logger.ts` writes structured JSON logs.
- PHI‑like fields (`plaintext`, `medicalData`, `mnemonic`, `password`, etc.) are **never** logged; only safe metadata (IDs, roles, endpoints, status codes, IP, user agent, etc.) is retained.
- Errors are logged at `error` level with stack traces in development only.

---

## Environment Configuration

### Required Variables

- `SUPABASE_URL` – Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key (secret, never leaked to clients)
- `PORT` – Server port (default: `4000`)
- `NODE_ENV` – Environment mode (`development` / `production`)
- `ALLOWED_ORIGINS` – Comma‑separated list of allowed frontend origins

### Configuration Loading

- Uses `dotenv` (via `index.ts`) to load `.env`.
- Fails fast if required environment variables are missing.

---

## Deployment Considerations

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use secure service role key and store it in a secret manager
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS via `ALLOWED_ORIGINS`
- [ ] Enable and monitor rate limiting
- [ ] Configure error monitoring and log shipping (e.g. to a SIEM)
- [ ] Set up database backups and monitoring

### Scalability

- Stateless Express app (can scale horizontally).
- Supabase handles DB connection pooling.
- Rate limiting is in‑memory for now; Redis or another external store is recommended for multi‑instance deployments.

---

## Future Enhancements

- More granular RBAC policies and scopes for staff roles.
- Query APIs for `access_logs` (for compliance audits).
- Webhook notifications for break‑glass events.
- Externalized rate limit store (Redis).
- Additional auditing and observability (metrics, tracing).

---

## See Also

- [API Documentation](./api.md)
- [Final Plan](../../docs/FinalPlan.md)
- [Database Migrations](../src/db/migrations/README.md)
