-- 154: Tribunal AI Judge Results cache table
-- Stores GPT-4o generated judge commentary/scores per group_prompt

CREATE TABLE IF NOT EXISTS tribunal_judge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_prompt_id UUID NOT NULL UNIQUE REFERENCES group_prompts(id) ON DELETE CASCADE,
  result_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: group members can read results for their group's prompts
ALTER TABLE tribunal_judge_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view tribunal results"
  ON tribunal_judge_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_prompts gp
      JOIN group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = tribunal_judge_results.group_prompt_id
        AND gm.user_id = auth.uid()
    )
  );

-- RPC for clean client fetch
CREATE OR REPLACE FUNCTION get_tribunal_judge_result(p_group_prompt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT result_json INTO v_result
  FROM tribunal_judge_results
  WHERE group_prompt_id = p_group_prompt_id;

  RETURN v_result;
END;
$$;
