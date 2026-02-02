// Quick script to query Supabase database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const query = process.argv[2] || 'groups';

  if (query === 'groups') {
    const { data, error } = await supabase.from('groups').select('id, name, code');
    if (error) console.error('Error:', error.message);
    else console.log('GROUPS:\n', JSON.stringify(data, null, 2));
  }

  if (query === 'prompts') {
    const { data, error } = await supabase.from('prompts').select('id, type, title, content, category').eq('is_active', true).limit(20);
    if (error) console.error('Error:', error.message);
    else console.log('PROMPTS:\n', JSON.stringify(data, null, 2));
  }
}

main();
