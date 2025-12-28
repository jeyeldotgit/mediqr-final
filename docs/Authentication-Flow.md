# MediQR Authentication Flow

## Overview

MediQR implements a self-sovereign authentication model where "Login = Restore". Users authenticate by restoring their master encryption key from their 12-word mnemonic phrase. The master key is never persisted - it only exists in memory during an active session.

## Citizen Authentication

### New User Flow

1. **Onboarding** (`/onboarding`)
   - User generates 12-word BIP-39 mnemonic phrase
   - User verifies phrase by selecting words in correct order
   - Master Encryption Key (MEK) derived from mnemonic
   - Profile created on backend with public key
   - User marked as "onboarded" in localStorage
   - Redirected to dashboard

### Existing User Flow

1. **Restore/Login** (`/restore`)
   - User enters their 12-word mnemonic phrase
   - Mnemonic validated for format and structure
   - MEK derived from mnemonic
   - Crypto context unlocked with MEK
   - Redirected to dashboard

2. **Session Management**
   - Master key stored only in React state (memory)
   - On page refresh, key is lost
   - User must re-enter mnemonic to restore access
   - No server-side session management

### Route Protection Logic

```typescript
// Check onboarding status
if (!isOnboarded()) {
  // New user - go to onboarding
  navigate("/onboarding");
} else if (!isUnlocked) {
  // Existing user but locked - go to restore
  navigate("/restore");
} else {
  // User is unlocked - access granted
  // Show dashboard/vault
}
```

### Security Model

- **No Password Storage**: Authentication is cryptographic, not password-based
- **Client-Side Only**: Mnemonic never sent to server
- **Memory-Only Keys**: Master key never persisted to localStorage
- **Zero-Knowledge**: Server never sees plaintext data or keys

## Staff Authentication

### Staff Login Flow

1. **Login** (`/staff/login`)
   - Staff enters email, password, and role
   - Backend authenticates (Phase 3 MVP: simple email/password)
   - Backend issues JWT token (8-hour expiry)
   - Token stored in localStorage
   - Redirected to scanner

2. **Session Management**
   - JWT token stored in localStorage
   - Token validated on each API request
   - Token expires after 8 hours
   - Staff must re-login after expiry

### Staff Routes

- `/staff/login` - Staff authentication
- `/staff/scanner` - QR scanner (requires staff token)
- `/staff/patient-view/:id` - Patient records (requires staff token)

## Authentication States

### Citizen States

| State | Onboarded | Unlocked | Route |
|-------|-----------|----------|-------|
| New User | ❌ | ❌ | `/onboarding` |
| Returning (Locked) | ✅ | ❌ | `/restore` |
| Active Session | ✅ | ✅ | `/dashboard` |

### Staff States

| State | Authenticated | Route |
|-------|---------------|-------|
| Not Logged In | ❌ | `/staff/login` |
| Logged In | ✅ | `/staff/scanner` |

## Key Derivation

### Master Encryption Key (MEK)

```
12-word BIP-39 Mnemonic
    ↓
BIP-39 Seed (128 bits)
    ↓
PBKDF2-SHA256 (100,000 iterations)
    ↓
Master Encryption Key (256 bits)
```

### Fragment Generation (for QR codes)

Since the master key is not extractable, fragments are derived by:
1. Encrypting a known plaintext with the master key
2. Using a deterministic IV (derived from user ID)
3. Taking first 16 bytes of ciphertext as fragment

## Future Enhancements

### Phase 4: Social Recovery

- Users can recover access using 2-of-3 Shamir Secret Sharing shards
- Shards stored with guardians and in Supabase backup
- Recovery flow will allow mnemonic OR shard-based restoration

### Production Considerations

- Remove mnemonic storage from localStorage (Phase 1 only)
- Implement proper key derivation for fragments
- Add session timeout warnings
- Add biometric authentication (optional)
- Integrate with professional registries for staff auth

## Security Best Practices

1. **Never Log Mnemonics**: Mnemonic phrases should never appear in logs
2. **Clear Memory**: Master keys cleared when user locks/logs out
3. **HTTPS Only**: All authentication must happen over HTTPS
4. **Token Expiry**: Short-lived tokens (1h for QR, 8h for staff)
5. **Access Logging**: All access attempts logged for audit

## Error Handling

### Invalid Mnemonic
- Show error message
- Allow user to retry
- Do not reveal which part is wrong (security)

### Network Errors
- Profile creation can fail - user can retry later
- Encryption still works locally
- Sync can happen when network is available

### Token Expiry
- Staff tokens expire after 8 hours
- QR tokens expire after 1 hour
- Users must re-authenticate when tokens expire

