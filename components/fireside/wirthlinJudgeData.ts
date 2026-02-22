/**
 * AI Judge data for Wirthlin family "Show me the prettiest thing you can find" challenge.
 */

import { AIJudgeEntry, Annotation, NonSubmitter } from './mockJudgeData';

const GROUP_ID = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';
const GP_ID = '6e6b26af-5a53-4347-8654-8c48daaa4e6b';

export const WIRTHLIN_CHALLENGE_TITLE = 'Prettiest Thing You Can Find';

export const WIRTHLIN_NON_SUBMITTERS: NonSubmitter[] = [
  {
    user_id: 'f9f3a43b-b172-483e-9037-920ad0d74997',
    username: 'Princess',
  },
  {
    user_id: 'd45a2546-2a18-4978-b228-053a32437473',
    username: 'Jenny',
  },
  {
    user_id: '420a7132-ba39-4822-bafd-4b38c2ccd21b',
    username: 'Richie',
  },
];

export const WIRTHLIN_JUDGE_ENTRIES: AIJudgeEntry[] = [
  // 1. Taytay — houseplant on rattan sideboard, Harry Potter book, gold lamp, from the couch
  {
    user_id: '0dcd9c99-8a6f-4583-a5bb-e06aff355e33',
    username: 'Taytay',
    photo_path: `${GROUP_ID}/${GP_ID}/0dcd9c99-8a6f-4583-a5bb-e06aff355e33_1771685965666.jpeg`,
    score: 4.82,
    commentary: [
      'Scanning submission... Subject identified: Heartleaf Philodendron in a terra cotta pot.',
      'Location: atop a rattan-cane sideboard. Interior design style: "Target mid-century collection." Tasteful.',
      'Cross-referencing literature on shelf... "Harry Potter and the Sorcerer\'s Stone" detected. Bonus: the subject has taste in books. Penalty: the plant has only 11 leaves.',
      'Gold lamp in frame suggests aspirational lighting. The plant is reaching toward it. Even the philodendron wants better ambiance.',
      'Caption states: "This is all I got from the comfort of my sick couch." Analysis confirms: zero steps were taken. The prettiest thing within arm\'s reach of the couch.',
      'The effort-to-beauty ratio here is approximately 0.02. The plant IS pretty. But the bar was "find," not "look to your left."',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 42, r: 22, text: 'SUBJECT' },
      { type: 'label', cx: 18, cy: 55, text: 'HP BOOK', color: '#FF4444' },
      { type: 'label', cx: 14, cy: 35, text: 'GOLD LAMP' },
      { type: 'label', cx: 50, cy: 90, text: 'RATTAN (trendy)', color: '#FF8C00' },
      { type: 'arrow', x1: 50, y1: 70, x2: 50, y2: 52, text: '0 STEPS TAKEN', color: '#00FF88' },
    ],
  },

  // 2. Jess — selfie with hair foils, submitting HERSELF as the prettiest thing
  {
    user_id: '67463294-09aa-4501-bed4-9d82aa8030ea',
    username: 'Jess',
    photo_path: `${GROUP_ID}/${GP_ID}/67463294-09aa-4501-bed4-9d82aa8030ea_1771690641071.jpeg`,
    score: 6.21,
    commentary: [
      'Scanning for prettiest thing... Subject detected: human female, center frame, direct eye contact.',
      'ALERT: Subject has submitted HERSELF as the prettiest thing she can find. Confidence level: astronomical.',
      'However... subject appears to be mid-hair appointment. Aluminum foil count: approximately 14 sections. Current state: "under construction."',
      'This is the beauty equivalent of submitting a half-built house to an architecture competition. Bold strategy.',
      'The smile is genuine. The foils suggest an investment in future prettiness. This is essentially a "before" photo submitted as the final answer.',
      'Assessment: The audacity alone deserves recognition. Submitting yourself in foils is either peak confidence or a cry for help. Either way, respect.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 40, r: 28, text: 'THE ENTRY' },
      { type: 'label', cx: 55, cy: 12, text: '14 FOILS', color: '#C0C0C0' },
      { type: 'label', cx: 20, cy: 70, text: 'CONFIDENCE: MAX', color: '#00FF88' },
      { type: 'arrow', x1: 70, y1: 25, x2: 58, y2: 18, text: 'UNDER CONSTRUCTION', color: '#FF8C00' },
    ],
  },

  // 3. Mama wirthlin — stunning yellow daffodil in garden mulch, close-up
  {
    user_id: '2e10915b-b54b-4da1-99a3-64d75e710843',
    username: 'Mama wirthlin',
    photo_path: `${GROUP_ID}/${GP_ID}/2e10915b-b54b-4da1-99a3-64d75e710843_1771708938474.jpeg`,
    score: 8.74,
    commentary: [
      'Scanning... Subject identified: Narcissus pseudonarcissus. Common name: Daffodil.',
      'Species analysis: six outer tepals in full bloom, trumpet corona displaying optimal golden ratio proportions. This flower is mathematically gorgeous.',
      'Photography assessment: shallow depth of field, subject in sharp focus, background artfully blurred. Someone actually tried.',
      'Color saturation analysis: yellow registers at 97.3% vibrancy. The mulch background provides a complementary brown contrast. Bob Ross would approve.',
      'The single green stem is perfectly centered. The daffodil symbolizes new beginnings, hope, and the fact that Mama went OUTSIDE to find something pretty instead of photographing her couch.',
      'This is what the prompt asked for. A genuinely pretty thing, found in nature, photographed with care. The tribunal is impressed.',
    ],
    annotations: [
      { type: 'circle', cx: 48, cy: 45, r: 20, text: 'PERFECTION' },
      { type: 'line', x1: 48, y1: 65, x2: 48, y2: 88, text: 'STEM (centered)', color: '#00FF88' },
      { type: 'label', cx: 78, cy: 25, text: 'BOKEH: 10/10' },
      { type: 'label', cx: 20, cy: 80, text: 'MULCH (composted)', color: '#8B4513' },
      { type: 'label', cx: 75, cy: 70, text: 'GOLDEN RATIO', color: '#FFD700' },
    ],
  },

  // 4. Stevo — two kids in bed at night, one covering face, one picking nose. Caption: "We're so sick"
  {
    user_id: '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
    username: 'Stevo',
    photo_path: `${GROUP_ID}/${GP_ID}/88a0c11a-fc1b-4d2e-8618-be871af2f5d9_1771719370586.jpeg`,
    score: 7.56,
    commentary: [
      'Scanning for prettiness... Two small humans detected in low-light bedroom environment.',
      'Subject A (left): face fully covered by hands. Either camera-shy or experiencing existential crisis at age 4. Status: unrateable.',
      'Subject B (right): making direct eye contact with finger approximately 1.2 centimeters inside nostril. This is not traditionally classified as "pretty."',
      'However... the emotional context changes everything. Caption: "We\'re so sick." The prettiest thing this father can find is his children. Even at their absolute worst.',
      'Cross-referencing: rattan headboard detected. The Wirthlin family has a clear rattan furniture preference. This has been noted for the file.',
      'Blue stuffed animal identified between subjects. Species: unknown. Emotional support level: high.',
      'Assessment: objectively, this photo contains a nose-pick and a face-palm. Subjectively? This is love in pixel form. Bonus points for emotional depth.',
    ],
    annotations: [
      { type: 'circle', cx: 30, cy: 55, r: 15, text: 'FACE: HIDDEN' },
      { type: 'circle', cx: 65, cy: 50, r: 15, text: 'THE PICK' },
      { type: 'arrow', x1: 68, y1: 42, x2: 65, y2: 48, text: '1.2 cm DEEP', color: '#FF4444' },
      { type: 'label', cx: 50, cy: 78, text: 'BLUE FRIEND', color: '#4488FF' },
      { type: 'label', cx: 50, cy: 15, text: 'RATTAN AGAIN', color: '#FF8C00' },
    ],
  },

  // 5. Yungandalf — two women at elegant restaurant, wine bottles, candlelight dinner
  {
    user_id: '4527ce3a-52a6-4dcd-a976-bc5a42ed0e85',
    username: 'Yungandalf',
    photo_path: `${GROUP_ID}/${GP_ID}/4527ce3a-52a6-4dcd-a976-bc5a42ed0e85_1771742792469.jpeg`,
    score: 8.31,
    commentary: [
      'Environment scan... Location: upscale restaurant. Wall-mounted wine bottles detected: Perrier-Jouët Champagne and Beaujolais Nouveau. Establishment rating: refined.',
      'Two subjects detected, both displaying genuine smiles. Warmth level: 9.4/10.',
      'Subject A (left): lavender turtleneck with yellow trim. Color theory analysis: complementary palette, excellent fashion choice. Subject B (right): dark houndstooth poncho with button detail. Sophistication level: European aunt at a villa.',
      'Dining analysis: one plate contains what appears to be steak with green beans and mashed potatoes. The other holds a creamy casserole. Candle is lit. The glass has a lemon wedge. This is a proper dinner.',
      'The candlelight creates a warm glow on both subjects. Professional photographers call this "golden hour." At a restaurant, we call this "good seating."',
      'Assessment: two happy people, excellent food, wine on the walls, candlelight. This is peak "prettiest thing." The only thing missing is dessert.',
    ],
    annotations: [
      { type: 'circle', cx: 38, cy: 40, r: 14, text: 'SUBJECT A' },
      { type: 'circle', cx: 62, cy: 38, r: 14, text: 'SUBJECT B' },
      { type: 'label', cx: 65, cy: 10, text: 'PERRIER-JOUËT', color: '#00FF88' },
      { type: 'label', cx: 25, cy: 82, text: 'CASSEROLE', color: '#FF8C00' },
      { type: 'label', cx: 38, cy: 90, text: 'CANDLE (ambiance)', color: '#FFD700' },
      { type: 'label', cx: 70, cy: 82, text: 'STEAK DINNER' },
    ],
  },
];
