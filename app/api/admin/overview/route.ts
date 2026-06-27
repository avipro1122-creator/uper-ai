import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { readData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
      return NextResponse.json(
        { error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const data = await readData();
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: data.users.length,
        totalStocks: data.stocks.length,
        totalNews: data.news.length,
        totalFeedback: data.feedback?.length || 0,
        totalLogs: data.logs?.length || 0
      }
    });
  } catch (error) {
    console.error("Overview stats error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching admin stats" },
      { status: 500 }
    );
  }
}
