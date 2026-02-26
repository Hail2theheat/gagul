/**
 * Schedule Wirthlin Family Cruise Week: Mar 2 - 7, 2026
 * Week of: 2026-03-02
 *
 * Mon-Sat: 4 photos (2 AI-judged), 1 text quote, 1 counter (Fri)
 * All Mon prompts open Mon 3AM EST → Sat midnight EST
 * Counter prompt opens Fri 3AM EST → Sat midnight EST
 *
 * Prompt order (staggered by 1s for ordering):
 *   1. Photo - Secret Richard Photo (Tribunal)
 *   2. Photo - Favorite Cruise Meal
 *   3. Photo - Worst Part of Cruise
 *   4. Photo - Most Fun on Cruise (Tribunal)
 *   5. Short Text - Best Cruise Quote
 *   6. Short Text - Rate the Cruise (Counter) — drops Friday
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jssuzpodzgwfrpzmtpva.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzc3V6cG9kemd3ZnJwem10cHZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODQzODQ4NSwiZXhwIjoyMDg0MDE0NDg1fQ.6K532OFnOVkzve7_JUVh9zmnNR0Af_CbBhPMrwQCVLk'
);

// === IDs ===
const GROUP_ID = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';
const WEEK_OF = '2026-03-02';

async function createPrompt({ type, content, title, category, payload }) {
  const row = { type, content, title, category, is_active: true };
  if (payload) row.payload = payload;
  const { data, error } = await supabase
    .from('prompts')
    .insert(row)
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
      group_id: GROUP_ID,
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
  console.log('=== Scheduling Wirthlin Family Cruise Week: Mar 2-7, 2026 ===\n');

  // Mon 3AM EST (8:00 UTC) → Sat midnight EST (Sun 5:00 UTC)
  const MON_START = '2026-03-02T08:00:00.000Z';
  const SAT_END = '2026-03-08T05:00:00.000Z';

  // Fri 3AM EST (8:00 UTC) → Sat midnight EST (Sun 5:00 UTC)
  const FRI_START = '2026-03-06T08:00:00.000Z';

  const allGroupPromptIds = [];

  // ==========================================
  // PROMPT 1: Secret Richard Photo (Tribunal)
  // ==========================================
  console.log('--- Prompt 1: Photo - Secret Richard Photo (Tribunal) ---');
  const p1 = await createPrompt({
    type: 'photo',
    content: 'Take/upload a picture of Richard on the cruise without him knowing. Funniest wins, AI rates. Must be secret and not staged.',
    title: 'Secret Richard Photo',
    category: 'photo',
    payload: { is_tribunal: true },
  });
  const gp1 = await createGroupPrompt({
    promptId: p1.id,
    scheduledFor: '2026-03-02T08:00:00.000Z',
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp1.id);

  // ==========================================
  // PROMPT 2: Favorite Cruise Meal
  // ==========================================
  console.log('\n--- Prompt 2: Photo - Favorite Cruise Meal ---');
  const p2 = await createPrompt({
    type: 'photo',
    content: 'Take/upload your favorite meal from the cruise',
    title: 'Favorite Cruise Meal',
    category: 'photo',
  });
  const gp2 = await createGroupPrompt({
    promptId: p2.id,
    scheduledFor: '2026-03-02T08:00:01.000Z',
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp2.id);

  // ==========================================
  // PROMPT 3: Worst Part of Cruise
  // ==========================================
  console.log('\n--- Prompt 3: Photo - Worst Part of Cruise ---');
  const p3 = await createPrompt({
    type: 'photo',
    content: 'Take/upload a photo of the worst part of your cruise',
    title: 'Worst Part of Cruise',
    category: 'photo',
  });
  const gp3 = await createGroupPrompt({
    promptId: p3.id,
    scheduledFor: '2026-03-02T08:00:02.000Z',
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp3.id);

  // ==========================================
  // PROMPT 4: Most Fun on Cruise (Tribunal)
  // ==========================================
  console.log('\n--- Prompt 4: Photo - Most Fun on Cruise (Tribunal) ---');
  const p4 = await createPrompt({
    type: 'photo',
    content: 'Prove that you had the most fun on the Disney cruise',
    title: 'Most Fun on Cruise',
    category: 'photo',
    payload: { is_tribunal: true },
  });
  const gp4 = await createGroupPrompt({
    promptId: p4.id,
    scheduledFor: '2026-03-02T08:00:03.000Z',
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp4.id);

  // ==========================================
  // PROMPT 5: Best Cruise Quote
  // ==========================================
  console.log('\n--- Prompt 5: Short Text - Best Cruise Quote ---');
  const p5 = await createPrompt({
    type: 'short_text',
    content: "What's the best quote from the cruise?",
    title: 'Best Cruise Quote',
    category: 'text',
  });
  const gp5 = await createGroupPrompt({
    promptId: p5.id,
    scheduledFor: '2026-03-02T08:00:04.000Z',
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp5.id);

  // ==========================================
  // PROMPT 6: Rate the Cruise (Counter) — drops Friday
  // ==========================================
  console.log('\n--- Prompt 6: Short Text - Rate the Cruise (Counter, Friday) ---');
  const p6 = await createPrompt({
    type: 'short_text',
    content: 'Rate the cruise',
    title: 'Rate the Cruise',
    category: 'text',
    payload: { is_counter: true },
  });
  const gp6 = await createGroupPrompt({
    promptId: p6.id,
    scheduledFor: FRI_START,
    expiresAt: SAT_END,
  });
  allGroupPromptIds.push(gp6.id);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n\n========== SUMMARY ==========');
  console.log(`Total group_prompts created: ${allGroupPromptIds.length}`);

  // Verify
  console.log('\n--- Verification ---');
  const { data: gps } = await supabase
    .from('group_prompts')
    .select('id, scheduled_for, expires_at, prompts(type, title, payload)')
    .eq('group_id', GROUP_ID)
    .eq('week_of', WEEK_OF)
    .order('scheduled_for');

  console.log(`\nGroup prompts for week ${WEEK_OF}:`);
  for (const gp of (gps || [])) {
    const p = gp.prompts;
    const flags = [];
    if (p?.payload?.is_tribunal) flags.push('TRIBUNAL');
    if (p?.payload?.is_counter) flags.push('COUNTER');
    const flagStr = flags.length ? ` [${flags.join(', ')}]` : '';
    console.log(`  ${gp.scheduled_for} - ${gp.expires_at} | ${(p?.type || '?').padEnd(13)} | ${p?.title || '?'}${flagStr}`);
  }

  console.log('\nDone!');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
