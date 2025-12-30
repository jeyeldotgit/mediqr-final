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
  - Shamir's Secret Sharing for social recovery
  - QR code generation with session keys

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
- **Validation:** Zod
- **Crypto:** Web Crypto API + @scure/bip39
- **State Management:** React Context API + Custom Hooks

---

## Project Structure

```
client/
├── src/
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Root component with routing
│   ├── index.css                   # Global styles + DaisyUI theme
│   │
│   ├── components/                 # UI Components (organized by page)
│   │   ├── dashboard/              # Dashboard-specific components
│   │   │   ├── ActionCards.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── EmergencyCard.tsx
│   │   │   ├── QRGenerator.tsx
│   │   │   └── index.ts
│   │   ├── landing/                # Landing page components
│   │   │   ├── CTASection.tsx
│   │   │   ├── FeaturesSection.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── SecuritySection.tsx
│   │   │   └── index.ts
│   │   ├── onboarding/             # Onboarding components
│   │   │   ├── MnemonicDisplay.tsx
│   │   │   ├── MnemonicVerify.tsx
│   │   │   └── index.ts
│   │   ├── staff-patient-view/     # Staff patient view components
│   │   │   ├── AccessInfoCard.tsx
│   │   │   ├── PatientRecordCard.tsx
│   │   │   └── index.ts
│   │   ├── vault/                  # Vault components
│   │   │   ├── VaultCategoryForm.tsx
│   │   │   └── index.ts
│   │   ├── shared/                 # Shared/reusable components
│   │   │   ├── EducationModal.tsx
│   │   │   └── index.ts
│   │   └── index.ts                # Barrel export
│   │
│   ├── contexts/
│   │   └── CryptoProvider.tsx      # Crypto state management
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuthGuard.ts         # Authentication redirects
│   │   ├── useDashboard.ts         # Dashboard data aggregation
│   │   ├── useOnboarding.ts        # Onboarding flow management
│   │   ├── usePatientData.ts       # Patient data loading/decryption
│   │   ├── useQRGenerator.ts       # QR code generation
│   │   ├── useVault.ts             # Vault CRUD operations
│   │   └── index.ts                # Barrel export
│   │
│   ├── pages/                      # Page components (composition only)
│   │   ├── Dashboard.tsx
│   │   ├── Guardians.tsx
│   │   ├── Landing.tsx
│   │   ├── Onboarding.tsx
│   │   ├── RecoveryOptions.tsx
│   │   ├── Restore.tsx
│   │   ├── Settings.tsx
│   │   ├── StaffEmergency.tsx
│   │   ├── StaffLogin.tsx
│   │   ├── StaffPatientView.tsx
│   │   ├── StaffScanner.tsx
│   │   └── Vault.tsx
│   │
│   ├── schemas/                    # Zod validation schemas
│   │   ├── onboarding.schema.ts    # Mnemonic validation
│   │   ├── vault.schema.ts         # Vault form validation
│   │   └── index.ts                # Barrel export
│   │
│   ├── services/                   # API services (pure logic)
│   │   ├── apiClient.ts            # Base API client
│   │   ├── authService.ts          # Authentication
│   │   ├── emergencyService.ts     # Break-glass access
│   │   ├── guardianService.ts      # Guardian management
│   │   ├── offlineVaultService.ts  # Offline storage
│   │   ├── qrService.ts            # QR token rotation
│   │   ├── recoveryService.ts      # Social recovery
│   │   ├── staffService.ts         # Staff operations
│   │   ├── vaultService.ts         # Vault operations
│   │   └── README.md
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── patient.types.ts        # Patient-related types
│   │   ├── vault.types.ts          # Vault-related types
│   │   └── index.ts                # Barrel export
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── storage.ts              # Local storage utilities
│   │   └── crypto/                 # Cryptography utilities
│   │       ├── aes.ts              # AES-256-GCM encryption
│   │       ├── identifier.ts       # Public key & hash generation
│   │       ├── keyDerivation.ts    # MEK derivation
│   │       ├── mnemonic.ts         # BIP-39 utilities
│   │       ├── qrKeyDerivation.ts  # QR session key derivation
│   │       ├── sessionKey.ts       # Session key management
│   │       ├── shamir.ts           # Shamir's Secret Sharing
│   │       └── shardDistribution.ts
│   │
│   └── assets/                     # Static assets
│
├── docs/                           # Documentation
│   ├── api.md                      # API documentation
│   └── architecture.md             # This file
│
├── public/                         # Public assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Architecture Layers

### Pages (Composition Layer)

Pages handle **layout and composition only** - no business logic or API calls.

```typescript
// src/pages/Dashboard.tsx - ~100 lines
const Dashboard = () => {
  const { isUnlocked } = useCrypto();
  const dashboardState = useDashboard();

  // Composition only - delegates to components and hooks
  return (
    <div>
      <DashboardStats {...dashboardState} />
      <ActionCards />
      <QRGenerator />
    </div>
  );
};
```

### Hooks (Behavior Layer)

Hooks encapsulate **state management, data fetching, and business logic**.

```typescript
// src/hooks/useVault.ts
export const useVault = (): UseVaultReturn => {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);

  const handleSubmit = async (category: VaultCategory) => {
    // Encryption logic, API calls, state updates
  };

  return { vaultItems, handleSubmit, ... };
};
```

### Services (API Layer)

Services handle **pure API communication** - no React, no state.

```typescript
// src/services/vaultService.ts
export const syncVault = async (
  ownerId: string,
  category: VaultCategory,
  encryptedData: string,
  iv: string
): Promise<SyncVaultResponse> => {
  return apiRequest<SyncVaultResponse>("/vault/sync", { ... });
};
```

### Components (UI Layer)

Components handle **rendering** - receive props, display UI.

```typescript
// src/components/dashboard/DashboardStats.tsx
interface DashboardStatsProps {
  totalItems: number;
  categoryCounts: Record<string, number>;
  loading: boolean;
}

export const DashboardStats = ({
  totalItems,
  categoryCounts,
  loading,
}: DashboardStatsProps) => {
  return <div>...</div>;
};
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

### Custom Hooks

| Hook             | Purpose                                |
| ---------------- | -------------------------------------- |
| `useAuthGuard`   | Authentication state and redirects     |
| `useDashboard`   | Dashboard data aggregation             |
| `useOnboarding`  | Onboarding flow management             |
| `usePatientData` | Patient data loading and decryption    |
| `useQRGenerator` | QR code generation with token rotation |
| `useVault`       | Vault CRUD operations and encryption   |

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

### Session Key Derivation (for QR)

```
MEK + QR Token + User ID
    ↓
HKDF derivation
    ↓
Session Key (ephemeral)
    ↓
Used for vault encryption
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

### Social Recovery (Shamir's Secret Sharing)

```
Master Key
    ↓
Split into N shards (threshold K)
    ↓
Encrypt each shard for guardian
    ↓
Store shards with guardians
    ↓
Recovery: Collect K shards → Reconstruct
```

---

## Routing

### Citizen Routes

| Route                 | Page            | Description               |
| --------------------- | --------------- | ------------------------- |
| `/`                   | Landing         | Marketing/landing page    |
| `/onboarding`         | Onboarding      | New user setup            |
| `/restore`            | Restore         | Existing user login       |
| `/dashboard`          | Dashboard       | User dashboard            |
| `/vault`              | Vault           | Medical record management |
| `/settings`           | Settings        | User settings             |
| `/settings/recovery`  | RecoveryOptions | Recovery setup            |
| `/settings/guardians` | Guardians       | Guardian management       |

### Staff Routes

| Route                     | Page             | Description          |
| ------------------------- | ---------------- | -------------------- |
| `/staff/login`            | StaffLogin       | Staff authentication |
| `/staff/scanner`          | StaffScanner     | QR scanner           |
| `/staff/emergency`        | StaffEmergency   | Break-glass access   |
| `/staff/patient-view/:id` | StaffPatientView | Patient record view  |

### Authentication Model

- **New Users**: Not onboarded → `/onboarding` (generate mnemonic)
- **Existing Users (Locked)**: Onboarded but vault locked → `/restore` (enter mnemonic)
- **Existing Users (Unlocked)**: Onboarded and unlocked → `/dashboard` or `/vault`
- **Staff**: Token-based auth stored in localStorage, expires after 8 hours

---

## Validation with Zod

Schemas are the **single source of truth** for form validation.

### Vault Schemas

```typescript
// src/schemas/vault.schema.ts
import { z } from "zod";

export const identitySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodType: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const allergiesSchema = z.object({
  allergen: z.string().min(1, "Allergen is required"),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
  reaction: z.string().optional(),
  notes: z.string().optional(),
});

// Type inference from schema
export type IdentityFormData = z.infer<typeof identitySchema>;
```

### Onboarding Schema

```typescript
// src/schemas/onboarding.schema.ts
export const mnemonicSchema = z.object({
  phrase: z
    .string()
    .min(1, "Recovery phrase is required")
    .refine(
      (val) => val.split(" ").length === 12,
      "Recovery phrase must be exactly 12 words"
    ),
});
```

---

## State Management

### Local Storage

Minimal state persisted locally:

- `mediqr_onboarded` - Boolean flag
- `mediqr_user_id` - User identifier
- `mediqr_staff_token` - Staff JWT token
- `mediqr_offline_vault` - Offline vault data (encrypted)

**Storage Utilities:** `src/lib/storage.ts`

### In-Memory State

- Master encryption key (never persisted)
- Unlock status
- Current user data

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
- Offline vault stores encrypted blobs only

### Best Practices

- ✅ Use Web Crypto API (browser-native)
- ✅ Generate random IVs for each encryption
- ✅ Validate mnemonic phrases with Zod
- ✅ Clear sensitive data from memory when done
- ❌ Never log encryption keys
- ❌ Never send keys to server

---

## Component Organization Rules

### File Size

- **Max 200 lines** per file
- Single responsibility per component
- Extract complex logic to hooks

### Component Syntax

```typescript
// ✅ Arrow function components
export const MyComponent = ({ prop }: Props) => {
  return <div>{prop}</div>;
};

// ❌ Avoid React.FC and default function exports
export default function MyComponent() { ... }
```

### Folder Structure

Components organized by the page they belong to:

```
components/
├── dashboard/       # Dashboard page components
├── landing/         # Landing page components
├── onboarding/      # Onboarding components
├── staff-patient-view/  # Staff view components
├── vault/           # Vault components
├── shared/          # Reusable across pages
└── index.ts         # Barrel export
```

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

### Type Check

```bash
npx tsc --noEmit
```

---

## Environment Variables

### Development

Create `.env` file:

```bash
VITE_API_URL=http://localhost:4000/api
```

### Production

```bash
VITE_API_URL=https://api.mediqr.com/api
```

---

## See Also

- [Client API Documentation](./api.md)
- [Services README](../src/services/README.md)
- [Server Architecture](../../server/docs/architecture.md)
- [Final Plan](../../docs/FinalPlan.md)
