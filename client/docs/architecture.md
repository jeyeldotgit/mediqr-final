# MediQR Client Architecture

## Overview

The MediQR client is a React + TypeScript Progressive Web Application (PWA) that implements client-side encryption and zero-knowledge architecture. All sensitive data is encrypted in the browser before transmission to the server.

---

## Core Principles

### Client-Side Encryption

All encryption and key management happens in the browser:

- ✅ **Client handles:**

  - BIP-39 mnemonic generation
  - Master Encryption Key (MEK) derivation
  - AES-256-GCM encryption/decryption
  - Key sharding (future: Shamir's Secret Sharing)
  - QR code generation

- ❌ **Client never:**
  - Sends plaintext PHI to server
  - Stores unencrypted sensitive data
  - Exposes encryption keys

### Zero-Knowledge Model

The client ensures the server never sees plaintext data:

1. User generates mnemonic → Client
2. Client derives MEK → Client
3. User enters medical data → Client
4. Client encrypts data → Encrypted blob
5. Client sends encrypted blob → Server (server cannot read it)

---

## Technology Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4 + DaisyUI
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Crypto:** Web Crypto API + @scure/bip39
- **State Management:** React Context API

---

## Project Structure

```
client/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── index.css             # Global styles + DaisyUI theme
│   ├── contexts/
│   │   └── CryptoProvider.tsx # Crypto state management
│   ├── pages/
│   │   ├── Landing.tsx       # Landing page
│   │   ├── Onboarding.tsx    # Onboarding flow
│   │   ├── Dashboard.tsx     # User dashboard
│   │   └── Vault.tsx         # Vault management page
│   ├── services/
│   │   ├── apiClient.ts      # Base API client with shared config
│   │   ├── authService.ts     # Authentication & profile services
│   │   ├── vaultService.ts    # Vault operations
│   │   └── README.md         # Services documentation
│   ├── lib/
│   │   ├── storage.ts        # Local storage utilities
│   │   └── crypto/
│   │       ├── mnemonic.ts   # BIP-39 mnemonic utilities
│   │       ├── keyDerivation.ts # MEK derivation
│   │       ├── aes.ts        # AES-256-GCM encryption
│   │       └── identifier.ts # Public key & hash generation
│   └── assets/               # Static assets
├── public/                   # Public assets
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Application Flow

### 1. Initial Load

```
User visits app → Landing page → Check onboarding status
```

### 2. Onboarding Flow (New Users)

```
Generate mnemonic → Display words → Verify words →
Derive MEK → Unlock CryptoProvider → Create profile → Dashboard
```

### 3. Restore Flow (Existing Users)

```
User enters 12-word mnemonic → Validate format →
Derive MEK → Unlock CryptoProvider → Dashboard
```

### 4. Authenticated Flow

```
App loads → Check onboarding status:
  - Not onboarded → /onboarding
  - Onboarded but locked → /restore
  - Onboarded and unlocked → /dashboard

Dashboard/Vault → Check if unlocked →
If locked: Redirect to /restore → User enters mnemonic → Unlock → Access vault
```

---

## Key Components

### CryptoProvider

React Context that manages encryption state and provides crypto operations.

**State:**

- `masterKey: CryptoKey | null` - The master encryption key
- `isUnlocked: boolean` - Whether the crypto is unlocked

**Methods:**

- `unlock(mnemonic: string)` - Derive MEK and unlock
- `lock()` - Clear master key from memory
- `encryptData(plaintext: string)` - Encrypt data
- `decryptData(encrypted: string, iv: string)` - Decrypt data

**Usage:**

```typescript
import { useCrypto } from "../contexts/CryptoProvider";

function MyComponent() {
  const { isUnlocked, encryptData, decryptData } = useCrypto();

  if (!isUnlocked) {
    return <div>Please unlock first</div>;
  }

  // Use encryption functions
}
```

### Onboarding Page

Multi-step wizard for new users:

1. **Generate Step:** Display 12-word mnemonic
2. **Verify Step:** User selects words in correct order
3. **Complete Step:** Initialize profile and unlock crypto

### Landing Page

Marketing/landing page with:

- Hero section
- Features showcase
- How it works
- Security highlights
- Call-to-action

---

## Cryptography Architecture

### Key Derivation Flow

```
Mnemonic (12 words)
    ↓
BIP-39 Seed (128 bits)
    ↓
PBKDF2-SHA256 (100,000 iterations)
    ↓
Master Encryption Key (MEK) - 256 bits
    ↓
AES-256-GCM Encryption Key
```

### Encryption Flow

```
Plaintext Data
    ↓
AES-256-GCM Encrypt (with random IV)
    ↓
Encrypted Blob + IV
    ↓
Base64 Encode
    ↓
Send to Server
```

### Decryption Flow

```
Encrypted Blob (from server)
    ↓
Base64 Decode
    ↓
Extract IV
    ↓
AES-256-GCM Decrypt (using MEK)
    ↓
Plaintext Data
```

---

## State Management

### Local Storage

Minimal state persisted locally:

- `mediqr_onboarded` - Boolean flag
- `mediqr_mnemonic` - Mnemonic phrase (Phase 1 only - should be removed in production)
- `mediqr_local_shard` - Local recovery shard (placeholder for Phase 1)

**Storage Utilities:** `src/lib/storage.ts`

### In-Memory State

- Master encryption key (never persisted)
- Unlock status
- Current user data

---

## Routing

### Routes

- `/` - Landing page
- `/onboarding` - Onboarding flow (new users)
- `/restore` - Restore/login page (existing users)
- `/dashboard` - User dashboard
- `/vault` - Vault management page
- `/staff/login` - Staff authentication
- `/staff/scanner` - QR scanner for staff
- `/staff/patient-view/:id` - Patient record view

### Route Protection & Authentication Flow

**Citizen Routes:**

- **New Users**: Not onboarded → `/onboarding` (generate mnemonic)
- **Existing Users (Locked)**: Onboarded but vault locked → `/restore` (enter mnemonic)
- **Existing Users (Unlocked)**: Onboarded and unlocked → `/dashboard` or `/vault`

**Authentication Model:**

- Follows "Login = Restore" model from architecture
- Master key never persisted - only in memory
- Users must re-enter mnemonic after page refresh
- All decryption happens client-side

**Staff Routes:**

- Staff token stored in localStorage
- Protected routes check for staff token
- Token expires after 8 hours

---

## Styling & Theme

### Theme Configuration

Custom "Vitality & Care" color palette:

- **Primary:** Emerald Green (#059669)
- **Secondary:** Sky Blue (#38BDF8)
- **Accent:** Vivid Violet (#8B5CF6)
- **Neutral:** Cool Gray (#374151)
- **Base:** Pure White (#FFFFFF)

### DaisyUI Integration

DaisyUI components with custom theme configured in `src/index.css` using CSS variables.

### Responsive Design

- Mobile-first approach
- Tailwind breakpoints: `sm`, `md`, `lg`, `xl`
- Responsive grid layouts
- Mobile-optimized onboarding flow

---

## Security Considerations

### Key Management

- Master key stored only in memory (React state)
- Never persisted to localStorage
- Cleared on page refresh
- User must re-enter mnemonic to unlock

### Data Protection

- All PHI encrypted before storage
- Local storage only contains non-sensitive metadata
- No plaintext data in browser storage

### Best Practices

- ✅ Use Web Crypto API (browser-native)
- ✅ Generate random IVs for each encryption
- ✅ Validate mnemonic phrases
- ✅ Clear sensitive data from memory when done
- ❌ Never log encryption keys
- ❌ Never send keys to server

---

## Build & Development

### Development

```bash
npm run dev
```

Starts Vite dev server with hot module replacement.

### Build

```bash
npm run build
```

Creates production build in `dist/` directory.

### Preview

```bash
npm run preview
```

Preview production build locally.

---

## Environment Variables

### Development

Create `.env` file:

```bash
VITE_API_URL=http://localhost:4000/api
```

### Production

Set environment variables in your hosting platform:

```bash
VITE_API_URL=https://api.mediqr.com/api
```

---

## Future Enhancements

### Phase 2+

- [ ] Vault UI for managing medical records
- [ ] QR code generation component
- [ ] Social recovery guardian management
- [ ] Offline mode with service worker
- [ ] PWA installation
- [ ] Shamir's Secret Sharing implementation
- [ ] Restore/login flow for existing users
- [ ] Settings page
- [ ] Dark mode support

---

## Performance Considerations

### Code Splitting

- Routes are code-split automatically by React Router
- Crypto utilities loaded on demand

### Bundle Size

- Using modern ES modules
- Tree-shaking enabled
- Vite optimizes bundle automatically

### Optimization Opportunities

- Lazy load heavy crypto operations
- Cache encrypted blobs locally
- Implement virtual scrolling for large lists

---

## Testing Strategy

### Unit Tests (Future)

- Crypto utilities
- Storage utilities
- API client

### Integration Tests (Future)

- Onboarding flow
- Encryption/decryption flow
- API integration

### E2E Tests (Future)

- Complete user journeys
- Cross-browser testing

---

## Browser Compatibility

### Required Features

- Web Crypto API
- ES6+ JavaScript
- Local Storage
- Fetch API

### Supported Browsers

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

## Services Architecture

API communication is organized into service modules located in `src/services/`:

### Service Modules

- **`apiClient.ts`** - Base API client with shared configuration

  - `apiRequest()` - Generic fetch wrapper with error handling
  - `API_BASE_URL` - Centralized API endpoint configuration

- **`authService.ts`** - Authentication and profile management

  - `initProfile()` - Initialize user profile after onboarding

- **`vaultService.ts`** - Vault operations
  - `syncVault()` - Sync encrypted blob to server
  - `getVaultItems()` - Retrieve vault metadata

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

See [Services README](../src/services/README.md) for more details.

---

## See Also

- [Client API Documentation](./api.md)
- [Services README](../src/services/README.md)
- [Server Architecture](../../server/docs/architecture.md)
- [Final Plan](../../docs/FinalPlan.md)
- [Phase 1 Implementation](../../docs/Phase1-Implementation.md)
- [Phase 2 Implementation](../../docs/Phase2-Implementation.md)
