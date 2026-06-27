const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`^${key}\\s*=\\s*["']?([^\\r\\n"']+)["']?`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVal('SUPABASE_URL');
const supabaseServiceRoleKey = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function check() {
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  const { data: stocks, error: sErr } = await supabase.from('stocks').select('*');
  console.log("USERS COUNT:", users ? users.length : 0, uErr);
  console.log("STOCKS COUNT:", stocks ? stocks.length : 0, sErr);
  if (stocks) console.log("SAMPLE STOCKS:", stocks.slice(0, 3));
}

check();
