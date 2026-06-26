import { NextResponse } from 'next/server';
import { readData } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = readData();
    return NextResponse.json({
      success: true,
      stats: {
        totalCompanies: 150 + (data.stocks ? data.stocks.length : 0),
        documentsIndexed: 2450000 + (data.news ? data.news.length * 12 : 0),
        aiReportsGenerated: 12450 + (data.logs ? data.logs.length * 7 : 0)
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("Public stats error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching stats" },
      { status: 500 }
    );
  }
}
