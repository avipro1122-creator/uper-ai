import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [u, s, n, f, l] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('stocks').select('*'),
      supabase.from('news').select('*'),
      supabase.from('feedback').select('*'),
      supabase.from('logs').select('*')
    ]);

    return NextResponse.json({
      success: true,
      users: { count: u.data ? u.data.length : 0, error: u.error },
      stocks: { count: s.data ? s.data.length : 0, error: s.error },
      news: { count: n.data ? n.data.length : 0, error: n.error },
      feedback: { count: f.data ? f.data.length : 0, error: f.error },
      logs: { count: l.data ? l.data.length : 0, error: l.error }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
