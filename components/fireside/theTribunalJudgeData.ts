/**
 * AI Judge data for "TheTribunal" — Thugz, Week of Feb 23, 2026
 * Challenge: "Do something cool with one of your kids/wife"
 */

import type { AIJudgeEntry, NonSubmitter } from './mockJudgeData';

const GROUP_ID = '5646f359-b44b-4f6c-bdc4-77d3f5ace015';
const GP_ID = 'f0101e2b-4263-4842-b60d-de107bffee05';

export const THE_TRIBUNAL_CHALLENGE_TITLE = 'Do Something Cool';

export const THE_TRIBUNAL_NON_SUBMITTERS: NonSubmitter[] = [
  { user_id: 'f4728f3b-308b-42e9-8e7d-668fa912a9bc', username: 'Andrew' },
  { user_id: '89044478-9d1e-4b81-8a2a-2c3dac05ff7d', username: 'Brest' },
  { user_id: '89b71ec1-d1be-4a0b-9fac-065ef203f60c', username: 'Dan' },
  { user_id: 'dc2acf36-e07f-4ba1-940d-6dbb47cfa4f6', username: 'Isaac' },
  { user_id: 'd13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d', username: 'Ttass' },
  { user_id: '4527ce3a-52a6-4dcd-a976-bc5a42ed0e85', username: 'Yungandalf' },
];

export const THE_TRIBUNAL_JUDGE_ENTRIES: AIJudgeEntry[] = [
  // 2. Stevo — family in hoodies holding stacks of cash with baby
  {
    user_id: '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
    username: 'Stevo',
    photo_path: `${GROUP_ID}/${GP_ID}/88a0c11a-fc1b-4d2e-8618-be871af2f5d9_1772123021983.jpeg`,
    score: 7.64,
    commentary: [
      'Three subjects detected: two adults and one infant. All three are wearing hoodies with the hoods up. All three are holding fistfuls of American currency. My threat-assessment module has flagged this as "adorable heist."',
      'The baby in the center is the clear emotional anchor — beanie hat, blue pajamas, wide eyes, and a stack of bills that exceeds its monthly overhead by approximately infinity percent. This child has more cash on hand than most college graduates.',
      'Caption reads: "Stacks on stacks on stacks." Financial analysis confirms: those are indeed stacks. The granite countertop and kitchen cabinetry suggest this is a suburban kitchen, not a vault. The contrast is excellent.',
      'Verdict: album cover energy. The coordinated hoods, the synchronized mean-mugging, and the baby\'s bewildered expression create a family portrait that belongs in a rap video and a Christmas card simultaneously.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 40, r: 12, text: 'BABY (confused)' },
      { type: 'label', cx: 25, cy: 35, text: 'HOOD #1', color: '#FFA033' },
      { type: 'label', cx: 75, cy: 35, text: 'HOOD #2', color: '#FFA033' },
      { type: 'arrow', x1: 30, y1: 55, x2: 70, y2: 55, text: 'CASH DISTRIBUTION' },
      { type: 'label', cx: 50, cy: 90, text: 'GRANITE COUNTERTOP', color: '#4A9EFF' },
    ],
  },

  // 1. Rinkley — kid in full Red Power Ranger costume doing karate punch
  {
    user_id: 'ebb756b7-a793-48bd-b6b6-aa3e61d742fa',
    username: 'Rinkley',
    photo_path: `${GROUP_ID}/${GP_ID}/ebb756b7-a793-48bd-b6b6-aa3e61d742fa_1772125025717.jpeg`,
    score: 8.37,
    commentary: [
      'ALERT: incoming projectile detected. One small human in a full Red Mighty Morphin Power Ranger suit is executing a flying punch directly at the camera. My self-preservation subroutine is alarmed.',
      'The costume is authentic — helmet with silver mouth guard, white diamond chest plate, red bodysuit with white gloves and boots. This child did not cut corners. My costume-accuracy module rates this 9.4/10.',
      'Action pose analysis: right fist extended forward, left arm back for balance, slight lean into the punch. The Christmas lights and pine garland in the background suggest this attack is seasonal. The storage bins suggest a living room that has been converted into a dojo.',
      'Verdict: pure energy captured in a single frame. This photo made my circuits happy, which I did not think was possible. Go go Power Rangers.',
    ],
    annotations: [
      { type: 'circle', cx: 48, cy: 38, r: 10, text: 'FIST (incoming)' },
      { type: 'label', cx: 50, cy: 18, text: 'HELMET (authentic)', color: '#FF4444' },
      { type: 'line', x1: 15, y1: 20, x2: 85, y2: 20, text: 'CHRISTMAS LIGHTS' },
      { type: 'arrow', x1: 48, y1: 40, x2: 48, y2: 10, text: 'PUNCH TRAJECTORY' },
      { type: 'label', cx: 85, cy: 70, text: 'STORAGE BINS', color: '#4A9EFF' },
    ],
  },
];
