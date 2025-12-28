## MediQR – Final Project Plan

### 1. Vision & Goals

- **Vision**: MediQR is a self-sovereign health identity system that lets citizens own and control their medical data through a Zero-Knowledge architecture.
- **Core Promise**: Hospitals and clinics can access life‑saving information via a secure QR scan, while all medical data remains end‑to‑end encrypted and unreadable to MediQR, Supabase, or any backend component.
- **Key Goals**:
  - **Self-sovereign identity**: Identity and access are defined by cryptography (12‑word phrase), not by a central database.
  - **Zero‑knowledge storage**: Servers only ever handle encrypted blobs and metadata, never plaintext PHI.
  - **Emergency readiness**: QR-based access and “break‑glass” workflows support real-world medical emergencies.
  - **Social recovery**: Prevent permanent lockouts through cryptographic key sharding and guardian recovery.

### 2. High‑Level Architecture

- **Security Model**: Client‑Side Encryption. All sensitive data is encrypted in the browser before it touches the network.
- **Main Components**:

  - **Frontend (PWA)**:
    - **Stack**: React, TypeScript, DaisyUI, TailwindCSS.
    - **Responsibilities**:
      - Generate and manage cryptographic keys (BIP‑39, AES‑256‑GCM).
      - Encrypt/decrypt medical data and recovery shards.
      - Drive all user and staff-facing UI.
  - **Backend API**:
    - **Stack**: Express.js + TypeScript.
    - **Responsibilities**:
      - Act as a Zero‑Knowledge “Blind Postman”/“Blind Librarian”: route encrypted blobs, never read them.
      - Handle authentication, RBAC, JWT issuance, and QR access token management.
      - Persist metadata, recovery shards, and audit logs in Supabase.
  - **Database (Supabase PostgreSQL)**:
    - Store **non‑sensitive metadata** (profiles, roles, timestamps) and **encrypted shards** (social recovery).
  - **Object Storage (Supabase Storage / S3)**:
    - Store **encrypted blobs**: health vault JSON, attachments (PDFs, images, scans).

- **Core Cryptography**:
  - **AES‑256‑GCM**: Symmetric encryption for all vault content and files (authenticated encryption).
  - **BIP‑39**: Generates 12‑word master mnemonic for identity and key derivation.
  - **Shamir’s Secret Sharing (SSS)**: Splits the master key into multiple encrypted shards for social recovery.

### 3. Security, Identity & Recovery

#### 3.1 Client‑Side Key Management

- **Master Key Derivation**:
  - User’s browser generates a 12‑word BIP‑39 mnemonic on onboarding.
  - This mnemonic deterministically derives the **Master Encryption Key** (MEK).
  - The mnemonic **never leaves the client** and is never sent to the server.

#### 3.2 Login / Restore Model

- **Login = Restore**:
  - On a new device, “logging in” is actually **restoring**: user re-enters the 12‑word phrase or reconstructs the MEK via social recovery.
  - Once derived, the MEK unlocks the local vault and can decrypt any blobs fetched from the backend.

#### 3.3 Social Recovery (2‑of‑3 Shamir Sharding)

- **Shard Creation**:
  - MEK is split into **3 shards** using SSS.
- **Shard Distribution**:
  - **Shard A**: Stored locally on the user’s primary device.
  - **Shard B**: Encrypted to a guardian’s public key and stored as a recovery record associated with the guardian.
  - **Shard C**: Encrypted backup stored in Supabase (PostgreSQL `recovery_shards` table).
- **Reconstruction**:
  - Any **2 of 3** shards can reconstruct the MEK client‑side.
  - Reconstruction logic is implemented in the React app, never on the server.

#### 3.4 QR Access & One‑Time Fragments

- **QR Code Contents**:
  - A URL to an API endpoint plus a **One‑Time Fragment**.
  - The fragment is combined with local keys in the doctor’s browser to derive the data decryption key.
- **Access Flow**:
  - Doctor scans QR → Browser fetches encrypted blob → Uses fragment + local crypto to decrypt on‑screen.
  - Backend only validates token and returns blobs; it never sees decrypted data.

### 4. Backend Architecture (Express + Supabase)

#### 4.1 Role: The “Blind Postman” / “Blind Librarian”

- **Backend Philosophy**:
  - Treat the backend as a **routing and policy engine**, not a data processor.
  - It can:
    - Authenticate and authorize requests.
    - Route encrypted blobs between client and storage.
    - Manage access tokens, QR rotation, and audit logs.
  - It **cannot**:
    - Derive keys.
    - Decrypt medical data.
    - Inspect PHI.

#### 4.2 Responsibilities

- **Authentication & RBAC**:

  - Integrate with Supabase Auth for users and staff.
  - Issue JWTs with roles: `citizen`, `doctor`, `paramedic`, `er_admin`.
  - Enforce RBAC on all endpoints.

- **Vault Routing**:

  - Accept encrypted vault blobs (JSON, PDFs, images).
  - Upload them to Supabase Storage with hashed, non-identifying paths.
  - Return pre-signed or controlled download URLs for authorized access.

- **Social Recovery Management**:

  - Receive and store encrypted SSS shards in PostgreSQL (`recovery_shards`).
  - Enforce per-user and per-guardian constraints.

- **QR Token & Session Management**:

  - Issue and rotate short-lived access tokens associated with QR codes (`/qr/rotate`).
  - Validate tokens at scan time before returning any blobs.

- **Audit Logging & Compliance**:

  - Log all access attempts in an immutable `access_logs` table.
  - Mark whether access was via QR or “break‑glass”.
  - Trigger webhooks/notifications on emergency access.

- **Zero-Knowledge Guarantees**:
  - All structured medical data is sent as **encrypted blobs**.
  - Only minimal metadata (owner IDs, category, timestamps, storage paths, IVs) is persisted in readable form.

### 5. API Design

#### 5.1 Identity & Core Setup

- **Citizen Identity**

| Endpoint     | Method | Role    | Description                                    |
| ------------ | ------ | ------- | ---------------------------------------------- |
| `/auth/init` | POST   | Citizen | Store user’s public key and hashed identifier. |

- **Staff / Provider Identity**

| Endpoint      | Method | Role  | Description                                                  |
| ------------- | ------ | ----- | ------------------------------------------------------------ |
| `/staff/auth` | POST   | Staff | Authenticate staff against professional database / registry. |

#### 5.2 Vault & Blob Management

- **Citizen‑Facing Vault Endpoints**

| Endpoint      | Method | Role    | Description                                                           |
| ------------- | ------ | ------- | --------------------------------------------------------------------- |
| `/vault/sync` | POST   | Citizen | Accept encrypted JSON/PDF blobs and persist them to Supabase Storage. |

- **Provider‑Facing Vault Access**

| Endpoint         | Method | Role  | Description                                                                             |
| ---------------- | ------ | ----- | --------------------------------------------------------------------------------------- |
| `/record/access` | POST   | Staff | Validate Staff JWT + Patient QR token, then return storage reference to encrypted blob. |
| `/vault/:id`     | GET    | Staff | Fetch encrypted blob by ID (typically after token and RBAC validation).                 |

#### 5.3 Social Recovery

| Endpoint           | Method | Role    | Description                                                                 |
| ------------------ | ------ | ------- | --------------------------------------------------------------------------- |
| `/recovery/shards` | POST   | Citizen | Create/distribute encrypted SSS shards to guardian IDs and Supabase backup. |
| `/social/shard`    | POST   | Citizen | Store guardian’s encrypted shard in PostgreSQL.                             |

#### 5.4 QR & Emergency Workflows

| Endpoint                 | Method | Role     | Description                                                               |
| ------------------------ | ------ | -------- | ------------------------------------------------------------------------- |
| `/qr/rotate`             | POST   | Citizen  | Issue or update the temporary access token for the user’s MediQR.         |
| `/emergency/break-glass` | POST   | ER Admin | Log emergency override access, release necessary blobs, notify guardians. |

### 6. Data Architecture (Supabase)

#### 6.1 PostgreSQL Tables

- **`profiles`** – Identity and Role

  - **Fields**:
    - `id` (UUID, PK, links to Supabase Auth)
    - `role` (enum: `citizen`, `doctor`, `paramedic`, `er_admin`)
    - `public_key` (text)
    - `is_verified` (boolean – particularly for staff)
    - `created_at` (timestamp)

- **`medical_blobs`** – Metadata for Encrypted Files

  - **Fields**:
    - `id` (UUID, PK)
    - `owner_id` (UUID, FK → `profiles.id`)
    - `storage_path` (text, e.g. `vault/encrypted_hash_123`)
    - `category` (enum: `identity`, `allergies`, `medications`, `records`)
    - `iv` (text – AES‑GCM initialization vector)
    - `updated_at` (timestamp)

- **`recovery_shards`** – Encrypted Social Recovery Shards

  - **Fields**:
    - `id` (UUID)
    - `user_id` (UUID – owner)
    - `guardian_id` (UUID – designated guardian)
    - `encrypted_shard` (text or `BYTEA` – encrypted SSS shard)

- **`access_logs`** – Immutable Audit Log

  - **Fields**:
    - `id` (UUID)
    - `staff_id` (UUID, FK → `profiles.id`)
    - `patient_id` (UUID, FK → `profiles.id`)
    - `method` (enum: `QR_SCAN`, `BREAK_GLASS`)
    - `timestamp` (timestamp, default `now()`)

#### 6.2 Storage (Supabase S3)

- **Encrypted Blobs**:
  - Stored in a dedicated bucket (e.g. `vault/`).
  - Filenames are **hashes** of user IDs and record metadata to avoid leaking identity via filenames.
- **Blob Types**:
  - Small encrypted JSON or shard data may be stored directly in PostgreSQL as `BYTEA`.
  - Larger JSON, PDFs, images, and backups live in S3 object storage.

### 7. Frontend Architecture & UI

#### 7.1 Global Crypto Context

- **`CryptoProvider` (React Context)**:
  - **State**:
    - `masterKey`
    - `isUnlocked`
  - **Methods**:
    - `encryptData(plainText)`
    - `decryptData(cipherText, fragment)`
  - **Responsibilities**:
    - Manage lifecycle of MEK in memory.
    - Provide encryption/decryption helpers to all components.
    - Integrate with BIP‑39 generation and SSS sharding logic.

#### 7.2 Citizen Flows & Pages

- **`/onboarding`**:

  - **Components**: DaisyUI Stepper / Modal.
  - **Logic**:
    - Generate 12 words → Display → Verify by asking user to click in correct order.
    - Prompt to store securely and optionally configure guardians.

- **`/dashboard`**:

  - **Components**: Stats cards (blood type, last updated), “Generate My QR” card, `EmergencyCard`.
  - **Logic**:
    - Show high-level, non-sensitive summary.
    - Quick actions for QR generation, backup, and offline mode.

- **`/vault`**:

  - **Components**: Accordion listing records by category (Allergies, Medications, Records).
  - **Logic**:
    - Encrypt on save; sync blobs via `/vault/sync`.

- **`/settings/guardians`**:
  - **Components**: Table to manage guardians.
  - **Logic**:
    - Add/remove guardians; generate and send encrypted shards via `/recovery/shards` or `/social/shard`.

#### 7.3 Provider (Staff) Flows & Pages

- **`/staff/login`**:

  - Simple login hero + form backed by `/staff/auth`.

- **`/staff/scanner`**:

  - **Components**: Camera stream, QR scanner.
  - **Logic**:
    - Scan QR → Extract token + fragment → Call `/record/access` → Fetch encrypted blob → Decrypt client-side with fragment + key material.

- **`/staff/patient-view/[id]`**:

  - **Components**: Table for decrypted patient data; status badges (Green `QR`, Red `Break‑Glass`).
  - **Logic**:
    - Display decrypted data; show method of access from `access_logs`.

- **`/staff/emergency`**:
  - **Components**: “Break‑Glass” button, DaisyUI Modal.
  - **Logic**:
    - Require reason (e.g. “Patient unconscious”).
    - Call `/emergency/break-glass`; log event and trigger guardian notifications.

#### 7.4 Core UI Components

- **`QRGenerator`**:

  - **Input**: User ID, temporary access token from backend, local decryption fragment.
  - **Logic**: Compose payload; render QR via `qrcode.react`.
  - **Output**: Scannable QR displayed in Citizen dashboard.

- **`EmergencyCard`**:
  - **Purpose**: High-visibility emergency controls on Citizen dashboard.
  - **Feature**: “Offline Mode” – download a small encrypted JSON into localStorage so QR remains functional when hospital has no internet.

### 8. Key User & Doctor Workflows

#### 8.1 Citizen Onboarding

1. User opens PWA and starts onboarding wizard.
2. App generates a 12‑word BIP‑39 mnemonic and displays it.
3. User confirms/validates the phrase (click in order).
4. App derives MEK and (optionally) creates SSS shards.
5. Local shard saved; guardian shards configured and sent; backup shard stored via API.
6. User lands on `/dashboard`.

#### 8.2 Vault Update

1. User adds/updates medical data (e.g. blood type, allergies).
2. React app encrypts data to a JSON blob using AES‑256‑GCM.
3. App calls `/vault/sync` with encrypted blob.
4. Backend stores blob in Supabase Storage and updates `medical_blobs`.

#### 8.3 QR Scan by Doctor

1. Citizen presents MediQR code.
2. Doctor scans via `/staff/scanner`.
3. App extracts token/fragment and calls `/record/access`.
4. Backend validates JWT + token, locates blob in Storage.
5. Encrypted blob returned to scanner app; decrypted client-side using fragment + key.
6. Decrypted critical information shown immediately to doctor.

#### 8.4 Emergency “Break‑Glass”

1. ER Admin opens `/staff/emergency`.
2. Provides justification and confirms break-glass action.
3. Backend logs event in `access_logs` with method `BREAK_GLASS`.
4. Backend returns necessary storage references; staff client decrypts data if it has key material / fragment flow.
5. Webhooks or notifications alert patient and guardians of emergency access (future enhancement).

### 9. Legal & Compliance Positioning

- **Not a Data Controller of PHI**:
  - MediQR and Supabase never possess decryption keys; only encrypted blobs and metadata are processed.
- **Implicit Consent**:
  - Scanning a QR is a deliberate, physical act of sharing, aligning with informed consent concepts.
- **Zero‑Liability Storage**:
  - A database breach exposes only cryptographically protected blobs and shards (random‑looking data), not readable PHI.

### 10. Mental Models & Glossary

- **Blind Librarian / Postman**:
  - Backend can store, index, and deliver “books” (blobs), but is blindfolded and cannot read content.
- **Lego Information Model**:
  - Medical data is composed of independent, granular “bricks” (identity, allergies, meds, records). Users decide which bricks to share.
- **Sealed Envelope / Blob**:
  - Encrypted data is like a sealed, opaque envelope. The post office (Supabase) only sees addresses and size, never the letter.
- **Blob Types**:
  - **Database blobs (PostgreSQL `BYTEA`)**: Small encrypted pieces (e.g. shards, small JSON).
  - **Storage blobs (Supabase S3)**: Large encrypted records, PDFs, and images.
