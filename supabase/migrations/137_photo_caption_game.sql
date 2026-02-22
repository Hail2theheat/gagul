-- Migration 137: Photo Caption Game
-- New prompt type where a photo is displayed and all members write captions,
-- then vote on the best one.

-- 1. Update type constraint to include photo_caption
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_type_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_type_check
  CHECK (type IN ('short_text', 'long_text', 'photo', 'multiple_choice', 'quiz', 'quiplash', 'voice', 'video', 'photo_caption'));

-- 2. Add media_url column to prompts table (for prompt-level photos)
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS media_url TEXT;

-- 2. Create caption_votes table
CREATE TABLE IF NOT EXISTS caption_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_prompt_id UUID NOT NULL REFERENCES group_prompts(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_prompt_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_caption_votes_group_prompt ON caption_votes(group_prompt_id);
CREATE INDEX IF NOT EXISTS idx_caption_votes_voter ON caption_votes(voter_id);

-- 3. RLS policies
ALTER TABLE caption_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view caption votes" ON caption_votes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_prompts gp
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE gp.id = caption_votes.group_prompt_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users insert own caption votes" ON caption_votes
FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users update own caption votes" ON caption_votes
FOR UPDATE USING (auth.uid() = voter_id);

-- 4. RPC: submit_caption_vote
CREATE OR REPLACE FUNCTION submit_caption_vote(
  p_group_prompt_id UUID,
  p_response_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_owner UUID;
  v_prompt_type TEXT;
BEGIN
  -- Verify this is a photo_caption prompt
  SELECT p.type INTO v_prompt_type
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.id = p_group_prompt_id;

  IF v_prompt_type != 'photo_caption' THEN
    RETURN jsonb_build_object('error', 'Not a photo caption prompt');
  END IF;

  -- Get the response owner to prevent self-voting
  SELECT user_id INTO v_response_owner
  FROM responses
  WHERE id = p_response_id AND group_prompt_id = p_group_prompt_id;

  IF v_response_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Response not found');
  END IF;

  IF v_response_owner = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot vote for your own caption');
  END IF;

  -- Upsert the vote
  INSERT INTO caption_votes (group_prompt_id, voter_id, voted_for_response_id)
  VALUES (p_group_prompt_id, auth.uid(), p_response_id)
  ON CONFLICT (group_prompt_id, voter_id)
  DO UPDATE SET voted_for_response_id = p_response_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 5. RPC: get_caption_voting_data (for group page voting card)
CREATE OR REPLACE FUNCTION get_caption_voting_data(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB := '[]'::jsonb;
  v_prompt RECORD;
  v_responses JSONB;
  v_user_vote UUID;
  v_user_responded BOOLEAN;
BEGIN
  FOR v_prompt IN (
    SELECT gp.id as group_prompt_id, gp.expires_at,
           p.content, p.title, p.media_url as prompt_media_url
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND p.type = 'photo_caption'
      AND gp.week_of = date_trunc('week', now())::date
      AND gp.expires_at <= now()
  ) LOOP
    SELECT jsonb_agg(jsonb_build_object(
      'response_id', r.id,
      'content', r.content,
      'user_id', r.user_id
    )) INTO v_responses
    FROM responses r
    WHERE r.group_prompt_id = v_prompt.group_prompt_id;

    SELECT EXISTS (
      SELECT 1 FROM responses
      WHERE group_prompt_id = v_prompt.group_prompt_id AND user_id = auth.uid()
    ) INTO v_user_responded;

    SELECT voted_for_response_id INTO v_user_vote
    FROM caption_votes
    WHERE group_prompt_id = v_prompt.group_prompt_id AND voter_id = auth.uid();

    v_result := v_result || jsonb_build_object(
      'group_prompt_id', v_prompt.group_prompt_id,
      'prompt_content', v_prompt.content,
      'prompt_title', v_prompt.title,
      'prompt_media_url', v_prompt.prompt_media_url,
      'responses', COALESCE(v_responses, '[]'::jsonb),
      'has_responded', v_user_responded,
      'has_voted', v_user_vote IS NOT NULL,
      'voted_for', v_user_vote
    );
  END LOOP;

  RETURN v_result;
END;
$$;

-- 6. RPC: get_caption_results (for fireside display)
CREATE OR REPLACE FUNCTION get_caption_results(p_group_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'response_id', r.id,
      'user_id', r.user_id,
      'username', COALESCE(pr.username, 'Anonymous'),
      'avatar_config', pr.avatar_config,
      'content', r.content,
      'votes', COALESCE(vc.vote_count, 0)
    ) ORDER BY COALESCE(vc.vote_count, 0) DESC, r.submitted_at ASC
  ) INTO v_result
  FROM responses r
  LEFT JOIN profiles pr ON pr.id = r.user_id
  LEFT JOIN (
    SELECT voted_for_response_id, COUNT(*) as vote_count
    FROM caption_votes
    WHERE group_prompt_id = p_group_prompt_id
    GROUP BY voted_for_response_id
  ) vc ON vc.voted_for_response_id = r.id
  WHERE r.group_prompt_id = p_group_prompt_id;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 7. Update category rotation to include photo_caption
CREATE OR REPLACE FUNCTION get_next_category(current_category TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE current_category
    WHEN 'text' THEN 'text_silly'
    WHEN 'text_silly' THEN 'multiple_choice'
    WHEN 'multiple_choice' THEN 'photo'
    WHEN 'photo' THEN 'quiplash'
    WHEN 'quiplash' THEN 'photo_caption'
    WHEN 'photo_caption' THEN 'text'
    ELSE 'text'
  END;
END;
$$;

-- 8. Update get_group_status to include media_url
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response_id UUID;
  v_rating_id UUID;
  v_rating_value INTEGER;
  v_members JSONB;
  v_has_responded BOOLEAN := false;
  v_has_rated BOOLEAN := false;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
         p.category, p.payload, p.is_most_likely, p.is_majority_guess, p.media_url
  INTO v_active
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM responses r
      WHERE r.group_prompt_id = gp.id AND r.user_id = auth.uid()
    )
  ORDER BY gp.scheduled_for ASC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
           p.category, p.payload, p.is_most_likely, p.is_majority_guess, p.media_url
    INTO v_active
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.scheduled_for <= now()
      AND gp.expires_at > now()
      AND gp.is_active = true
    ORDER BY gp.scheduled_for DESC
    LIMIT 1;

    v_has_responded := true;
  END IF;

  IF v_active.id IS NOT NULL THEN
    v_expires_at := v_active.expires_at;

    SELECT id, rating INTO v_rating_id, v_rating_value
    FROM prompt_ratings
    WHERE prompt_id = v_active.pid AND user_id = auth.uid();

    v_has_rated := v_rating_id IS NOT NULL;

    IF v_active.is_most_likely THEN
      v_members := get_group_members_with_avatars(p_group_id);
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL AND NOT v_has_responded THEN jsonb_build_object(
      'id', v_active.id,
      'prompt_id', v_active.pid,
      'scheduled_for', v_active.scheduled_for,
      'expires_at', v_active.expires_at,
      'week_of', v_active.week_of,
      'prompts', jsonb_build_object(
        'id', v_active.pid,
        'type', v_active.type,
        'content', v_active.content,
        'title', v_active.title,
        'options', v_active.options,
        'correct_answer', v_active.correct_answer,
        'category', v_active.category,
        'payload', v_active.payload,
        'is_most_likely', v_active.is_most_likely,
        'is_majority_guess', v_active.is_majority_guess,
        'media_url', v_active.media_url
      ),
      'group_members', v_members
    ) ELSE NULL END,
    'active_expires_at', v_expires_at,
    'has_responded', v_has_responded,
    'has_rated', v_has_rated,
    'user_rating', v_rating_value
  );

  RETURN v_result;
END;
$$;

-- 9. Update get_fireside_data to include media_url and caption_data
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
  v_est_time TIMESTAMPTZ;
  v_day_of_week INTEGER;
  v_hour INTEGER;
BEGIN
  IF p_week_of IS NULL THEN
    v_est_time := now() AT TIME ZONE 'America/New_York';
    v_day_of_week := EXTRACT(DOW FROM v_est_time);
    v_hour := EXTRACT(HOUR FROM v_est_time);

    IF (v_day_of_week = 0 AND v_hour >= 21) OR (v_day_of_week = 1 AND v_hour < 3) THEN
      v_week := date_trunc('week', (v_est_time - interval '1 day')::date)::date;
    ELSE
      v_week := date_trunc('week', v_est_time::date)::date;
    END IF;
  ELSE
    v_week := p_week_of;
  END IF;

  SELECT jsonb_agg(prompt_data ORDER BY scheduled_for)
  INTO v_prompts
  FROM (
    SELECT
      gp.id as group_prompt_id,
      gp.scheduled_for,
      p.id as prompt_id,
      p.type,
      p.content,
      p.title,
      p.options,
      p.correct_answer,
      p.is_most_likely,
      p.media_url,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'response_id', r.id,
            'user_id', r.user_id,
            'username', pr.username,
            'avatar_config', pr.avatar_config,
            'weekly_crown_until', pr.weekly_crown_until,
            'content', r.content,
            'media_url', r.media_url,
            'selected_option', r.selected_option,
            'submitted_at', r.submitted_at
          )
        )
        FROM responses r
        LEFT JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ) as responses,
      -- Quiplash data
      CASE WHEN p.type = 'quiplash' THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'matchup_id', qa.matchup_id,
          'user_id', qa.user_id,
          'username', COALESCE(pr2.username, 'Anonymous'),
          'avatar_config', pr2.avatar_config,
          'response', (
            SELECT jsonb_build_object('id', r2.id, 'content', r2.content)
            FROM responses r2
            WHERE r2.group_prompt_id = gp.id AND r2.user_id = qa.user_id
            LIMIT 1
          ),
          'votes', (
            SELECT COUNT(*)
            FROM quiplash_votes qv
            JOIN responses r3 ON r3.id = qv.voted_for_response_id
            WHERE qv.matchup_id = qa.matchup_id
              AND r3.user_id = qa.user_id
          )
        ))
        FROM quiplash_assignments qa
        LEFT JOIN profiles pr2 ON pr2.id = qa.user_id
        WHERE qa.group_prompt_id = gp.id
      ) END as quiplash_data,
      -- Caption data
      CASE WHEN p.type = 'photo_caption' THEN
        get_caption_results(gp.id)
      END as caption_data
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.week_of = v_week
    ORDER BY gp.scheduled_for
  ) prompt_data;

  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  SELECT jsonb_build_object(
    'user_id', ww.winner_user_id,
    'username', pr.username,
    'avatar_config', pr.avatar_config,
    'weekly_crown_until', pr.weekly_crown_until,
    'has_chosen', ww.has_chosen,
    'chosen_prompt_id', ww.chosen_prompt_id,
    'custom_prompt_content', ww.custom_prompt_content,
    'prompt_choices', ww.prompt_choices
  ) INTO v_winner
  FROM weekly_winners ww
  LEFT JOIN profiles pr ON pr.id = ww.winner_user_id
  WHERE ww.group_id = p_group_id AND ww.week_of = v_week;

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner
  );
END;
$$;

-- 10. Seed photo_caption prompts
INSERT INTO prompts (type, content, title, category, media_url, is_active) VALUES
  ('photo_caption', 'Caption this!', 'Caption Contest', 'photo_caption', 'https://picsum.photos/seed/stokie1/800/600', true),
  ('photo_caption', 'What''s really going on here?', 'Behind the Scenes', 'photo_caption', 'https://picsum.photos/seed/stokie2/800/600', true),
  ('photo_caption', 'Write the perfect headline', 'Breaking News', 'photo_caption', 'https://picsum.photos/seed/stokie3/800/600', true),
  ('photo_caption', 'What are they thinking?', 'Mind Reader', 'photo_caption', 'https://picsum.photos/seed/stokie4/800/600', true),
  ('photo_caption', 'Name this album', 'Album Cover', 'photo_caption', 'https://picsum.photos/seed/stokie5/800/600', true),
  ('photo_caption', 'Write the dialogue', 'Script Writer', 'photo_caption', 'https://picsum.photos/seed/stokie6/800/600', true),
  ('photo_caption', 'What happened next?', 'Plot Twist', 'photo_caption', 'https://picsum.photos/seed/stokie7/800/600', true),
  ('photo_caption', 'Give this a movie title', 'Movie Poster', 'photo_caption', 'https://picsum.photos/seed/stokie8/800/600', true),
  ('photo_caption', 'Write the review', 'Yelp Reviewer', 'photo_caption', 'https://picsum.photos/seed/stokie9/800/600', true),
  ('photo_caption', 'What would mom say?', 'Mom''s Take', 'photo_caption', 'https://picsum.photos/seed/stokie10/800/600', true),
  ('photo_caption', 'Add the sound effects', 'Sound FX', 'photo_caption', 'https://picsum.photos/seed/stokie11/800/600', true),
  ('photo_caption', 'Write the Craigslist ad', 'For Sale', 'photo_caption', 'https://picsum.photos/seed/stokie12/800/600', true);
