import { NextResponse } from 'next/server';
import { readData } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json({
      success: true,
      stocks: data.stocks || []
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Public stocks fetch error:", error);
    return NextResponse.json({ error: "Failed to load stocks" }, { status: 500 });
  }
}
