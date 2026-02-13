-- 043: Ensure storage bucket and policies exist for uploads
-- Run this if media files aren't loading properly

-- Create the uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to read any file in uploads
CREATE POLICY "Authenticated users can read uploads" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Allow users to update their own files
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');
