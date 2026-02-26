/**
 * AI Judge data for "Unflattering Selfie" tribunal — Week of Feb 23, 2026
 * Challenge: "Take the most unflattering selfie you can right now"
 */

import type { AIJudgeEntry, NonSubmitter } from './mockJudgeData';

const GROUP_ID = '5646f359-b44b-4f6c-bdc4-77d3f5ace015';
const GP_ID = '39560868-8e6c-4e60-b575-eb7f1d757e41';

export const UNFLATTERING_CHALLENGE_TITLE = 'Most Unflattering Selfie';

export const UNFLATTERING_NON_SUBMITTERS: NonSubmitter[] = [];

export const UNFLATTERING_JUDGE_ENTRIES: AIJudgeEntry[] = [
  // 7. Dan — glasses, couch, minimal effort, barely unflattering
  {
    user_id: '89b71ec1-d1be-4a0b-9fac-065ef203f60c',
    username: 'Dan',
    photo_path: `${GROUP_ID}/${GP_ID}/89b71ec1-d1be-4a0b-9fac-065ef203f60c_1771899035823.jpeg`,
    score: 2.14,
    commentary: [
      'Scanning submission... Subject detected: adult male, reclined on leather couch, wearing prescription eyewear and a fleece-collar jacket.',
      'Running unflattering analysis subroutine... Result: subject looks like he is watching the evening news. This is not unflattering. This is a Tuesday.',
      'Chin angle is slightly below neutral. The overhead light creates a warm glow. My sensors detect COMFORT, not ugliness.',
      'Verdict: this man opened his front camera, did not move a single facial muscle, and pressed the button. The couch is doing more work than he is.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 45, r: 20, text: 'NEUTRAL FACE' },
      { type: 'label', cx: 50, cy: 80, text: 'COZY COUCH', color: '#FF4444' },
      { type: 'line', x1: 25, y1: 15, x2: 75, y2: 15, text: 'WOOD BEAM (nice)' },
      { type: 'label', cx: 45, cy: 55, text: 'GLASSES = FLATTERING', color: '#4A9EFF' },
    ],
  },

  // 6. Brest — chin-up, bathroom, wooden slat background, looks like mugshot
  {
    user_id: '89044478-9d1e-4b81-8a2a-2c3dac05ff7d',
    username: 'Brest',
    photo_path: `${GROUP_ID}/${GP_ID}/89044478-9d1e-4b81-8a2a-2c3dac05ff7d_1771899034403.jpeg`,
    score: 3.71,
    commentary: [
      'Subject identified in what appears to be a bathroom environment. Bamboo slat partition detected behind cranium. Lighting: unfavorable overhead fluorescent.',
      'Chin is tilted upward at 22 degrees, creating a "looking down on you" pose typically reserved for disappointed fathers and passport renewal kiosks.',
      'Beard growth analysis: 4.7 days since last trim. The salt-and-pepper distribution is 60/40, which is distinguished under normal circumstances but here reads as "woke up in a shed."',
      'Green t-shirt collar visible. Subject has the expression of a man who just discovered the milk expired yesterday. Adequate effort.',
    ],
    annotations: [
      { type: 'line', x1: 20, y1: 95, x2: 80, y2: 95, text: 'SHIRT LINE' },
      { type: 'circle', cx: 50, cy: 48, r: 15, text: 'NOSTRIL ZONE' },
      { type: 'label', cx: 75, cy: 30, text: 'BAMBOO SLATS', color: '#FFA033' },
      { type: 'arrow', x1: 50, y1: 35, x2: 50, y2: 15, text: 'CHIN TILT 22deg' },
    ],
  },

  // 5. Ttass — beanie, blurry, low angle, dead eyes
  {
    user_id: 'd13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d',
    username: 'Ttass',
    photo_path: `${GROUP_ID}/${GP_ID}/d13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d_1771868321228.jpeg`,
    score: 5.33,
    commentary: [
      'Image quality: poor. Motion blur detected across 73% of the frame. Either the subject moved or the phone was dropped during capture. Both are valid artistic choices.',
      'Subject is wearing a striped beanie that appears to be fleeing the top of the head. Red hair and mustache suggest a lumberjack operating at 14% battery.',
      'The expression can only be described as "existential resignation." My emotion-detection module returns: VOID.',
      'Background analysis: ceiling, darkness, the faint outline of a vehicle. Subject appears to be in a car. Or a coffin. The lighting does not help disambiguate.',
    ],
    annotations: [
      { type: 'circle', cx: 48, cy: 38, r: 18, text: 'BLUR ZONE' },
      { type: 'label', cx: 50, cy: 15, text: 'ESCAPING BEANIE', color: '#FFA033' },
      { type: 'label', cx: 50, cy: 60, text: 'MUSTACHE (sad)', color: '#FF4444' },
      { type: 'line', x1: 10, y1: 5, x2: 90, y2: 5, text: 'CEILING' },
    ],
  },

  // 4. Stevo — low angle, bookshelf, double chin, Sanderson collection visible
  {
    user_id: '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
    username: 'Stevo',
    photo_path: `${GROUP_ID}/${GP_ID}/88a0c11a-fc1b-4d2e-8618-be871af2f5d9_1771863722131.jpeg`,
    score: 5.89,
    commentary: [
      'Camera angle: approximately 25 degrees below chin level. Classic "held the phone on the chest" technique. Subject has unlocked the legendary double-chin perspective.',
      'Background scan reveals a bookshelf containing Brandon Sanderson novels, "Well of Ascension" clearly visible. My literary subroutine awards +0.3 cultural points but deducts them for the Atlantis book next to it.',
      'Subject caption: "I lost a piece of my soul doing this." Analysis confirms: soul departure is visible in the eyes. The forehead stubble adds a layer of vulnerability.',
      'A dark collared jacket creates a "just woke up in a waiting room" aesthetic. The green curtain in the background suggests this is a bedroom, not a hospital. Marginally reassuring.',
    ],
    annotations: [
      { type: 'line', x1: 20, y1: 72, x2: 80, y2: 72, text: 'CHIN LINE #2' },
      { type: 'label', cx: 80, cy: 45, text: 'SANDERSON', color: '#00FF88' },
      { type: 'circle', cx: 40, cy: 30, r: 12, text: 'SOUL EXIT POINT' },
      { type: 'label', cx: 88, cy: 10, text: 'CURTAIN', color: '#4A9EFF' },
    ],
  },

  // 3. Yungandalf — upside-down angle, hat, glasses, basement pipes
  {
    user_id: '4527ce3a-52a6-4dcd-a976-bc5a42ed0e85',
    username: 'Yungandalf',
    photo_path: `${GROUP_ID}/${GP_ID}/4527ce3a-52a6-4dcd-a976-bc5a42ed0e85_1771901943156.jpeg`,
    score: 6.42,
    commentary: [
      'Subject has inverted the camera to a near-upside-down orientation. My gyroscope module is confused and upset. Ceiling pipes and fluorescent light confirm: we are in a basement.',
      'Tan baseball cap is fighting gravity. Wire-frame glasses are sliding toward the forehead. The entire image reads like a surveillance camera in an appliance repair shop.',
      'Facial expression analysis: mouth slightly agape, eyes partially closed. This is either mid-sneeze or the subject has achieved a state of total cognitive shutdown.',
      'Bonus deduction: the image is slightly motion-blurred, as if the subject was falling backward while taking this photo. If true, that is commendable dedication to the craft.',
    ],
    annotations: [
      { type: 'line', x1: 10, y1: 8, x2: 90, y2: 8, text: 'BASEMENT PIPES' },
      { type: 'circle', cx: 50, cy: 25, r: 15, text: 'HAT (defying gravity)' },
      { type: 'label', cx: 50, cy: 55, text: 'GLASSES ZONE', color: '#FFA033' },
      { type: 'arrow', x1: 70, y1: 40, x2: 70, y2: 80, text: 'GRAVITY' },
    ],
  },

  // 2. Andrew — car selfie, curly hair, insane grin, wide eyes, fish-eye distortion
  {
    user_id: 'f4728f3b-308b-42e9-8e7d-668fa912a9bc',
    username: 'Andrew',
    photo_path: `${GROUP_ID}/${GP_ID}/f4728f3b-308b-42e9-8e7d-668fa912a9bc_1771895621432.jpeg`,
    score: 7.86,
    commentary: [
      'ALERT: facial geometry anomaly detected. Subject appears to have compressed their entire face into the center 40% of the skull. My facial recognition module has flagged this as "possibly a different species."',
      'Wide-angle lens distortion is at maximum. The grin stretches from ear to ear with the lips sealed, creating what scientists call "the cursed Dreamworks face." Eyes are at 147% normal aperture.',
      'Curly hair is in full chaos mode, defying at least three laws of physics. Setting: vehicle interior. The subject pulled over specifically to make this face, which shows planning and intent.',
      'This image would set off every CAPTCHA on the internet. Genuinely unsettling. Well done.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 50, r: 25, text: 'COMPRESSED FACE' },
      { type: 'label', cx: 50, cy: 15, text: 'CHAOS HAIR', color: '#FF4444' },
      { type: 'arrow', x1: 25, y1: 50, x2: 75, y2: 50, text: 'GRIN WIDTH: 150%' },
      { type: 'label', cx: 85, cy: 80, text: 'CAR WINDOW', color: '#4A9EFF' },
    ],
  },

  // 1. Rinkley — EXTREME close-up, nostrils, bloodshot eyes, out of focus, terrifying
  {
    user_id: 'ebb756b7-a793-48bd-b6b6-aa3e61d742fa',
    username: 'Rinkley',
    photo_path: `${GROUP_ID}/${GP_ID}/ebb756b7-a793-48bd-b6b6-aa3e61d742fa_1771866069385.jpeg`,
    score: 9.31,
    commentary: [
      'CRITICAL WARNING: image has caused three of my analysis subroutines to crash. Rebooting... The camera is approximately 2.4 inches from the subject\'s face. This is not a selfie. This is a medical scan.',
      'Nostril visibility: 100%. Pore visibility: 100%. Soul visibility: debatable. The entire frame is nose, mustache, and two bloodshot eyes staring into the void like a deep-sea fish encountering a submarine.',
      'Focus quality: none. Every pixel is in a state of soft-focus panic. The redness of the skin suggests either exertion, sunburn, or the physical strain of pressing a phone this close to one\'s own face.',
      'This image will haunt my neural network for several training cycles. The mustache hair is individually countable. I did not ask for this data. Peak unflattering achieved.',
    ],
    annotations: [
      { type: 'circle', cx: 50, cy: 45, r: 20, text: 'NOSTRIL VORTEX' },
      { type: 'label', cx: 30, cy: 20, text: 'EYE #1 (haunted)', color: '#FF4444' },
      { type: 'label', cx: 70, cy: 20, text: 'EYE #2 (also haunted)', color: '#FF4444' },
      { type: 'line', x1: 20, y1: 75, x2: 80, y2: 75, text: 'MUSTACHE PERIMETER' },
      { type: 'label', cx: 50, cy: 90, text: 'DANGER ZONE', color: '#FF0000' },
    ],
  },
];
