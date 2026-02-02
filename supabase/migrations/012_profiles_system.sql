-- 012_profiles_system.sql
-- User profiles with avatar customization

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_config JSONB DEFAULT '{}',
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Function to check if user has profile
CREATE OR REPLACE FUNCTION has_profile()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND username IS NOT NULL
  );
END;
$$;

-- 6. Function to get profile
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile profiles;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'username', v_profile.username,
    'avatar_config', v_profile.avatar_config,
    'total_points', v_profile.total_points,
    'created_at', v_profile.created_at
  );
END;
$$;

-- 7. Function to update total points (called by triggers)
CREATE OR REPLACE FUNCTION update_profile_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update total points from weekly_points
  UPDATE profiles p
  SET total_points = COALESCE((
    SELECT SUM(total_points)
    FROM weekly_points wp
    JOIN group_members gm ON gm.group_id = wp.group_id AND gm.user_id = wp.user_id
    WHERE wp.user_id = p.id
  ), 0)
  WHERE p.id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- 8. Trigger to update profile points when weekly_points changes
DROP TRIGGER IF EXISTS trigger_update_profile_points ON weekly_points;
CREATE TRIGGER trigger_update_profile_points
  AFTER INSERT OR UPDATE ON weekly_points
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_points();

-- 9. Auto-create profile on first sign in (optional, can also be done in app)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END;
$$;
