import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isValidUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder-url.supabase.co';

if (!isValidUrl || !supabaseServiceRoleKey || supabaseServiceRoleKey === 'your_supabase_service_role_key_here') {
  console.warn('Warning: SUPABASE_URL is not a valid HTTP/HTTPS URL or SUPABASE_SERVICE_ROLE_KEY is missing. Using fallback placeholder client for compilation safety.');
}

// Service role client bypasses RLS policies and is safe only on the server
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || 'placeholder-key', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
