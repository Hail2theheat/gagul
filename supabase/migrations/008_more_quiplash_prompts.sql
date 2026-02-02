-- Add more quiplash prompts for variety
INSERT INTO prompts (id, type, content, title, category, is_active) VALUES
  (gen_random_uuid(), 'quiplash', 'The worst thing to find inside a piñata', 'Piñata Surprise', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'A rejected name for a new GPS voice', 'GPS Voice', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'What the Loch Ness Monster is actually made of', 'Loch Ness', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'The worst superpower to have on a first date', 'Date Superpower', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'Something you should never say to your boss', 'Boss Talk', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'The worst name for a pet goldfish', 'Goldfish Name', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'What aliens think humans do for fun', 'Alien Observation', 'silly', true),
  (gen_random_uuid(), 'quiplash', 'A terrible slogan for a funeral home', 'Funeral Slogan', 'silly', true)
ON CONFLICT DO NOTHING;

-- Deactivate old quiplash prompts that were created without assignments
UPDATE group_prompts SET is_active = false
WHERE id IN (
  SELECT gp.id FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE p.type = 'quiplash'
  AND NOT EXISTS (SELECT 1 FROM quiplash_assignments qa WHERE qa.group_prompt_id = gp.id)
);
