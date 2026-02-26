/**
 * Shared registry mapping group_prompt IDs to their AI Judge data.
 * Used by judge-test.tsx (preview), lowdown.tsx (fireside), and admin.tsx (button visibility).
 */

import { AIJudgeEntry, NonSubmitter } from './mockJudgeData';
import { MOCK_JUDGE_ENTRIES, MOCK_NON_SUBMITTERS, MOCK_CHALLENGE_TITLE } from './mockJudgeData';
import { WIRTHLIN_JUDGE_ENTRIES, WIRTHLIN_NON_SUBMITTERS, WIRTHLIN_CHALLENGE_TITLE } from './wirthlinJudgeData';
import { UNFLATTERING_JUDGE_ENTRIES, UNFLATTERING_NON_SUBMITTERS, UNFLATTERING_CHALLENGE_TITLE } from './unflatteringSelfieJudgeData';
import { ARTSY_JUDGE_ENTRIES, ARTSY_NON_SUBMITTERS, ARTSY_CHALLENGE_TITLE } from './artsyPhotoJudgeData';
import { THE_TRIBUNAL_JUDGE_ENTRIES, THE_TRIBUNAL_NON_SUBMITTERS, THE_TRIBUNAL_CHALLENGE_TITLE } from './theTribunalJudgeData';

export interface JudgeConfig {
  entries: AIJudgeEntry[];
  nonSubmitters: NonSubmitter[];
  title: string;
}

export const JUDGE_CONFIGS: Record<string, JudgeConfig> = {
  'de17f81c-58c6-4b8d-86a6-247ac774380c': { entries: MOCK_JUDGE_ENTRIES, nonSubmitters: MOCK_NON_SUBMITTERS, title: MOCK_CHALLENGE_TITLE },
  '6e6b26af-5a53-4347-8654-8c48daaa4e6b': { entries: WIRTHLIN_JUDGE_ENTRIES, nonSubmitters: WIRTHLIN_NON_SUBMITTERS, title: WIRTHLIN_CHALLENGE_TITLE },
  '39560868-8e6c-4e60-b575-eb7f1d757e41': { entries: UNFLATTERING_JUDGE_ENTRIES, nonSubmitters: UNFLATTERING_NON_SUBMITTERS, title: UNFLATTERING_CHALLENGE_TITLE },
  '87225fb7-47cc-49c3-ac7b-8609e59b3ac9': { entries: ARTSY_JUDGE_ENTRIES, nonSubmitters: ARTSY_NON_SUBMITTERS, title: ARTSY_CHALLENGE_TITLE },
  'f0101e2b-4263-4842-b60d-de107bffee05': { entries: THE_TRIBUNAL_JUDGE_ENTRIES, nonSubmitters: THE_TRIBUNAL_NON_SUBMITTERS, title: THE_TRIBUNAL_CHALLENGE_TITLE },
};
