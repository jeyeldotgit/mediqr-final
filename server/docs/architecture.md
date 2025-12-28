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
  - Enforce RBAC policies

- ❌ **Cannot do:**
  - Derive encryption keys
  - Decrypt medical data
  - Inspect PHI content
  - Read plaintext health records

### Blind Postman Analogy

Think of the server as a postman who can:
- Deliver sealed envelopes (encrypted blobs)
- Read addresses (metadata)
- Verify delivery permissions (authentication)
- Log deliveries (audit trails)

But cannot:
- Open envelopes (decrypt data)
- Read letters (access PHI)

---

## System Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ HTTPS
       │ (Encrypted Blobs)
       ▼
┌─────────────┐
│   Server    │
│  (Express)  │
└──────┬──────┘
       │ Service Role
       │ (Bypasses RLS)
       ▼
┌─────────────┐
│  Supabase  │
│ PostgreSQL │
│  + Storage │
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
- **Authentication:** Supabase Auth (service role for Phase 1)

---

## Project Structure

```
server/
├── src/
│   ├── app.ts              # Express app configuration
│   ├── index.ts            # Application entry point
│   ├── config/
│   │   └── supabase.ts     # Supabase client configuration
│   ├── controllers/        # Request handlers
│   │   └── authController.ts
│   ├── routes/             # Route definitions
│   │   └── index.ts
│   ├── schemas/            # Zod validation schemas
│   │   └── auth.ts
│   ├── middleware/         # Express middleware
│   │   └── errorHandler.ts
│   ├── services/           # Business logic (future)
│   ├── types/              # TypeScript types
│   └── db/
│       └── migrations/     # Database migrations
│           └── 001_init.sql
├── package.json
├── tsconfig.json
└── README.md
```

---

## Request Flow

### 1. Request Reception
```
Client → Express App → Middleware → Routes
```

### 2. Validation
```
Routes → Zod Schema Validation → Controller
```

### 3. Business Logic
```
Controller → Service Layer (future) → Database/Storage
```

### 4. Response
```
Database → Controller → Response → Client
```

---

## Database Schema

### Tables

#### `profiles`
Stores user identity and role information.

**Fields:**
- `id` (UUID, PK) - References `auth.users(id)`
- `role` (enum) - `citizen`, `doctor`, `paramedic`, `er_admin`
- `public_key` (text) - User's public key
- `is_verified` (boolean) - Verification status
- `created_at` (timestamp)

#### `medical_blobs`
Metadata for encrypted medical files.

**Fields:**
- `id` (UUID, PK)
- `owner_id` (UUID, FK → `profiles.id`)
- `storage_path` (text) - Path in Supabase Storage
- `category` (enum) - `identity`, `allergies`, `medications`, `records`
- `iv` (text) - AES-GCM initialization vector
- `updated_at` (timestamp)

#### `recovery_shards`
Encrypted social recovery shards.

**Fields:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → `profiles.id`)
- `guardian_id` (UUID, FK → `profiles.id`)
- `encrypted_shard` (text) - Encrypted SSS shard

#### `access_logs`
Immutable audit log of all access attempts.

**Fields:**
- `id` (UUID, PK)
- `staff_id` (UUID, FK → `profiles.id`)
- `patient_id` (UUID, FK → `profiles.id`)
- `method` (enum) - `QR_SCAN`, `BREAK_GLASS`
- `timestamp` (timestamp)

---

## Row-Level Security (RLS)

Supabase RLS policies enforce data access:

### Profiles Table
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

---

## Security Model

### Authentication (Phase 1)
- Uses Supabase service role key
- Bypasses RLS for backend operations
- Creates users in `auth.users` programmatically

### Future Authentication
- JWT tokens for citizens and staff
- Role-based access control (RBAC)
- Token validation middleware

### Data Protection
- All PHI encrypted client-side (AES-256-GCM)
- Server only handles encrypted blobs
- No plaintext data in transit or at rest on server

---

## Error Handling

### Middleware Chain
1. **Request Parsing** - JSON body parsing
2. **CORS** - Cross-origin resource sharing
3. **Logging** - Request logging (Morgan)
4. **Routes** - Route matching
5. **Error Handler** - Centralized error handling

### Error Response Format
```json
{
  "error": "Error type",
  "details": "Detailed message",
  "code": "Error code"
}
```

---

## Environment Configuration

### Required Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret)
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment mode

### Configuration Loading
- Uses `dotenv` to load `.env` file
- Validates required variables on startup
- Provides helpful error messages if missing

---

## Deployment Considerations

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use secure service role key
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Configure error monitoring
- [ ] Set up database backups

### Scalability
- Stateless design (can scale horizontally)
- Database connection pooling (Supabase handles this)
- Consider Redis for session management (future)

---

## Future Enhancements

### Phase 2+
- JWT authentication for citizens and staff
- RBAC middleware
- Vault sync endpoints
- QR token rotation
- Emergency break-glass workflows
- Social recovery shard management
- Audit log querying
- Webhook notifications

---

## See Also

- [API Documentation](./api.md)
- [Final Plan](../../docs/FinalPlan.md)
- [Database Migrations](../src/db/migrations/README.md)
