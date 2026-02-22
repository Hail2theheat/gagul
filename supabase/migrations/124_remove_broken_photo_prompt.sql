-- Remove the group_prompt with a 0-byte photo from the thugz group
-- group_prompt_id: aec0c7be-7d69-4e86-890b-5950ac105788
-- The photo was uploaded before the photo fix was deployed, resulting in 0 bytes stored

-- Delete responses first (FK constraint)
DELETE FROM responses WHERE group_prompt_id = 'aec0c7be-7d69-4e86-890b-5950ac105788';

-- Delete the group_prompt itself
DELETE FROM group_prompts WHERE id = 'aec0c7be-7d69-4e86-890b-5950ac105788';
