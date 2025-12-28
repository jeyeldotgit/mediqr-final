# Vault Storage Setup Guide

## Overview

The `vault` storage bucket in Supabase Storage is used to store encrypted medical blobs. This document explains how to set up the bucket and configure its access policies.

## Prerequisites

- Supabase project with Storage enabled
- Service role key (for backend operations)

## Step 1: Create the Storage Bucket

### Option A: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name:** `vault`
   - **Public bucket:** ❌ **Unchecked** (Private)
   - **File size limit:** 50 MB (or as needed)
   - **Allowed MIME types:**
     - `application/octet-stream`
     - `application/json`
     - `text/plain`
5. Click **Create bucket**

### Option B: Via SQL

Run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false,  -- Private bucket
  52428800,  -- 50MB file size limit
  ARRAY['application/octet-stream', 'application/json', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;
```

## Step 2: Configure Storage Policies

Storage policies control who can access files in the bucket. For the vault bucket, we want:

- ✅ **Service role** can upload, read, and delete files
- ❌ **Public** cannot access files
- ❌ **Authenticated users** cannot directly access files (must go through API)

### Apply Policies via SQL Editor

Run the policies from `002_vault_storage_policies.sql`:

```sql
-- Allow service role to upload
CREATE POLICY "vault_service_role_upload"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'vault' AND
  (storage.foldername(name))[1] ~ '^[a-f0-9]{8}$'
);

-- Allow service role to read
CREATE POLICY "vault_service_role_read"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'vault');

-- Allow service role to delete
CREATE POLICY "vault_service_role_delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'vault');

-- Deny public access
CREATE POLICY "vault_deny_public"
ON storage.objects
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Deny authenticated users direct access
CREATE POLICY "vault_deny_authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
```

### Apply Policies via Dashboard

1. Go to **Storage** → **Policies**
2. Select the `vault` bucket
3. Click **New Policy**
4. For each policy:
   - **Policy name:** e.g., `vault_service_role_upload`
   - **Allowed operation:** INSERT/SELECT/DELETE
   - **Target roles:** `service_role`
   - **Policy definition:** Copy from SQL above

## Step 3: Verify Setup

### Test Upload (via Backend)

The backend should be able to upload files when using the service role key. Test with:

```bash
curl -X POST http://localhost:4000/api/vault/sync \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user-uuid",
    "category": "identity",
    "encryptedData": "base64-encoded-data",
    "iv": "base64-encoded-iv"
  }'
```

### Verify Policies

Check that:

- ✅ Service role can upload files
- ✅ Service role can read files
- ❌ Public cannot access files (should get 403)
- ❌ Authenticated users cannot directly access files

## Security Considerations

### 1. Private Bucket

The vault bucket must be **private**. Never make it public, as it contains encrypted medical data.

### 2. Service Role Only

Only the backend (using service role key) should access the bucket directly. Clients should never access storage directly.

### 3. Hashed Paths

File paths are hashed to prevent identity leakage:

- Format: `vault/{hash8}/{fullhash}.enc`
- Paths don't reveal user identity or content

### 4. Ownership Validation

The backend validates ownership before serving files. The storage policies are a defense-in-depth measure.

### 5. No Public URLs

Never generate public URLs for vault files. All access should go through the backend API.

## File Structure

Files are stored with the following structure:

```
vault/
├── a1b2c3d4/
│   ├── a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2.enc
│   └── ...
├── f9e8d7c6/
│   └── ...
└── ...
```

The first 8 characters create a folder structure to avoid too many files in a single directory.

## Troubleshooting

### Error: "Bucket not found"

- Ensure the bucket is created with the exact name `vault`
- Check bucket exists in Supabase Dashboard → Storage

### Error: "Permission denied"

- Verify service role key is set correctly in `.env`
- Check storage policies are applied
- Ensure bucket is private (not public)

### Error: "Policy violation"

- Review storage policies in Supabase Dashboard
- Ensure service role has INSERT/SELECT/DELETE permissions
- Check policy conditions match bucket name

### Files not uploading

- Check file size is within limit (default 50MB)
- Verify MIME type is allowed
- Check backend logs for detailed error messages

## Maintenance

### Monitoring

- Monitor storage usage in Supabase Dashboard
- Set up alerts for unusual activity
- Review access logs regularly

### Cleanup

- Implement cleanup for orphaned files (files without metadata)
- Archive old files if needed
- Monitor storage costs

## See Also

- [Storage Policies Documentation](https://supabase.com/docs/guides/storage/security/access-control)
- [Backend Vault Controller](../src/controllers/vaultController.ts)
- [API Documentation](./api.md)
