## MediQR – Development Roadmap

### 1. Phase 0 – Project Setup & Foundations

- **Repository & Tooling**

  - Initialize monorepo structure (e.g. `client/` and `server/`).
  - Configure TypeScript for both frontend and backend.
  - Set up linting, formatting, and basic CI (build + typecheck).

- **Supabase Setup**

  - Create Supabase project.
  - Configure Auth, PostgreSQL, and Storage buckets.
  - Provision database tables: `profiles`, `medical_blobs`, `recovery_shards`, `access_logs`.

- **Security & Secrets**
  - Store Supabase keys and JWT secrets in environment variables.
  - Define minimal threat model and security checklist for future phases.

### 2. Phase 1 – Cryptography & Identity MVP

- **Client‑Side Crypto Core**

  - Implement BIP‑39 mnemonic generation and validation.
  - Implement deterministic MEK derivation from the 12‑word phrase.
  - Implement AES‑256‑GCM encrypt/decrypt helpers.

- **`CryptoProvider` Integration**

  - Create React context to hold `masterKey` and `isUnlocked` state.
  - Expose `encryptData` and `decryptData` methods to the app.

- **Onboarding Flow**

  - Implement `/onboarding` UI (steps to display and verify 12 words).
  - Persist minimal local state (e.g. local shard, "onboarded" flag).

- **Restore/Login Flow**

  - Implement `/restore` page for existing users to enter mnemonic phrase.
  - Validate mnemonic and unlock crypto context.
  - Redirect to dashboard on successful restore.

- **Basic Profile Wiring**
  - Implement `/auth/init` endpoint to store user public key and hashed identifier.
  - Connect onboarding completion to initial profile creation in `profiles`.

### 3. Phase 2 – Vault & Blob Storage MVP

- **Backend – Vault Endpoints**

  - Implement `/vault/sync` (POST) to accept encrypted blobs and push to Supabase Storage.
  - Ensure file naming uses hashed IDs and does not leak identity.
  - Wire `medical_blobs` metadata creation (owner, category, storage path, IV, timestamps).

- **Frontend – Vault UI**

  - Build `/vault` page with an Accordion for categories (identity, allergies, medications, records).
  - Connect form submissions to client‑side encryption and `/vault/sync`.

- **Dashboard Summary**
  - Implement `/dashboard` page showing non-sensitive summaries (e.g. blood type label, last updated).
  - Add “Generate My QR” card placeholder.

### 4. Phase 3 – QR Access & Provider Flows (Online)

- **QR Token Management**

  - Implement `/qr/rotate` endpoint to issue short‑lived access tokens for a user.
  - Define token payload (user ID, scope, expiry) and signing mechanism.

- **QR Generation**

  - Implement `QRGenerator` component in the frontend.
  - Encode backend token + local fragment into QR payload.
  - Display QR in `/dashboard`.

- **Staff Authentication**

  - Implement `/staff/auth` endpoint and basic staff login (`/staff/login` page).
  - Issue staff JWT with roles and minimal claims.

- **Record Access Flow**
  - Implement `/record/access` endpoint: validate Staff JWT + patient QR token, look up `medical_blobs`, and return storage path / signed URL.
  - Build `/staff/scanner` page: camera stream, QR scanner integration, call `/record/access`.
  - Implement basic patient view (`/staff/patient-view/[id]`) to display decrypted data after fetch + decrypt.

### 5. Phase 4 – Social Recovery & Guardians

- **Shamir’s Secret Sharing**

  - Implement SSS logic client‑side to split MEK into three shards.
  - Implement reconstruction logic requiring any 2 of 3 shards.

- **Guardian Management UI**

  - Build `/settings/guardians` page with table to add/remove guardians.
  - Integrate with profile data to store guardian relationships.

- **Shard Persistence**

  - Implement `/recovery/shards` and/or `/social/shard` endpoints to store encrypted shards in `recovery_shards`.
  - Implement guardian shard distribution (e.g. via email, secure link, or in‑app for later).

- **Recovery Flow**
  - Build a “Recover Account” flow that:
    - Allows entering mnemonic OR
    - Collecting shards from device + guardian + Supabase to reconstruct MEK.

### 6. Phase 5 – Emergency “Break‑Glass” & Auditing

- **Audit Logging**

  - Fully implement `access_logs` table with `QR_SCAN` vs `BREAK_GLASS` methods.
  - Add middleware on sensitive endpoints to write audit entries.

- **Break‑Glass Endpoint**

  - Implement `/emergency/break-glass` for ER Admins with:
    - Role/permission checks.
    - Required justification string.
    - Logging to `access_logs`.

- **Provider UI Enhancements**

  - Build `/staff/emergency` page with “Break‑Glass” button and confirmation modal.
  - Update `/staff/patient-view/[id]` to show badges (Green QR, Red Break‑Glass).

- **Notifications (Optional / Later)**
  - Design webhook / email notifications for break‑glass events to patients and guardians.

### 7. Phase 6 – Offline & Resilience Features

- **EmergencyCard & Offline Mode**

  - Implement `EmergencyCard` on `/dashboard` with an “Offline Mode” button.
  - Download a small encrypted JSON vault into `localStorage` or IndexedDB.
  - Ensure QR can still reference locally available encrypted data for offline scenarios.

- **Resilience Testing**
  - Simulate backend/Supabase downtime and validate local recovery and offline flows.
  - Document disaster recovery steps and self‑sovereign guarantees (e.g. mnemonic still works locally).

### 8. Phase 7 – Hardening, Compliance & UX Polish

- **Security Hardening**

  - Review key handling in `CryptoProvider` (lifetime, memory clearing, idle lock).
  - Add rate limiting, input validation, and stricter CORS on the backend.
  - Add content security policy (CSP) and other browser‑level protections.

- **Compliance Readiness**

  - Document data flows for regulators, emphasizing zero‑knowledge and blob storage.
  - Validate that no plaintext PHI is logged or stored.

- **UX & UI Polish**

  - Improve DaisyUI theming, accessibility, and responsive design.
  - Add clear user education modals explaining mnemonics, guardians, and QR consent.

- **Testing & Observability**
  - Add unit tests for crypto helpers, SSS, and API handlers.
  - Add integration tests for main user flows (onboarding, vault sync, QR scan, recovery).
  - Add logging/monitoring for backend and significant frontend errors.
