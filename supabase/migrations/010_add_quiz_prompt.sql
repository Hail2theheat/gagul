-- Add a quiz prompt with correct answer
INSERT INTO prompts (id, type, content, title, category, options, correct_answer, is_active) VALUES
  (gen_random_uuid(), 'quiz', 'What is the largest planet in our solar system?', 'Space Quiz', 'trivia', '["Mars", "Jupiter", "Saturn", "Neptune"]'::jsonb, 'Jupiter', true),
  (gen_random_uuid(), 'quiz', 'Which country has the most time zones?', 'Geography Quiz', 'trivia', '["Russia", "USA", "France", "China"]'::jsonb, 'France', true)
ON CONFLICT DO NOTHING;
