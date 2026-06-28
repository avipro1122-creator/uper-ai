import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { generateFallbackReport } from '../../../../lib/fallbackReports';

export const dynamic = 'force-dynamic';

// Helper to sort quarter keys like Q4_FY26, Q3_FY26, Q1_FY25 in descending order
const sortQuarterKeys = (keys: string[]): string[] => {
  return keys.sort((a, b) => {
    const aParts = a.split('_');
    const bParts = b.split('_');
    
    const aYr = aParts[1] || '';
    const bYr = bParts[1] || '';
    if (aYr !== bYr) {
      return bYr.localeCompare(aYr);
    }
    
    const aQtr = aParts[0] || '';
    const bQtr = bParts[0] || '';
    return bQtr.localeCompare(aQtr);
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() || '';
  const displayName = searchParams.get('name')?.trim() || symbol;

  if (!symbol) {
    return NextResponse.json(
      { error: 'Bad Request. Missing "symbol" parameter.' },
      { status: 400 }
    );
  }

  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').trim();

  // 1. Identify client IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  let rateLimitStatus;
  try {
    rateLimitStatus = await checkRateLimit(ip);
    if (!rateLimitStatus.success) {
      return NextResponse.json(
        { 
          error: 'Too Many Requests. Rate limit exceeded.', 
          limit: rateLimitStatus.limit,
          remaining: rateLimitStatus.remaining,
          reset: rateLimitStatus.reset.toISOString()
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitStatus.limit),
            'X-RateLimit-Remaining': String(rateLimitStatus.remaining),
            'X-RateLimit-Reset': rateLimitStatus.reset.toISOString(),
            'Retry-After': String(Math.ceil((rateLimitStatus.reset.getTime() - Date.now()) / 1000))
          }
        }
      );
    }
  } catch (err) {
    console.error('Rate Limiter error (bypassing):', err);
  }

  // 2. Check Local concalls.json Database
  let concallReport = null;
  const dbPath = path.join(process.cwd(), 'concalls.json');
  if (fs.existsSync(dbPath)) {
    try {
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(dbContent);
      if (db[cleanSymbol]) {
        const availableQuarters = Object.keys(db[cleanSymbol]);
        if (availableQuarters.length > 0) {
          const sortedQuarters = sortQuarterKeys(availableQuarters);
          concallReport = db[cleanSymbol][sortedQuarters[0]];
        }
      }
    } catch (e) {
      console.error('Error reading concalls.json inside stock analyze route:', e);
    }
  }

  // 3. Fallback: Predefined whitelist reports (all Nifty 50 folders)
  const whiteList = [
    'ADANIENT', 'ADANIPORTS', 'AXISBANK', 'BAJAJ-AUTO', 'BAJFINANCE', 
    'BAJAJFINSV', 'BEL', 'BHARTIARTL', 'COALINDIA', 'HCLTECH', 
    'HDFCBANK', 'HINDUNILVR', 'ICICIBANK', 'INFY', 'JSWSTEEL', 
    'KOTAKBANK', 'LT', 'M&M', 'MARUTI', 'NTPC', 
    'NESTLEIND', 'ONGC', 'RELIANCE', 'RIL', 'SBIN', 
    'SUNPHARMA', 'TCS', 'TITAN', 'ULTRACEMCO', 'TATAPOWER', 
    'TATAMOTORS'
  ];
  if (!concallReport && whiteList.includes(cleanSymbol)) {
    concallReport = generateFallbackReport(cleanSymbol, displayName);
  }

  if (concallReport) {
    const analysisResult = {
      summary: concallReport.executiveSummary.overallSentiment || concallReport.executiveSummary.bullets[0],
      peRatio: concallReport.keyNumbers.roe || "N/A",
      marketCap: "N/A",
      divYield: "N/A",
      roe: "N/A",
      technicalOverview: concallReport.executiveSummary.bullets.map((b: string) => `• ${b}`).join('\n'),
      sections: [
        {
          title: "Executive Summary",
          content: concallReport.executiveSummary.bullets.map((b: string) => `• ${b}`).join('\n')
        },
        {
          title: "Management Commentary",
          content: `• Business Updates:\n${concallReport.managementCommentary.businessUpdates.map((b: string) => `  - ${b}`).join('\n')}\n\n• Cost Pressures:\n${concallReport.managementCommentary.costPressures.map((b: string) => `  - ${b}`).join('\n')}`
        },
        {
          title: "Future Guidance",
          content: `• Revenue Guidance: ${concallReport.futureGuidance.revenueGuidance}\n• Margin Guidance: ${concallReport.futureGuidance.marginGuidance}\n• Capex Plans: ${concallReport.futureGuidance.capexPlans}\n• Growth Outlook: ${concallReport.futureGuidance.growthOutlook}`
        }
      ]
    };

    const headers = new Headers();
    if (rateLimitStatus) {
      headers.set('X-RateLimit-Limit', String(rateLimitStatus.limit));
      headers.set('X-RateLimit-Remaining', String(rateLimitStatus.remaining));
      headers.set('X-RateLimit-Reset', rateLimitStatus.reset.toISOString());
    }

    return NextResponse.json({
      success: true,
      data: {
        isConcall: true,
        concallData: concallReport,
        quote: {
          price: 0,
          symbol: cleanSymbol,
          volume: 0,
          timestamp: new Date().toISOString()
        },
        analysis: analysisResult
      }
    }, { status: 200, headers });
  }

  // 4. If no concall is available, fail gracefully to prevent mock dashboard rendering
  return NextResponse.json(
    { success: false, error: 'No Concall Transcript Available' },
    { status: 404 }
  );
}
