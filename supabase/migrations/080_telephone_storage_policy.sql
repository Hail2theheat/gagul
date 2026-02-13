-- Ensure storage policies allow telephone drawings

-- Allow authenticated users to upload to telephone folder
DO $$
BEGIN
  -- Drop existing policy if it exists and recreate
  DROP POLICY IF EXISTS "Users upload telephone drawings" ON storage.objects;

  CREATE POLICY "Users upload telephone drawings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = 'telephone'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy creation error: %', SQLERRM;
END $$;

-- Allow users to read telephone drawings
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users read telephone drawings" ON storage.objects;

  CREATE POLICY "Users read telephone drawings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'uploads' AND
    (storage.foldername(name))[1] = 'telephone'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy creation error: %', SQLERRM;
END $$;

-- Make sure uploads bucket exists and is configured
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;
