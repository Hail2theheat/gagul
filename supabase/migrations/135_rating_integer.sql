-- Migration 135: Change prompt_ratings.rating from boolean to integer (1-5)
-- Preserves existing data: true -> 4, false -> 2

-- Step 1: Add a temporary integer column
ALTER TABLE prompt_ratings ADD COLUMN rating_int INTEGER;

-- Step 2: Convert existing boolean values
UPDATE prompt_ratings SET rating_int = CASE WHEN rating = true THEN 4 ELSE 2 END;

-- Step 3: Drop old boolean column and rename
ALTER TABLE prompt_ratings DROP COLUMN rating;
ALTER TABLE prompt_ratings RENAME COLUMN rating_int TO rating;

-- Step 4: Add constraint
ALTER TABLE prompt_ratings ADD CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE prompt_ratings ALTER COLUMN rating SET NOT NULL;

-- Step 5: Add average_rating column to prompts table for richer analytics
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2);

-- Step 6: Backfill average_rating from existing data
UPDATE prompts p
SET average_rating = sub.avg_rating
FROM (
  SELECT prompt_id, AVG(rating)::NUMERIC(3,2) as avg_rating
  FROM prompt_ratings
  GROUP BY prompt_id
) sub
WHERE p.id = sub.prompt_id;

-- Step 7: Replace the RPC function to accept integer
CREATE OR REPLACE FUNCTION submit_prompt_rating(p_prompt_id UUID, p_rating INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_thumbs_up INTEGER;
  v_thumbs_down INTEGER;
  v_average NUMERIC(3,2);
BEGIN
  -- Validate rating range
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Upsert the rating
  INSERT INTO prompt_ratings (prompt_id, user_id, rating)
  VALUES (p_prompt_id, auth.uid(), p_rating)
  ON CONFLICT (prompt_id, user_id) DO UPDATE SET rating = p_rating;

  -- Update thumbs_up (ratings >= 4) and thumbs_down (ratings <= 2)
  SELECT COUNT(*) INTO v_thumbs_up FROM prompt_ratings WHERE prompt_id = p_prompt_id AND rating >= 4;
  SELECT COUNT(*) INTO v_thumbs_down FROM prompt_ratings WHERE prompt_id = p_prompt_id AND rating <= 2;

  -- Calculate average
  SELECT AVG(rating)::NUMERIC(3,2) INTO v_average FROM prompt_ratings WHERE prompt_id = p_prompt_id;

  -- Update prompts table
  UPDATE prompts SET thumbs_up = v_thumbs_up, thumbs_down = v_thumbs_down, average_rating = v_average WHERE id = p_prompt_id;
END;
$$;
