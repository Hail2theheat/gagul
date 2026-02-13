-- Clean up all test video prompts that haven't been answered
-- Keep only the voice prompt active

-- Deactivate all video test prompts
UPDATE group_prompts
SET is_active = false
WHERE prompt_id = 'c5555555-5555-5555-5555-555555555555';

-- Make sure voice prompt is active
UPDATE group_prompts
SET is_active = true
WHERE prompt_id = 'c6666666-6666-6666-6666-666666666666';
