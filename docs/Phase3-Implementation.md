# Phase 3 Implementation Summary

## ✅ Completed Components

### 1. Backend – QR Token Management

**Location:** `server/src/controllers/qrController.ts`

- **`POST /api/qr/rotate`**: Issues short-lived access tokens for QR code generation
  - Validates owner ID
  - Verifies user is a citizen
  - Generates JWT token with 1-hour expiry
  - Returns token for QR code encoding

**Schema:** `server/src/schemas/qr.ts`

- Validates QR rotation requests
- Validates staff authentication requests
- Validates record access requests

### 2. Backend – Staff Authentication

**Location:** `server/src/controllers/staffController.ts`

- **`POST /api/staff/auth`**: Authenticates staff members and issues JWT tokens
  - Accepts email, password, and role (doctor, paramedic, er_admin)
  - Creates staff profile if new user
  - Issues JWT token with 8-hour expiry
  - Returns token, staff ID, and role

**Note:** For Phase 3 MVP, this uses simple email/password authentication. In production, this would integrate with professional registries.

### 3. Backend – Record Access

**Location:** `server/src/controllers/recordController.ts`

- **`POST /api/record/access`**: Validates staff JWT + patient QR token and returns blob access
  - Verifies staff JWT token from Authorization header
  - Verifies patient QR token
  - Validates patient ID matches QR token
  - Fetches all medical blobs for patient
  - Generates signed URLs for blob access (1-hour expiry)
  - Logs access in `access_logs` table with method "QR_SCAN"
  - Returns blob metadata and signed URLs

### 4. Backend – JWT Utilities

**Location:** `server/src/lib/jwt.ts`

- `signQRToken()`: Signs QR access tokens
- `verifyQRToken()`: Verifies QR access tokens
- `signStaffToken()`: Signs staff JWT tokens
- `verifyStaffToken()`: Verifies staff JWT tokens

**Configuration:**

- JWT secret from `JWT_SECRET` environment variable (default: "mediqr-secret-key-change-in-production")
- QR token expiry: 1 hour (configurable via `JWT_EXPIRY`)
- Staff token expiry: 8 hours

### 5. Frontend – QR Generator Component

**Location:** `client/src/components/QRGenerator.tsx`

- Generates QR code containing:
  - Backend token (from `/qr/rotate` endpoint)
  - Local fragment (derived from master key, never sent to server)
  - User ID and timestamp
- Displays QR code (requires `qrcode.react` library)
- Auto-generates on mount if vault is unlocked
- Allows regeneration of QR code

**Note:** QR code rendering requires `qrcode.react` library to be installed.

### 6. Frontend – Citizen Authentication & Restore

**Location:** `client/src/pages/Restore.tsx`

- **Restore/Login Page**: Allows existing citizens to restore access by entering their 12-word mnemonic phrase
  - Validates mnemonic phrase format
  - Unlocks crypto context with derived master key
  - Redirects to dashboard on success
  - Includes security notice about client-side decryption
  - Placeholder for social recovery (Phase 4)

**Authentication Flow:**

- New users → `/onboarding` (generate mnemonic)
- Existing users (locked) → `/restore` (enter mnemonic)
- Existing users (unlocked) → `/dashboard` (access vault)

**Updated Routing Logic:**

- Dashboard and Vault pages redirect to `/restore` if onboarded but locked
- Landing page checks unlock status and routes accordingly
- Follows "Login = Restore" model from architecture

### 7. Frontend – Dashboard Integration

**Location:** `client/src/pages/Dashboard.tsx`

- Integrated QRGenerator component
- Added scroll-to-QR functionality from action card
- QR generator section displays below action cards
- Updated redirect logic to use restore page for locked users

### 8. Frontend – Staff Login Page

**Location:** `client/src/pages/StaffLogin.tsx`

- Staff authentication form
- Role selection (doctor, paramedic, er_admin)
- Email and password input
- Stores staff token in localStorage
- Redirects to scanner on success

### 9. Frontend – Staff Scanner Page

**Location:** `client/src/pages/StaffScanner.tsx`

- Camera access for QR scanning
- Manual QR input option (for testing)
- Parses QR payload (token, fragment, userId)
- Calls `/record/access` endpoint with staff token
- Stores patient data in localStorage
- Redirects to patient view on success

**Note:** QR scanning requires `html5-qrcode` or `react-qr-reader` library to be installed.

### 10. Frontend – Patient View Page

**Location:** `client/src/pages/StaffPatientView.tsx`

- Displays patient records after QR scan
- Shows access information (method, time, record count)
- Fetches encrypted blobs from signed URLs
- Displays decrypted records by category
- Shows access method badge (QR Scan)

**Note:** Full decryption requires proper key derivation from fragment + token. Current implementation shows structure but needs complete key derivation logic.

### 11. Frontend – Services

**Location:** `client/src/services/`

- **`qrService.ts`**: QR token rotation service

  - `rotateQRToken()`: Gets new QR token from backend

- **`staffService.ts`**: Staff authentication and record access
  - `staffAuth()`: Authenticates staff member
  - `recordAccess()`: Accesses patient records with QR token

## Files Created/Modified

### Backend

- `server/src/lib/jwt.ts` - JWT signing and verification utilities
- `server/src/schemas/qr.ts` - Zod validation schemas for QR and staff endpoints
- `server/src/controllers/qrController.ts` - QR token rotation endpoint
- `server/src/controllers/staffController.ts` - Staff authentication endpoint
- `server/src/controllers/recordController.ts` - Record access endpoint
- `server/src/middleware/auth.ts` - Staff authentication middleware (for future use)
- `server/src/routes/index.ts` - Added QR, staff, and record access routes

### Frontend

- `client/src/components/QRGenerator.tsx` - QR code generation component
- `client/src/pages/Restore.tsx` - Citizen restore/login page
- `client/src/pages/StaffLogin.tsx` - Staff login page
- `client/src/pages/StaffScanner.tsx` - QR scanner page
- `client/src/pages/StaffPatientView.tsx` - Patient record view page
- `client/src/services/qrService.ts` - QR service
- `client/src/services/staffService.ts` - Staff service
- `client/src/pages/Dashboard.tsx` - Integrated QR generator, updated redirect logic
- `client/src/pages/Vault.tsx` - Updated redirect logic for restore flow
- `client/src/pages/Landing.tsx` - Updated routing to check unlock status
- `client/src/App.tsx` - Added restore and staff routes

## Dependencies Required

### Backend

```bash
cd server
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### Frontend

```bash
cd client
npm install qrcode.react
npm install html5-qrcode
# OR
npm install react-qr-reader
```

## Environment Variables

### Server

Add to `server/.env`:

```bash
JWT_SECRET=your-strong-random-secret-key-here
JWT_EXPIRY=1h  # Optional, default is 1h
```

## Data Flow

### Citizen Authentication & Restore

```
User visits app →
Check if onboarded:
  - Not onboarded → /onboarding (generate mnemonic)
  - Onboarded but locked → /restore (enter mnemonic)
  - Onboarded and unlocked → /dashboard

Restore Flow:
User enters 12-word mnemonic →
Validate mnemonic format →
Derive master key from mnemonic →
Unlock crypto context →
Redirect to /dashboard
```

### QR Code Generation

```
User clicks "Generate QR" →
Client calls /qr/rotate →
Backend issues JWT token →
Client generates local fragment from master key (via encryption) →
Client combines token + fragment into QR payload →
QR code displayed
```

### QR Scan Flow

```
Staff scans QR code →
Client parses QR payload (token, fragment, userId) →
Client calls /record/access with staff JWT + QR token →
Backend validates both tokens →
Backend fetches medical_blobs for patient →
Backend generates signed URLs →
Backend logs access in access_logs →
Client receives blob metadata and signed URLs →
Client fetches encrypted blobs →
Client decrypts using fragment + key derivation →
Decrypted records displayed
```

## Security Features

1. **JWT Tokens**: Short-lived tokens (1h for QR, 8h for staff)
2. **Token Validation**: Both staff and QR tokens verified before access
3. **Access Logging**: All access attempts logged in `access_logs` table
4. **Signed URLs**: Blob access via time-limited signed URLs (1h expiry)
5. **Role-Based Access**: Staff roles enforced (doctor, paramedic, er_admin)
6. **Zero-Knowledge**: Server never sees decrypted data

## Testing Checklist

- [ ] Install backend dependencies (jsonwebtoken)
- [ ] Install frontend dependencies (qrcode.react, html5-qrcode)
- [ ] Set JWT_SECRET in server/.env
- [ ] Test QR token rotation endpoint
- [ ] Test staff authentication endpoint
- [ ] Test record access endpoint
- [ ] Test QR code generation in dashboard
- [ ] Test staff login flow
- [ ] Test QR scanning (or manual input)
- [ ] Test patient record viewing
- [ ] Verify access logs are created

## Known Limitations (MVP)

1. **QR Code Rendering**: Requires `qrcode.react` library installation
2. **QR Scanning**: Requires `html5-qrcode` or `react-qr-reader` library installation
3. **Key Derivation**: Fragment + token key derivation needs full implementation
4. **Staff Authentication**: Simple email/password (not integrated with professional registry)
5. **Decryption**: Full decryption flow needs proper key derivation from fragment + token
6. **Fragment Generation**: Uses encryption-based derivation (works but not ideal - proper key derivation would be better)

## Next Steps (Future Phases)

- [ ] Implement proper key derivation from fragment + token
- [ ] Integrate QR code rendering library
- [ ] Integrate QR scanning library
- [ ] Add professional registry integration for staff auth
- [ ] Add QR token revocation/rotation tracking
- [ ] Add offline mode support
- [ ] Add break-glass emergency access
- [ ] Add guardian notifications on access
