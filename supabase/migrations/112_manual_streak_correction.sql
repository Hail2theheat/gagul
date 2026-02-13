-- Manual streak correction based on actual participation review
-- Thugz = 2, Wirthlin Family = 5

UPDATE groups
SET current_streak = 2,
    longest_streak = GREATEST(longest_streak, 2)
WHERE name ILIKE '%thugz%';

UPDATE groups
SET current_streak = 5,
    longest_streak = GREATEST(longest_streak, 5)
WHERE name ILIKE '%wirthlin%';
