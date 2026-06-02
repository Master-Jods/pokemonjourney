import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrmqgjkhzhxqalcviueb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybXFnamtoemh4cWFsY3ZpdWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODc1MzUsImV4cCI6MjA5NTU2MzUzNX0.oF0N_O_ZpLPXoQEA_P9XeEz4Jmtfy6UrxJED0u5j_Cc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: logs, error } = await supabase
    .from('game_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('--- RECENT GAME LOGS ---');
  for (const log of logs) {
    console.log(`ID: ${log.id} | System: ${log.source_system} | PokemonId: ${log.pokemon_id} | Game: ${log.game_name} | Result: ${log.result} | LevelGain: ${log.level_gain} | Detail: ${log.logged_by}`);
  }
}

main();
