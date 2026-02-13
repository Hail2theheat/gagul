-- 107_security_profiles_storage.sql
-- 1. Restrict profiles UPDATE to exclude total_points/weekly_points columns
-- 2. Revert storage bucket to private (public=true was set in 053)
-- 3. Scope storage policies to user's own uploads

-- ============================================================
-- 1. Restrict profiles UPDATE policy
-- ============================================================
-- The current policy "Users can update own profile" allows updating ANY column
-- including total_points and weekly_points. Replace it with a column-restricted version.
--
-- PostgreSQL RLS doesn't support column-level WITH CHECK, so we use a trigger
-- to prevent clients from directly modifying point columns.

CREATE OR REPLACE FUNCTION protect_profile_points()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Allow point modifications only from our SECURITY DEFINER functions.
  -- They set a session variable before updating points.
  IF current_setting('app.bypass_points_protection', true) IS DISTINCT FROM 'true' THEN
    -- Preserve point columns - clients cannot modify these directly
    NEW.total_points := OLD.total_points;
    NEW.weekly_points := OLD.weekly_points;
    NEW.last_streak_bonus_week := OLD.last_streak_bonus_week;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_points ON profiles;
CREATE TRIGGER trigger_protect_profile_points
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_points();

-- ============================================================
-- 2. Revert storage bucket to private
-- ============================================================
-- Migration 053 set public=true. Revert to false so files require auth.
UPDATE storage.buckets
SET public = false
WHERE id = 'uploads';

-- Remove the overly permissive public read policy from 053
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- ============================================================
-- 3. Scope storage upload policy to user's own folder
-- ============================================================
-- Replace the broad "any auth user can upload anywhere" policy with
-- a scoped policy that restricts uploads to user-owned paths.

-- Drop old broad policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read uploads" ON storage.objects;

-- Users can upload to their own folder: uploads/{user_id}/*
-- Also allow telephone/* folder (used for telephone game drawings)
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
CREATE POLICY "Users upload to own folder" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND (
    -- User's own folder
    (storage.foldername(name))[1] = auth.uid()::text
    -- Telephone drawings folder (shared game assets)
    OR (storage.foldername(name))[1] = 'telephone'
  )
);

-- Authenticated users can read all uploads in their groups' context
-- (Keeping broad read access since responses/photos need to be visible to group members)
DROP POLICY IF EXISTS "Authenticated users can read uploads" ON storage.objects;
CREATE POLICY "Authenticated users can read uploads" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'uploads');

-- Users can update their own uploads
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own uploads
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Keep the telephone-specific policies from 080 (they're now redundant with the
-- broader policy above, but dropping them is cleaner)
DROP POLICY IF EXISTS "Users upload telephone drawings" ON storage.objects;
DROP POLICY IF EXISTS "Users read telephone drawings" ON storage.objects;
