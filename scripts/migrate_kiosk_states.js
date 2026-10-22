// migrate_kiosk_states.js
// Run: node scripts/migrate_kiosk_states.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nsfalguxcgsshssmgkom.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2MjY4NCwiZXhwIjoyMTA2OTM4Njg0fQ.ldvQdwFY_ANUTEHgAR-IR1PBZySvsiHUXJo2MfDUI6g';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log('[1/3] Testing Supabase connection...');

  const { data, error } = await sb.from('kiosk_states').select('machine_code').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('[!] kiosk_states table does NOT exist yet.');
    console.log('Please run the SQL printed below in your Supabase Dashboard SQL Editor:');
    console.log('  https://supabase.com/dashboard/project/nsfalguxcgsshssmgkom/editor');
    return;
  }
  
  if (error) {
    console.error('[X] Supabase error:', error.message, error.code);
    return;
  }

  console.log('[OK] kiosk_states table exists! Rows:', JSON.stringify(data));
  
  console.log('[2/3] Testing upsert...');
  const { error: upsertErr } = await sb.from('kiosk_states').upsert(
    { machine_code: 'RIT-ATM-01', current_screen: 'ready_to_scan', is_scanner_active: true, updated_at: new Date().toISOString() },
    { onConflict: 'machine_code' }
  );
  
  if (upsertErr) {
    console.error('[X] Upsert failed:', upsertErr.message);
  } else {
    console.log('[OK] Upsert works!');
  }
  
  console.log('[3/3] Testing read-back...');
  const { data: d2, error: e2 } = await sb.from('kiosk_states').select('*').eq('machine_code', 'RIT-ATM-01').maybeSingle();
  if (e2) {
    console.error('[X] Read failed:', e2.message);
  } else {
    console.log('[OK] State:', JSON.stringify(d2, null, 2));
    console.log('SUCCESS: kiosk_states is working! Now deploy to Vercel.');
  }
}

run().catch(e => console.error('FATAL:', e.message));
