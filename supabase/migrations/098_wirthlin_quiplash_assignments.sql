-- Assign quiplash for Wirthlin Family week of 2/9
-- Jazz Inventor (a2abc770): 2 people, Pilot Panic (af33daab): 3 people
-- Randomized assignment

DO $$
DECLARE
  v_members UUID[];
  v_matchup_jazz UUID := gen_random_uuid();
  v_matchup_pilot UUID := gen_random_uuid();
BEGIN
  -- Get members in random order
  SELECT array_agg(user_id ORDER BY random()) INTO v_members
  FROM group_members
  WHERE group_id = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';

  -- First 2 get Jazz Inventor
  INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id) VALUES
    ('a2abc770-db32-4545-92d1-55d5618a7be7', v_members[1], v_matchup_jazz),
    ('a2abc770-db32-4545-92d1-55d5618a7be7', v_members[2], v_matchup_jazz);

  -- Last 3 get Pilot Panic
  INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id) VALUES
    ('af33daab-8103-4ef6-b59c-88e79909ca66', v_members[3], v_matchup_pilot),
    ('af33daab-8103-4ef6-b59c-88e79909ca66', v_members[4], v_matchup_pilot),
    ('af33daab-8103-4ef6-b59c-88e79909ca66', v_members[5], v_matchup_pilot);
END;
$$;
