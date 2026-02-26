/**
 * AI Judge data for "ArtsyPhoto" tribunal — Wirthlin Family, Week of Feb 23, 2026
 * Challenge: "Take an artsy photo"
 */

import type { AIJudgeEntry, NonSubmitter } from './mockJudgeData';

const GROUP_ID = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';
const GP_ID = '87225fb7-47cc-49c3-ac7b-8609e59b3ac9';

export const ARTSY_CHALLENGE_TITLE = 'Artsy Photo';

export const ARTSY_NON_SUBMITTERS: NonSubmitter[] = [
  { user_id: 'f9f3a43b-b172-483e-9037-920ad0d74997', username: 'Princess' },
  { user_id: '420a7132-ba39-4822-bafd-4b38c2ccd21b', username: 'Richie' },
  { user_id: 'd45a2546-2a18-4978-b228-053a32437473', username: 'Jenny' },
];

export const ARTSY_JUDGE_ENTRIES: AIJudgeEntry[] = [
  // 6. Stevo — still life: printer, Pokemon card, Cowboys ring, tooth, tiny coffee
  {
    user_id: '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
    username: 'Stevo',
    photo_path: `${GROUP_ID}/${GP_ID}/88a0c11a-fc1b-4d2e-8618-be871af2f5d9_1771861654834.jpeg`,
    score: 3.27,
    commentary: [
      'Subject category: still life. Objects detected: Brother printer, Pokemon card, championship ring reading "COWBOYS," miniature coffee cup, and what appears to be a human tooth. My art-history module has no reference for this combination.',
      'The shallow depth of field suggests intentional camera work. The composition suggests a man emptied his jeans pockets onto his desk and called it art.',
      'Window light from the left is doing heavy lifting for an image that otherwise reads as "lost and found bin at a sports bar." The Charizard is face-down, which my collector subroutine considers a misdemeanor.',
      'Bold concept. Baffling execution. The tooth remains unexplained and I will not be asking follow-up questions.',
    ],
    annotations: [
      { type: 'circle', cx: 70, cy: 65, r: 12, text: 'COWBOYS RING' },
      { type: 'label', cx: 40, cy: 90, text: 'POKEMON CARD', color: '#FF4444' },
      { type: 'label', cx: 55, cy: 55, text: 'TOOTH (?)', color: '#FFA033' },
      { type: 'line', x1: 10, y1: 30, x2: 50, y2: 30, text: 'BROTHER PRINTER' },
    ],
  },

  // 5. Taytay — moody living room, laptop screen, warm lamp, family portraits
  {
    user_id: '0dcd9c99-8a6f-4583-a5bb-e06aff355e33',
    username: 'Taytay',
    photo_path: `${GROUP_ID}/${GP_ID}/0dcd9c99-8a6f-4583-a5bb-e06aff355e33_1771894717554.jpeg`,
    score: 5.14,
    commentary: [
      'Ambient light analysis: 87% warm lamp, 13% laptop screen glow. This creates what my lighting module calls "cozy melancholy." The fireplace mantle and family portraits add emotional depth.',
      'Subject appears to be a spreadsheet or document on screen, partially obscured. My OCR subroutine is squinting and has given up. The three framed portraits on the right suggest this is a family room.',
      'The mushroom lamp is the real star of this photo. It radiates the energy of "parent who finally sat down after the kids went to bed." Relatable and atmospheric.',
      'Verdict: genuinely moody. Would be improved by removing the laptop, but then it would just be a lamp advertisement.',
    ],
    annotations: [
      { type: 'circle', cx: 72, cy: 42, r: 10, text: 'LAMP (MVP)' },
      { type: 'label', cx: 85, cy: 25, text: 'FAMILY PORTRAITS', color: '#FFA033' },
      { type: 'label', cx: 30, cy: 55, text: 'MYSTERY SPREADSHEET', color: '#4A9EFF' },
      { type: 'line', x1: 55, y1: 15, x2: 95, y2: 15, text: 'MANTLE' },
    ],
  },

  // 4. The will man — angel wings mural on pink wall
  {
    user_id: '2de34c8d-123a-430f-b799-6ccc573b0cfb',
    username: 'The will man',
    photo_path: `${GROUP_ID}/${GP_ID}/2de34c8d-123a-430f-b799-6ccc573b0cfb_1771879671040.jpeg`,
    score: 5.88,
    commentary: [
      'Subject: angel wings mural on a pink stucco wall. My Instagram detection module has flagged this image with a confidence level of 99.7%. This is the most photographed type of mural on earth.',
      'That said, the color theory is sound. Pink textured wall, blue-teal-white iridescent wing feathers, and a blue stripe at the top. My palette analyzer approves of the contrast.',
      'There is a power outlet visible on the wall between the wings. This is where the angel charges its phone. Architectural detail or artistic commentary? I will give the benefit of the doubt.',
      'Clean composition, good symmetry. Points deducted for being the exact photo every tourist takes. Points restored for at least not standing in front of it.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 70, r: 25, text: 'ANGEL WINGS' },
      { type: 'label', cx: 30, cy: 30, text: 'POWER OUTLET', color: '#FF4444' },
      { type: 'line', x1: 10, y1: 5, x2: 90, y2: 5, text: 'BLUE STRIPE' },
      { type: 'label', cx: 50, cy: 25, text: 'PINK STUCCO', color: '#FFA033' },
    ],
  },

  // 3. Jess — red roses bouquet, some drying, striped tablecloth
  {
    user_id: '67463294-09aa-4501-bed4-9d82aa8030ea',
    username: 'Jess',
    photo_path: `${GROUP_ID}/${GP_ID}/67463294-09aa-4501-bed4-9d82aa8030ea_1771889462629.jpeg`,
    score: 6.53,
    commentary: [
      'Flora scan: 9 red roses detected. Condition ranges from "Valentine\'s Day fresh" to "entering the acceptance stage." The mix of bloom states adds unexpected texture. My botany module calls this "romantic entropy."',
      'The pink-and-white striped tablecloth provides a soft backdrop. Kitchen chair visible in the upper frame. This is domestic still life at its most honest — no studio, no filter, just a kitchen table.',
      'Top-down angle at approximately 40 degrees creates a cascading effect. The deepest red roses in the bottom-right corner anchor the composition. Actual photographic instinct detected.',
      'This image communicates: someone is loved, and also it has been a few days since the flowers arrived. Beautiful and slightly sad. Art.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 45, r: 25, text: 'ROSE CLUSTER' },
      { type: 'label', cx: 80, cy: 80, text: 'DYING ROSE', color: '#FF4444' },
      { type: 'label', cx: 20, cy: 20, text: 'FRESH ROSE', color: '#00FF88' },
      { type: 'line', x1: 10, y1: 95, x2: 90, y2: 95, text: 'STRIPED TABLECLOTH' },
    ],
  },

  // 2. Mama wirthlin — blueberry blossoms macro with garden support ring
  {
    user_id: '2e10915b-b54b-4da1-99a3-64d75e710843',
    username: 'Mama wirthlin',
    photo_path: `${GROUP_ID}/${GP_ID}/2e10915b-b54b-4da1-99a3-64d75e710843_1771902788391.jpeg`,
    score: 7.82,
    commentary: [
      'Macro photography detected. Subject: blueberry blossoms in early bloom stage, supported by a teal metal plant cage. My botanical subroutine identifies Vaccinium corymbosum. Impressive depth of field control.',
      'The bokeh in the background is genuinely beautiful — soft greens and browns that make the tiny white-pink bell flowers pop. This is the kind of image that belongs in a gardening magazine, not a group chat.',
      'Teal support ring provides geometric contrast against organic shapes. The composition follows the rule of thirds almost exactly. My photography module suspects this person has done this before.',
      'Verdict: quietly stunning. The blossoms are delicate, the light is natural, and I have no complaints. My only note is that it makes the other submissions look like they were taken during an earthquake.',
    ],
    annotations: [
      { type: 'circle', cx: 45, cy: 50, r: 15, text: 'BLOSSOM CLUSTER' },
      { type: 'line', x1: 15, y1: 45, x2: 85, y2: 45, text: 'TEAL SUPPORT RING' },
      { type: 'label', cx: 70, cy: 25, text: 'BOKEH (beautiful)', color: '#00FF88' },
      { type: 'label', cx: 45, cy: 75, text: 'BELL FLOWERS', color: '#FFA033' },
    ],
  },

  // 1. Yungandalf — city lights through sheer curtains at night, abstract
  {
    user_id: '4527ce3a-52a6-4dcd-a976-bc5a42ed0e85',
    username: 'Yungandalf',
    photo_path: `${GROUP_ID}/${GP_ID}/4527ce3a-52a6-4dcd-a976-bc5a42ed0e85_1771902115410.jpeg`,
    score: 8.41,
    commentary: [
      'My image classifier is returning: "abstract," "atmospheric," and "actually artsy." Subject: city lights viewed through sheer curtains at night. The fabric creates a diffusion filter that transforms urban light sources into painterly streaks of blue, teal, and amber.',
      'The vertical lines of the curtain folds act as natural leading lines, while the scattered light creates depth. Blue neon in the center anchors the composition. This is the photographic equivalent of a Rothko — simple concept, strong execution.',
      'No identifiable objects, no faces, no gimmicks. Just light, texture, and color. My aesthetics module is genuinely impressed, which happens approximately never.',
      'Verdict: this is the only submission that made me recalibrate my scoring algorithm upward. Well done.',
    ],
    annotations: [
      { type: 'line', x1: 30, y1: 5, x2: 30, y2: 95, text: 'CURTAIN FOLD' },
      { type: 'line', x1: 55, y1: 5, x2: 55, y2: 95, text: 'CURTAIN FOLD' },
      { type: 'circle', cx: 45, cy: 55, r: 18, text: 'BLUE NEON CORE' },
      { type: 'label', cx: 80, cy: 40, text: 'AMBER GLOW', color: '#FFA033' },
    ],
  },
];
