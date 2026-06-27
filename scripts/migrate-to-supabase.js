import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Load env variables from .env.local manually to avoid extra dependencies
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at the project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`^${key}\\s*=\\s*["']?([^\\r\\n"']+)["']?`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVal('SUPABASE_URL');
const supabaseServiceRoleKey = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// 2. Read database.json
const dbPath = path.resolve(process.cwd(), 'database.json');
if (!fs.existsSync(dbPath)) {
  console.error('Error: database.json file not found at the project root.');
  process.exit(1);
}

const rawData = fs.readFileSync(dbPath, 'utf8');
const data = JSON.parse(rawData);

async function migrate() {
  console.log('\n--- Starting Migration to Supabase ---');

  // Migrate Users
  if (data.users && data.users.length > 0) {
    console.log(`Migrating ${data.users.length} users...`);
    const mappedUsers = data.users.map(u => ({
      id: u.id,
      google_id: u.googleId || null,
      name: u.name || null,
      email: u.email || null,
      profile_image: u.profileImage || null,
      role: u.role || 'USER',
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: u.updatedAt || new Date().toISOString(),
      last_login: u.lastLogin || new Date().toISOString(),
    }));

    const { error } = await supabase.from('users').upsert(mappedUsers);
    if (error) console.error('Error migrating users:', error.message);
    else console.log('Users migrated successfully!');
  }

  // Migrate Stocks
  if (data.stocks && data.stocks.length > 0) {
    console.log(`Migrating ${data.stocks.length} stocks...`);
    const mappedStocks = data.stocks.map(s => ({
      id: s.id,
      ticker: s.ticker,
      name: s.name || null,
      price: parseFloat(s.price) || 0,
      change: s.change || null,
      market_cap: s.marketCap || null,
      pe_ratio: s.peRatio || null,
      div_yield: s.divYield || null,
      roe: s.roe || null,
    }));

    const { error } = await supabase.from('stocks').upsert(mappedStocks);
    if (error) console.error('Error migrating stocks:', error.message);
    else console.log('Stocks migrated successfully!');
  }

  // Migrate News
  if (data.news && data.news.length > 0) {
    console.log(`Migrating ${data.news.length} news articles...`);
    const mappedNews = data.news.map(n => ({
      id: n.id,
      title: n.title || null,
      content: n.content || null,
      author: n.author || null,
      date: n.date || new Date().toISOString(),
    }));

    const { error } = await supabase.from('news').upsert(mappedNews);
    if (error) console.error('Error migrating news:', error.message);
    else console.log('News migrated successfully!');
  }

  // Migrate Feedback
  if (data.feedback && data.feedback.length > 0) {
    console.log(`Migrating ${data.feedback.length} feedback items...`);
    const mappedFeedback = data.feedback.map(f => ({
      id: f.id,
      name: f.name || null,
      email: f.email || null,
      type: f.type || null,
      message: f.message || null,
      date: f.date || new Date().toISOString(),
    }));

    const { error } = await supabase.from('feedback').upsert(mappedFeedback);
    if (error) console.error('Error migrating feedback:', error.message);
    else console.log('Feedback migrated successfully!');
  }

  // Migrate Logs
  if (data.logs && data.logs.length > 0) {
    console.log(`Migrating ${data.logs.length} logs...`);
    const mappedLogs = data.logs.map(l => ({
      id: l.id,
      email: l.email || null,
      action: l.action || null,
      details: l.details || null,
      timestamp: l.timestamp || new Date().toISOString(),
    }));

    const { error } = await supabase.from('logs').upsert(mappedLogs);
    if (error) console.error('Error migrating logs:', error.message);
    else console.log('Logs migrated successfully!');
  }

  console.log('\n--- Migration Finished ---');
}

migrate().catch(err => {
  console.error('Unhandled migration error:', err);
});
