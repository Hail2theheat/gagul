-- 105_security_rls_core_tables.sql
-- Enable RLS on core tables that were missing it: groups, group_members, responses, prompts,
-- notification_log, reminder_log.
-- Critical security fix: without RLS any authenticated user can read/write any row.

-- ============================================================
-- 0. Helper functions (must be defined before policies that use them)
-- ============================================================

-- Check group membership without triggering RLS recursion.
-- SECURITY DEFINER bypasses RLS on group_members for the lookup.
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$;

-- Check if user is admin of a group
CREATE OR REPLACE FUNCTION is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
END;
$$;

-- ============================================================
-- 1. GROUPS table
-- ============================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can SELECT groups. This is intentional because:
-- 1. Members need to see their groups
-- 2. The invite-code join flow requires reading a group the user isn't yet a member of
-- 3. Group names/info are not sensitive (the sensitive data is in responses/prompts)
-- If you want to restrict this further, handle invite lookups via a SECURITY DEFINER function.
DROP POLICY IF EXISTS "Authenticated users can view groups" ON groups;
CREATE POLICY "Authenticated users can view groups" ON groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only the group admin can update group settings
DROP POLICY IF EXISTS "Admin can update group" ON groups;
CREATE POLICY "Admin can update group" ON groups
  FOR UPDATE USING (is_group_admin(id, auth.uid()));

-- Authenticated users can create groups
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admin can delete a group
DROP POLICY IF EXISTS "Admin can delete group" ON groups;
CREATE POLICY "Admin can delete group" ON groups
  FOR DELETE USING (is_group_admin(id, auth.uid()));

-- ============================================================
-- 2. GROUP_MEMBERS table
-- ============================================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Members can see other members in their groups
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    is_group_member(group_id, auth.uid())
  );

-- Users can insert themselves (join a group)
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership (e.g. leave)
DROP POLICY IF EXISTS "Users can update own membership" ON group_members;
CREATE POLICY "Users can update own membership" ON group_members
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own membership (leave group)
-- Admins can remove members from their groups
DROP POLICY IF EXISTS "Users can leave or admin can remove" ON group_members;
CREATE POLICY "Users can leave or admin can remove" ON group_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR is_group_admin(group_id, auth.uid())
  );

-- ============================================================
-- 3. RESPONSES table
-- ============================================================
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Members can view responses in their groups
-- Uses is_group_member() to avoid RLS recursion through group_members
DROP POLICY IF EXISTS "Members can view group responses" ON responses;
CREATE POLICY "Members can view group responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_prompts gp
      WHERE gp.id = responses.group_prompt_id
        AND is_group_member(gp.group_id, auth.uid())
    )
  );

-- Users can insert their own responses (must be a group member)
DROP POLICY IF EXISTS "Members can submit responses" ON responses;
CREATE POLICY "Members can submit responses" ON responses
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_prompts gp
      WHERE gp.id = responses.group_prompt_id
        AND is_group_member(gp.group_id, auth.uid())
    )
  );

-- Users can update their own responses (e.g. edit before deadline)
DROP POLICY IF EXISTS "Users can update own responses" ON responses;
CREATE POLICY "Users can update own responses" ON responses
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own responses
DROP POLICY IF EXISTS "Users can delete own responses" ON responses;
CREATE POLICY "Users can delete own responses" ON responses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. PROMPTS table (global prompt pool)
-- ============================================================
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read prompts (they're a shared pool)
DROP POLICY IF EXISTS "Authenticated users can read prompts" ON prompts;
CREATE POLICY "Authenticated users can read prompts" ON prompts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only service role / admin should insert prompts (no client INSERT policy)
-- If admin UI is needed, add a policy scoped to an admin role.

-- ============================================================
-- 5. NOTIFICATION_LOG table
-- ============================================================
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Only service role needs to read/write notification_log.
-- No client-side policies needed (notifications are sent server-side).
-- If the app needs to read notification status, add a SELECT policy.

-- ============================================================
-- 6. REMINDER_LOG table
-- ============================================================
ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;

-- Same as notification_log - server-side only.
-- No client-side policies needed.
