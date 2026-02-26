/**
 * Schedule Thugz Week: March 2 - 7, 2026
 * Week of: 2026-03-02
 *
 * Mon 3/2: Photo - Album Cover (Tribunal)
 * Tue 3/3: Photo - Cutoff Photo (Photo Completion Phase 1)
 * Wed 3/4: Short Text - Conspiracy Blind Ranking + Photo Completion Phase 2 auto-runs
 * Thu 3/5: Photo - Recreate a Famous Painting (Tribunal)
 * Fri 3/6: Photo - Steps Screenshot + daily avg (Steps Challenge)
 * Sat 3/7: Short Text - Random Ingredient
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jssuzpodzgwfrpzmtpva.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzc3V6cG9kemd3ZnJwem10cHZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzODQ4NSwiZXhwIjoyMDg0MDE0NDg1fQ.6K532OFnOVkzve7_JUVh9zmnNR0Af_CbBhPMrwQCVLk'
);

// === IDs ===
const THUGZ_GROUP_ID = '5646f359-b44b-4f6c-bdc4-77d3f5ace015';
const WEEK_OF = '2026-03-02';

// Members
const MEMBERS = {
  andrew:    'f4728f3b-308b-42e9-8e7d-668fa912a9bc',
  brett:     '89044478-9d1e-4b81-8a2a-2c3dac05ff7d',
  dan:       '89b71ec1-d1be-4a0b-9fac-065ef203f60c',
  isaac:     'f5e2478f-ae67-4390-9199-b52a171c8ca5',
  rinkley:   'ebb756b7-a793-48bd-b6b6-aa3e61d742fa',
  stevo:     '88a0c11a-fc1b-4d2e-8618-be871af2f5d9',
  ttass:     'd13ef4fb-7dbf-4f0c-a7a2-ab2b2d51555d',
  yungandalf:'4527ce3a-52a6-4dcd-a976-bc5a42ed0e85',
};

const ALL_MEMBER_IDS = Object.values(MEMBERS);

const USERNAMES = {
  [MEMBERS.andrew]:    'Andrew',
  [MEMBERS.brett]:     'Brest',
  [MEMBERS.dan]:       'Dan',
  [MEMBERS.isaac]:     'Isaac',
  [MEMBERS.rinkley]:   'Rinkley',
  [MEMBERS.stevo]:     'Stevo',
  [MEMBERS.ttass]:     'Ttass',
  [MEMBERS.yungandalf]:'Yungandalf',
};

/**
 * Build scheduled_for and expires_at for a given date at 8 AM EST
 * 8 AM EST = 13:00 UTC
 */
function makeSchedule(dateStr) {
  const scheduledFor = `${dateStr}T13:00:00.000Z`; // 8 AM EST = 1 PM UTC
  const d = new Date(scheduledFor);
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  const expiresAt = d.toISOString();
  return { scheduledFor, expiresAt };
}

/**
 * Build scheduled_for and expires_at for a given date at 3 AM EST (for overnight prompts)
 * 3 AM EST = 8 AM UTC
 */
function makeSchedule3AM(dateStr) {
  const scheduledFor = `${dateStr}T08:00:00.000Z`; // 3 AM EST = 8 AM UTC
  const d = new Date(scheduledFor);
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
  const expiresAt = d.toISOString();
  return { scheduledFor, expiresAt };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function createPrompt({ type, content, title, category, payload }) {
  const insertData = { type, content, title, category, is_active: true };
  if (payload) insertData.payload = payload;
  const { data, error } = await supabase
    .from('prompts')
    .insert(insertData)
    .select()
    .single();
  if (error) throw new Error(`Failed to create prompt "${title}": ${error.message}`);
  console.log(`  Created prompt: "${title}" (${data.id})`);
  return data;
}

async function createGroupPrompt({ promptId, scheduledFor, expiresAt }) {
  const { data, error } = await supabase
    .from('group_prompts')
    .insert({
      group_id: THUGZ_GROUP_ID,
      prompt_id: promptId,
      scheduled_for: scheduledFor,
      expires_at: expiresAt,
      week_of: WEEK_OF,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw new Error(`Failed to create group_prompt: ${error.message}`);
  console.log(`  Created group_prompt: ${data.id} (${scheduledFor})`);
  return data;
}

async function main() {
  console.log('=== Scheduling Thugz Week: March 2-7, 2026 ===\n');

  const allGroupPromptIds = [];

  // ==========================================
  // MONDAY Mar 2 - Photo: Album Cover (Tribunal)
  // ==========================================
  console.log('--- Monday Mar 2: Photo - Album Cover (Tribunal) ---');
  const monPrompt = await createPrompt({
    type: 'photo',
    content: 'Take a photo that looks like it could be a band\'s album cover',
    title: 'Album Cover',
    category: 'photo',
    payload: { is_tribunal: true },
  });
  const { scheduledFor: monSF, expiresAt: monEA } = makeSchedule('2026-03-02');
  const monGP = await createGroupPrompt({ promptId: monPrompt.id, scheduledFor: monSF, expiresAt: monEA });
  allGroupPromptIds.push(monGP.id);

  // ==========================================
  // TUESDAY Mar 3 - Photo: Cutoff Photo (Photo Completion Phase 1)
  // Uses 3AM-3AM schedule to give more time
  // ==========================================
  console.log('\n--- Tuesday Mar 3: Photo - Cutoff Photo (Photo Completion Phase 1) ---');
  const tuePrompt = await createPrompt({
    type: 'photo',
    content: 'Take a cutoff photo — cut your body off in a funny way at the edge of the frame. Hand reaching out, waist-down only, peeking around a corner — get creative!',
    title: 'Cutoff Photo',
    category: 'photo',
    payload: { is_photo_completion: true },
  });
  // Phase 1: Tue 8 AM EST → Wed 8 AM EST (normal schedule)
  const { scheduledFor: tueSF, expiresAt: tueEA } = makeSchedule('2026-03-03');
  const tueGP = await createGroupPrompt({ promptId: tuePrompt.id, scheduledFor: tueSF, expiresAt: tueEA });
  allGroupPromptIds.push(tueGP.id);

  // ==========================================
  // WEDNESDAY Mar 4 - Short Text: Conspiracy Blind Ranking
  // ==========================================
  console.log('\n--- Wednesday Mar 4: Short Text - Conspiracy Blind Ranking ---');
  const wedPrompt = await createPrompt({
    type: 'short_text',
    content: 'Where would you rank: "Western elites are vampires that feast on the blood and flesh of babies?" on this conspiracy scale',
    title: 'Conspiracy Ranking',
    category: 'text',
    payload: {
      is_blind_ranking: true,
      scale_items: [
        'Flat Earth',
        'Birds Aren\'t Real',
        'Reptilian Overlords',
        'Moon Landing Faked',
        '9/11 Inside Job',
        'CIA Killed JFK',
        'MKUltra',
        'Mass Surveillance',
      ],
    },
  });
  const { scheduledFor: wedSF, expiresAt: wedEA } = makeSchedule('2026-03-04');
  const wedGP = await createGroupPrompt({ promptId: wedPrompt.id, scheduledFor: wedSF, expiresAt: wedEA });
  allGroupPromptIds.push(wedGP.id);

  // Photo Completion Phase 2 prompt (runs alongside Wednesday's prompt)
  console.log('\n--- Wednesday Mar 4: Photo Completion Phase 2 ---');
  const phase2Prompt = await createPrompt({
    type: 'photo',
    content: 'Complete this photo! What\'s happening just out of frame? Take a photo to extend the scene.',
    title: 'Complete the Photo',
    category: 'photo',
    payload: { is_photo_completion: true, phase: 2 },
  });
  const { scheduledFor: phase2SF, expiresAt: phase2EA } = makeSchedule('2026-03-04');
  const phase2GP = await createGroupPrompt({ promptId: phase2Prompt.id, scheduledFor: phase2SF, expiresAt: phase2EA });
  allGroupPromptIds.push(phase2GP.id);

  // ==========================================
  // Set up Photo Completion Game State + Assignments
  // ==========================================
  console.log('\n--- Setting up Photo Completion Game ---');

  // Create game state
  const { data: gameState, error: gsError } = await supabase
    .from('photo_completion_game_state')
    .insert({
      group_id: THUGZ_GROUP_ID,
      week_of: WEEK_OF,
      phase: 'submit_cutoff',
      cutoff_group_prompt_id: tueGP.id,
      completion_group_prompt_id: phase2GP.id,
    })
    .select()
    .single();

  if (gsError) {
    console.error(`  ERROR creating game state: ${gsError.message}`);
  } else {
    console.log(`  Created photo_completion_game_state: ${gameState.id}`);
  }

  // Create circular assignments (A→B, B→C, ..., H→A)
  // Shuffle members first for random pairing
  const shuffled = shuffle(ALL_MEMBER_IDS);
  console.log(`  Assignment rotation: ${shuffled.map(id => USERNAMES[id]).join(' → ')}`);

  for (let i = 0; i < shuffled.length; i++) {
    const originalUserId = shuffled[i];
    const completerUserId = shuffled[(i + 1) % shuffled.length]; // next person completes

    const { error: asgError } = await supabase
      .from('photo_completion_assignments')
      .insert({
        game_id: gameState.id,
        original_user_id: originalUserId,
        completer_user_id: completerUserId,
      });

    if (asgError) {
      console.error(`  ERROR assigning ${USERNAMES[originalUserId]} → ${USERNAMES[completerUserId]}: ${asgError.message}`);
    } else {
      console.log(`  ${USERNAMES[originalUserId]}'s photo → completed by ${USERNAMES[completerUserId]}`);
    }
  }

  // ==========================================
  // THURSDAY Mar 5 - Photo: Recreate a Famous Painting (Tribunal)
  // ==========================================
  console.log('\n--- Thursday Mar 5: Photo - Recreate a Famous Painting (Tribunal) ---');
  const thuPrompt = await createPrompt({
    type: 'photo',
    content: 'Recreate a famous painting. Caption it with the painting title.',
    title: 'Famous Painting',
    category: 'photo',
    payload: { is_tribunal: true },
  });
  const { scheduledFor: thuSF, expiresAt: thuEA } = makeSchedule('2026-03-05');
  const thuGP = await createGroupPrompt({ promptId: thuPrompt.id, scheduledFor: thuSF, expiresAt: thuEA });
  allGroupPromptIds.push(thuGP.id);

  // ==========================================
  // FRIDAY Mar 6 - Photo: Steps Screenshot (Steps Challenge)
  // ==========================================
  console.log('\n--- Friday Mar 6: Photo - Steps Screenshot ---');
  const friPrompt = await createPrompt({
    type: 'photo',
    content: 'Screenshot your Health app monthly steps (Health → Steps → Highlights → Monthly). Enter your daily step average below.',
    title: 'Steps Challenge',
    category: 'photo',
    payload: { is_steps: true },
  });
  const { scheduledFor: friSF, expiresAt: friEA } = makeSchedule('2026-03-06');
  const friGP = await createGroupPrompt({ promptId: friPrompt.id, scheduledFor: friSF, expiresAt: friEA });
  allGroupPromptIds.push(friGP.id);

  // ==========================================
  // SATURDAY Mar 7 - Short Text: Random Ingredient
  // ==========================================
  console.log('\n--- Saturday Mar 7: Short Text - Random Ingredient ---');
  const satPrompt = await createPrompt({
    type: 'short_text',
    content: 'Pick a random ingredient. All ingredients combine into one recipe at Fireside. 5th place cooks it next week.',
    title: 'Random Ingredient',
    category: 'text',
  });
  const { scheduledFor: satSF, expiresAt: satEA } = makeSchedule('2026-03-07');
  const satGP = await createGroupPrompt({ promptId: satPrompt.id, scheduledFor: satSF, expiresAt: satEA });
  allGroupPromptIds.push(satGP.id);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n========== SUMMARY ==========');
  console.log(`Total group_prompts created: ${allGroupPromptIds.length}`);
  console.log('Group prompt IDs:');
  allGroupPromptIds.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));

  // Verify
  console.log('\n--- Verification ---');
  const { data: gps } = await supabase
    .from('group_prompts')
    .select('id, scheduled_for, expires_at, week_of, prompt_id, prompts(type, title, payload)')
    .eq('group_id', THUGZ_GROUP_ID)
    .eq('week_of', WEEK_OF)
    .order('scheduled_for');

  console.log(`\nGroup prompts for week ${WEEK_OF}:`);
  for (const gp of (gps || [])) {
    const p = gp.prompts;
    const flags = p?.payload ? Object.keys(p.payload).filter(k => p.payload[k] === true).join(', ') : '';
    console.log(`  ${gp.scheduled_for} | ${p?.type || '?'} | ${p?.title || '?'} | ${flags || '-'} | ${gp.id}`);
  }

  // Photo completion
  const { data: pcgs } = await supabase
    .from('photo_completion_game_state')
    .select('*')
    .eq('group_id', THUGZ_GROUP_ID)
    .eq('week_of', WEEK_OF);

  console.log(`\nPhoto completion game states: ${pcgs?.length || 0}`);
  for (const g of (pcgs || [])) {
    console.log(`  Phase: ${g.phase}, Cutoff GP: ${g.cutoff_group_prompt_id}, Completion GP: ${g.completion_group_prompt_id}`);
  }

  const { data: pcas } = await supabase
    .from('photo_completion_assignments')
    .select('*')
    .eq('game_id', gameState?.id);

  console.log(`\nPhoto completion assignments: ${pcas?.length || 0}`);
  for (const a of (pcas || [])) {
    console.log(`  ${USERNAMES[a.original_user_id] || a.original_user_id} → ${USERNAMES[a.completer_user_id] || a.completer_user_id}`);
  }

  console.log('\nDone!');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
