# Compliance & Data Flow Documentation

## Overview

This document provides a comprehensive overview of data flows, security measures, and compliance features for MediQR. It is designed to assist with regulatory compliance (HIPAA, GDPR, etc.) and security audits.

## Zero-Knowledge Architecture

### Core Principle

MediQR implements a **zero-knowledge architecture** where:
- **Server never sees plaintext PHI**: All Protected Health Information (PHI) is encrypted client-side before transmission
- **Server only handles encrypted blobs**: The backend stores and serves encrypted data but cannot decrypt it
- **Decryption keys never leave client**: Master encryption keys remain on the patient's device

### Data Flow Diagrams

#### 1. Patient Data Storage Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT DEVICE                           │
│                                                              │
│  1. Patient enters medical data (plaintext)                 │
│  2. Master Key (from mnemonic) → Session Key derivation      │
│  3. AES-256-GCM encryption (client-side)                    │
│  4. Encrypted blob + IV (base64)                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK (HTTPS)                          │
│                                                              │
│  Encrypted blob (no plaintext PHI)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                         │
│                                                              │
│  1. Receives encrypted blob                                │
│  2. Stores in PostgreSQL (medical_blobs table)              │
│  3. Stores encrypted file in Supabase Storage               │
│  4. Returns blob ID and metadata                           │
│                                                              │
│  ⚠️ Server CANNOT decrypt data (no access to keys)         │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Staff Access Flow (QR Scan)

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT DEVICE                            │
│                                                              │
│  1. Generate QR code with:                                  │
│     - Fragment (derived from master key)                     │
│     - Token (JWT from backend)                              │
│     - Patient ID                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (QR Code Scan)
┌─────────────────────────────────────────────────────────────┐
│                    STAFF DEVICE                             │
│                                                              │
│  1. Scan QR code → Extract fragment + token               │
│  2. Authenticate staff (JWT)                               │
│  3. Send request to backend with:                          │
│     - Staff JWT token                                       │
│     - Patient QR token                                      │
│     - Patient ID                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│                                                              │
│  1. Verify staff JWT token                                  │
│  2. Verify patient QR token                                 │
│  3. Validate patient ID matches                            │
│  4. Fetch encrypted blobs from database                    │
│  5. Generate signed URLs for blob access                   │
│  6. Log access attempt (audit trail)                      │
│  7. Return blob metadata + signed URLs                     │
│                                                              │
│  ⚠️ Backend does NOT decrypt data                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STAFF DEVICE                             │
│                                                              │
│  1. Receive signed URLs                                    │
│  2. Fetch encrypted blobs from Supabase Storage            │
│  3. Derive session key from fragment + token              │
│  4. Decrypt blobs client-side                              │
│  5. Display decrypted medical records                     │
│                                                              │
│  ⚠️ Decryption happens ONLY on staff device                │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Emergency Break-Glass Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ER ADMIN DEVICE                          │
│                                                              │
│  1. Authenticate as er_admin                                │
│  2. Request break-glass access with:                        │
│     - Patient ID                                            │
│     - Justification (10-500 chars)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                              │
│                                                              │
│  1. Verify er_admin role                                   │
│  2. Validate justification                                 │
│  3. Fetch encrypted blobs                                  │
│  4. Generate signed URLs                                    │
│  5. Log break-glass event (immutable audit log)            │
│  6. Return blob metadata + signed URLs                     │
│                                                              │
│  ⚠️ Break-glass provides URLs but NOT decryption keys     │
│  ⚠️ Decryption still requires QR fragment                │
└─────────────────────────────────────────────────────────────┘
```

## Data Storage Architecture

### Database Schema

#### `profiles` Table
- **Purpose**: User account information
- **PHI Stored**: None (only user IDs, roles, timestamps)
- **Encryption**: Not applicable (no sensitive data)
- **Access**: Row-Level Security (RLS) policies

#### `medical_blobs` Table
- **Purpose**: Metadata for encrypted medical records
- **PHI Stored**: None (only blob IDs, categories, timestamps, IVs)
- **Encryption**: Not applicable (metadata only)
- **Access**: Service role only (bypasses RLS)

#### `recovery_shards` Table
- **Purpose**: Encrypted Shamir's Secret Sharing shards
- **PHI Stored**: None (encrypted shards only)
- **Encryption**: Client-side encrypted before storage
- **Access**: Service role only

#### `access_logs` Table
- **Purpose**: Immutable audit trail
- **PHI Stored**: None (only IDs, methods, timestamps, justifications)
- **Encryption**: Not applicable (audit data only)
- **Access**: Append-only (service role)

### Supabase Storage

#### `vault` Bucket
- **Purpose**: Store encrypted blob files
- **PHI Stored**: None (encrypted files only)
- **Encryption**: Client-side AES-256-GCM
- **Access**: Signed URLs (time-limited, 1 hour expiry)

## Security Measures

### 1. Encryption

- **Algorithm**: AES-256-GCM (Authenticated Encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV Generation**: Cryptographically secure random IV per encryption
- **Key Management**: Master keys never leave client device

### 2. Authentication & Authorization

- **Patient Authentication**: Mnemonic-based (no passwords stored)
- **Staff Authentication**: JWT tokens (8-hour expiry)
- **QR Tokens**: Short-lived (1-hour expiry)
- **Role-Based Access Control**: Enforced at API level

### 3. Audit Logging

- **All Access Attempts**: Logged to `access_logs` table
- **Immutable Logs**: Append-only, cannot be modified
- **Information Logged**:
  - Staff ID
  - Patient ID
  - Access method (QR_SCAN, BREAK_GLASS)
  - Timestamp
  - Justification (for break-glass)

### 4. Network Security

- **Transport**: HTTPS only (TLS 1.2+)
- **CORS**: Restricted to allowed origins
- **Rate Limiting**: Applied to all endpoints
- **Input Validation**: All inputs sanitized and validated

### 5. Client-Side Security

- **Key Storage**: Master keys in memory only (never persisted)
- **Idle Lock**: Automatic vault lock after 15 minutes of inactivity
- **Memory Clearing**: Keys cleared on lock/unmount
- **CSP Headers**: Content Security Policy enforced

## Compliance Features

### HIPAA Compliance

#### Administrative Safeguards
- ✅ Access controls (role-based)
- ✅ Audit logs (all access attempts)
- ✅ Security policies documented

#### Physical Safeguards
- ✅ Cloud infrastructure (Supabase) with physical security
- ✅ No physical access to patient data

#### Technical Safeguards
- ✅ Encryption at rest (encrypted blobs in storage)
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Access controls (JWT authentication)
- ✅ Audit controls (access_logs table)

#### Breach Notification
- ⚠️ Notification system planned (Phase 5+)
- ✅ Audit logs enable breach detection

### GDPR Compliance

#### Right to Access
- ✅ Patients can access their encrypted data
- ✅ Patients can download offline vault

#### Right to Erasure
- ✅ Patients can delete their account
- ✅ Encrypted blobs can be deleted
- ⚠️ Audit logs preserved (compliance requirement)

#### Data Minimization
- ✅ Only necessary data collected
- ✅ No plaintext PHI stored

#### Data Portability
- ✅ Offline vault export feature
- ✅ Encrypted data can be exported

### Zero-Knowledge Guarantees

1. **Server Cannot Decrypt**: Backend has no access to master keys
2. **No Plaintext Storage**: All PHI encrypted before storage
3. **No Plaintext Logging**: Audit logs contain no PHI
4. **Client-Side Encryption**: Encryption happens on patient device
5. **Client-Side Decryption**: Decryption happens on authorized device

## Data Flow Validation

### Validation Checklist

- [x] No plaintext PHI in database
- [x] No plaintext PHI in storage
- [x] No plaintext PHI in logs
- [x] No plaintext PHI in network traffic (except during client-side encryption)
- [x] Master keys never transmitted
- [x] Master keys never stored server-side
- [x] Session keys derived client-side
- [x] Decryption keys derived client-side

### Logging Validation

All logging is validated to ensure no PHI is logged:

```typescript
// ✅ Safe: Only IDs and metadata
console.log("Access attempt:", {
  staffId: "uuid",
  patientId: "uuid",
  method: "QR_SCAN",
  timestamp: "2024-01-01T00:00:00Z"
});

// ❌ Never: Plaintext PHI
console.log("Patient data:", decryptedData); // NEVER DO THIS
```

## Incident Response

### Data Breach Scenarios

1. **Database Breach**
   - Impact: Encrypted blobs exposed
   - Risk: Low (cannot decrypt without master keys)
   - Response: Rotate storage keys, notify patients

2. **Storage Breach**
   - Impact: Encrypted files exposed
   - Risk: Low (cannot decrypt without master keys)
   - Response: Rotate storage keys, notify patients

3. **Client Device Compromise**
   - Impact: Master key exposed if device unlocked
   - Risk: High (can decrypt patient data)
   - Response: Patient should rotate mnemonic, re-encrypt data

### Audit Trail

All security events are logged:
- Failed authentication attempts
- Successful access (QR scan, break-glass)
- Rate limit violations
- Invalid input attempts

## Recommendations for Production

1. **Key Rotation**: Implement periodic key rotation
2. **Backup Encryption**: Encrypt database backups
3. **Monitoring**: Add real-time security monitoring
4. **Notifications**: Implement breach notification system
5. **Penetration Testing**: Regular security audits
6. **Compliance Audits**: Regular compliance reviews

## Contact

For compliance questions or security concerns, contact the security team.

