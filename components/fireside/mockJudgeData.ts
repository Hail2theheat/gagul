/**
 * Mock AI Judge data for vertical jump photo challenge prototype.
 * These will be replaced with real AI-generated judgments later.
 */

export interface Annotation {
  type: 'line' | 'circle' | 'arrow' | 'label';
  /** Line/arrow endpoints (percentage 0-100 of photo dimensions) */
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  /** Circle center + radius (percentage) */
  cx?: number;
  cy?: number;
  r?: number;
  /** Label text */
  text?: string;
  /** Color override (default: #FFD700 gold) */
  color?: string;
}

export interface AIJudgeEntry {
  user_id: string;
  username: string;
  photo_path: string; // Supabase storage path (will be resolved to signed URL)
  score: number;
  commentary: string[];
  annotations: Annotation[];
}

const GROUP_ID = '5646f359-b44b-4f6c-bdc4-77d3f5ace015';
const GP_ID = 'de17f81c-58c6-4b8d-86a6-247ac774380c';

export interface NonSubmitter {
  user_id: string;
  username: string;
}

export const MOCK_CHALLENGE_TITLE = 'Best Vertical Jump';

export const MOCK_NON_SUBMITTERS: NonSubmitter[] = [
  {
    user_id: '89044478-9d1e-4b81-8a2a-2c3dac05ff7d',
    username: 'Brest',
  },
];

export const MOCK_JUDGE_ENTRIES: AIJudgeEntry[] = [
  // 1. Rinkley — jumping in an Amsterdam bike shop, one arm raised, surrounded by bikes
  {
    user_id: 'ebb756b7-a793-48bd-b6b6-aa3e61d742fa',
    username: 'Rinkley',
    photo_path: `${GROUP_ID}/${GP_ID}/ebb756b7-a793-48bd-b6b6-aa3e61d742fa_1771509237343.jpeg`,
    score: 5.47,
    commentary: [
      'Scanning environment... Location identified: industrial bicycle storage facility.',
      'Subject appears to be jumping in an aisle between bicycle racks labeled D, E, and F.',
      'Reference object detected: standard Dutch bicycle wheel (diameter: 28 inches).',
      'Estimated foot clearance from ground: 11.3 inches.',
      'However, subject\'s right arm is extended upward, adding perceived height. This is a known optical illusion technique used by flamingos.',
      'Sign reads "NOODUITGANG NIET" — emergency exit, not to be used. Subject is clearly ignoring workplace safety protocol.',
      'Final assessment: Decent vertical, but significant deductions for OSHA violations.',
    ],
    annotations: [
      { type: 'line', x1: 15, y1: 88, x2: 85, y2: 88, text: 'GROUND LEVEL' },
      { type: 'line', x1: 50, y1: 88, x2: 50, y2: 68, text: '11.3"', color: '#00FF88' },
      { type: 'circle', cx: 50, cy: 35, r: 12, text: 'ARM BOOST' },
      { type: 'label', cx: 25, cy: 50, text: 'BIKES (danger)', color: '#FF4444' },
    ],
  },

  // 2. Stevo — low angle living room shot, head cut off, very high jump
  {
    user_id: '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
    username: 'Stevo',
    photo_path: `${GROUP_ID}/${GP_ID}/88a0c11a-fc1b-4d2e-8618-be871af2f5d9_1771518182446.jpeg`,
    score: 7.23,
    commentary: [
      'Analyzing subject\'s vertical displacement...',
      'Camera angle: approximately 15° from floor level. Classic "make me look tall" cinematography. Noted.',
      'Reference objects detected: standard interior doorframe (80 inches), floor lamp, couch armrest.',
      'Subject\'s feet are approximately 18.6 inches above hardwood floor.',
      'Head has completely exited the frame. This either indicates an extraordinary vertical leap or a very low ceiling. Cross-referencing with the North America map on the wall...',
      'Subject claims "took 15 tries." At approximately 2.4 calories per jump, that\'s 36 calories — roughly one-third of an Oreo.',
      'The average adult male vertical leap is 19.7 inches. Subject achieves 94.4% of national average. Impressive, but the socks-on-hardwood landing strategy is medically inadvisable.',
    ],
    annotations: [
      { type: 'line', x1: 20, y1: 92, x2: 80, y2: 92, text: 'HARDWOOD' },
      { type: 'line', x1: 45, y1: 92, x2: 45, y2: 62, text: '18.6"', color: '#00FF88' },
      { type: 'circle', cx: 45, cy: 15, r: 14, text: 'HEAD: MISSING' },
      { type: 'label', cx: 72, cy: 55, text: 'MAP (ref)' },
      { type: 'line', x1: 30, y1: 10, x2: 30, y2: 92, text: 'DOORFRAME 80"', color: '#FF8C00' },
    ],
  },

  // 3. Andrew — finger "jumping" off car dashboard. Caption: "this is a finger jump"
  {
    user_id: 'f4728f3b-308b-42e9-8e7d-668fa912a9bc',
    username: 'Andrew',
    photo_path: `${GROUP_ID}/${GP_ID}/f4728f3b-308b-42e9-8e7d-668fa912a9bc_1771529435023.jpeg`,
    score: 0.03,
    commentary: [
      'Scanning for human subject...',
      'ERROR: No bipedal organism detected in vertical leap configuration.',
      'Re-scanning... Object identified: a single human hand, index finger extended above car dashboard.',
      'Subject claims this is a "finger jump." Consulting the official rules...',
      'The prompt specified "Best Vertical Jump." It did NOT specify which body part. Technically... this is valid.',
      'Reference object: standard automotive dashboard (height: 26 inches above floor). Finger clearance above dashboard: approximately 3.1 inches.',
      'Converting to full-body equivalent using the finger-to-body height ratio of 0.043... extrapolated jump: 0.13 inches.',
      'Subject also claims to be "icing all day." My condolences to your joints, Andrew.',
    ],
    annotations: [
      { type: 'line', x1: 10, y1: 60, x2: 90, y2: 60, text: 'DASHBOARD' },
      { type: 'circle', cx: 65, cy: 25, r: 18, text: 'THE "JUMP"' },
      { type: 'line', x1: 65, y1: 60, x2: 65, y2: 42, text: '3.1"', color: '#00FF88' },
      { type: 'label', cx: 30, cy: 80, text: 'WINDSHIELD', color: '#888888' },
    ],
  },

  // 4. Yungandalf — bedroom jump, white sweater, head cut off, New Balance shoes
  {
    user_id: '4527ce3a-52a6-4dcd-a976-bc5a42ed0e85',
    username: 'Yungandalf',
    photo_path: `${GROUP_ID}/${GP_ID}/4527ce3a-52a6-4dcd-a976-bc5a42ed0e85_1771547972027.jpeg`,
    score: 5.92,
    commentary: [
      'Subject detected mid-flight in what appears to be a study or library.',
      'Environmental scan: bookshelf (contains approximately 47 books, likely unread), wooden wardrobe, Persian rug, TV box on floor.',
      'Reference object: standard interior door height (80 inches). Subject\'s New Balance 530s are approximately 13.8 inches off the carpet.',
      'The cable-knit sweater adds approximately 0.4 inches of perceived height due to fabric lift. This has been subtracted.',
      'Interesting: subject\'s head has also exited the frame, suggesting either a strong jump or a refusal to show one\'s face during physical exertion.',
      'The presence of a TV box on the floor suggests recent purchase. Subject may be celebrating. This would explain the bounce.',
    ],
    annotations: [
      { type: 'line', x1: 15, y1: 90, x2: 85, y2: 90, text: 'RUG LEVEL' },
      { type: 'line', x1: 50, y1: 90, x2: 50, y2: 72, text: '13.8"', color: '#00FF88' },
      { type: 'circle', cx: 50, cy: 82, r: 8, text: 'NB 530s' },
      { type: 'label', cx: 78, cy: 40, text: '47 BOOKS' },
      { type: 'label', cx: 22, cy: 80, text: 'TV BOX', color: '#FF8C00' },
    ],
  },

  // 5. Dan — living room jump, head near exposed beam, round mirror, "home" sign
  {
    user_id: '89b71ec1-d1be-4a0b-9fac-065ef203f60c',
    username: 'Dan',
    photo_path: `${GROUP_ID}/${GP_ID}/89b71ec1-d1be-4a0b-9fac-065ef203f60c_1771552583883.jpeg`,
    score: 6.81,
    commentary: [
      'Analyzing vertical displacement...',
      'Subject detected in living room with exposed wooden ceiling beam. Interior design: "modern rustic." Score for taste: 8/10.',
      'Reference objects: round wall mirror (estimated 24" diameter), 55" television, console table (standard 30" height).',
      'Estimated foot clearance: 16.2 inches above hardwood floor.',
      'CRITICAL OBSERVATION: Subject\'s head appears dangerously close to the ceiling beam. Estimated headroom remaining: approximately 4 inches.',
      'Caption reads: "Timing." Analysis confirms this was indeed a timing-based photograph. The motion blur on the subject\'s arms suggests peak height was captured. Professional technique.',
      'Decorative wooden sign on console reads "home." Confirmed — subject is indeed at home. The sign is redundant but appreciated.',
    ],
    annotations: [
      { type: 'line', x1: 15, y1: 88, x2: 85, y2: 88, text: 'FLOOR' },
      { type: 'line', x1: 55, y1: 88, x2: 55, y2: 65, text: '16.2"', color: '#00FF88' },
      { type: 'line', x1: 30, y1: 10, x2: 80, y2: 10, text: 'DANGER BEAM', color: '#FF4444' },
      { type: 'line', x1: 55, y1: 10, x2: 55, y2: 18, text: '~4"', color: '#FF4444' },
      { type: 'circle', cx: 30, cy: 40, r: 10, text: 'MIRROR' },
    ],
  },

  // 6. Ttass — looking down at feet/shadow on concrete, shadow shows jumping figure
  {
    user_id: 'd13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d',
    username: 'Ttass',
    photo_path: `${GROUP_ID}/${GP_ID}/d13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d_1771554500812.jpeg`,
    score: 2.14,
    commentary: [
      'Scanning for vertical leap...',
      'ERROR: Primary subject not fully visible. Detected: two legs and a shadow on concrete.',
      'Attempting shadow analysis... Shadow length suggests sun angle of approximately 35°. Cross-referencing with submission timestamp...',
      'The shadow indicates the subject IS airborne. However, without visible ground clearance between feet and surface, measurement is impossible.',
      'This is the photographic equivalent of saying "trust me bro."',
      'Applying the Shadow Coefficient Method (developed 30 seconds ago): estimated clearance from shadow distortion is 4.7 inches. Margin of error: ±4.7 inches.',
      'Recommendation: Next time, ask a friend to take the photo. Or at minimum, include your actual body in the frame.',
    ],
    annotations: [
      { type: 'circle', cx: 35, cy: 70, r: 15, text: 'FEET' },
      { type: 'label', cx: 60, cy: 45, text: 'SHADOW (only evidence)', color: '#888888' },
      { type: 'line', x1: 35, y1: 85, x2: 65, y2: 55, text: 'SUN: 35°', color: '#FF8C00' },
      { type: 'label', cx: 50, cy: 92, text: 'CONCRETE', color: '#AAAAAA' },
    ],
  },
];
