-- Initialize everyone's personal streak to 2 (today and tomorrow)
UPDATE profiles
SET current_streak = 2, longest_streak = GREATEST(longest_streak, 2)
WHERE current_streak < 2 OR current_streak IS NULL;
