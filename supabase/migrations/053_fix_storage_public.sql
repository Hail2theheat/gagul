-- Make uploads bucket public for reading (still requires auth to upload)
-- This fixes the issue where other users' photos don't load
UPDATE storage.buckets
SET public = true
WHERE id = 'uploads';

-- Also add a public read policy for anyone (not just authenticated users)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');
