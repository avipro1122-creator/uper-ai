import { NextResponse } from 'next/server';
import { readData } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json({
      success: true,
      stocksCount: data.stocks.length,
      stocks: data.stocks,
      envUrl: process.env.SUPABASE_URL ? "defined" : "undefined",
      envKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? "defined" : "undefined"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
