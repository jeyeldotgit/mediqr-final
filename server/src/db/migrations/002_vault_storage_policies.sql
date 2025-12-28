-- 002_vault_storage_policies.sql
-- Storage bucket policies for the vault bucket
-- These policies control access to encrypted medical blobs in Supabase Storage

-- Note: This SQL file contains the policies that should be applied in Supabase Dashboard
-- or via the Supabase Management API. The bucket must be created first.

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create the vault bucket (run this in Supabase SQL Editor if bucket doesn't exist)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'vault',
--   'vault',
--   false,  -- Private bucket
--   52428800,  -- 50MB file size limit
--   ARRAY['application/octet-stream', 'application/json', 'text/plain']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Allow service role to upload files
-- This allows the backend (using service role key) to upload encrypted blobs
CREATE POLICY "vault_service_role_upload"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'vault' AND
  (storage.foldername(name))[1] ~ '^[a-f0-9]{8}$'  -- Ensure path format is correct
);

-- Policy: Allow service role to read files
-- This allows the backend to retrieve encrypted blobs when authorized
CREATE POLICY "vault_service_role_read"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'vault');

-- Policy: Allow service role to delete files
-- This allows the backend to clean up files if needed
CREATE POLICY "vault_service_role_delete"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'vault');

-- Policy: Deny all public access
-- Ensure no public access to vault bucket
CREATE POLICY "vault_deny_public"
ON storage.objects
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Policy: Deny authenticated users direct access
-- Users should only access vault through the backend API
CREATE POLICY "vault_deny_authenticated"
ON storage.objects
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. The vault bucket should be created as PRIVATE in Supabase Dashboard
-- 2. Only the service role should have access to this bucket
-- 3. All access should go through the backend API endpoints
-- 4. File paths are hashed to prevent identity leakage
-- 5. The backend validates ownership before serving files

-- To apply these policies:
-- 1. Go to Supabase Dashboard → Storage → Policies
-- 2. Select the 'vault' bucket
-- 3. Run the CREATE POLICY statements above
-- OR
-- 4. Use the Supabase Management API to create policies programmatically

