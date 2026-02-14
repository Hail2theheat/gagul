-- Fix: Add FK from fireside_comments.user_id to profiles.id
-- PostgREST needs this FK to resolve the join in getComments()
-- (The existing FK to auth.users is not visible to PostgREST's schema cache)

ALTER TABLE fireside_comments
  ADD CONSTRAINT fireside_comments_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
