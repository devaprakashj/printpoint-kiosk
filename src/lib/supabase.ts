import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nsfalguxcgsshssmgkom.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjI2ODQsImV4cCI6MjEwNjkzODY4NH0.cpenRE93Nyw-6wQSsZ1DS7Pcw6yUn3ADeHgd8NnMa8Y';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2MjY4NCwiZXhwIjoyMTA2OTM4Njg0fQ.ldvQdwFY_ANUTEHgAR-IR1PBZySvsiHUXJo2MfDUI6g';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY));

// Public client for browser / read operations
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)
  : null;

// Admin client with Service Role Key for server-side trusted DB queries & bypass RLS
export const supabaseAdmin = isSupabaseConfigured && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;

