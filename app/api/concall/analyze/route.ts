import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateFallbackReport, transformReportToQ2FY27 } from '../../../../lib/fallbackReports';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getConcallsFilePath = () => path.join(process.cwd(), 'concalls.json');

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

function cleanJsonString(str: string): string {
  return str
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() || '';
  const companyName = searchParams.get('name')?.trim() || symbol;

  if (!symbol || symbol.trim() === '' || symbol.toLowerCase() === 'undefined' || symbol.toLowerCase() === 'null') {
    return NextResponse.json(
      { error: 'Bad Request. Missing "symbol" parameter.' },
      { status: 400 }
    );
  }

  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '').trim();

  // 1. Check Memory Cache
  const cached = cache.get(cleanSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ success: true, cached: true, data: cached.data });
  }

  // 2. Check Local concalls.json Database (populated by processing script)
  const dbPath = getConcallsFilePath();
  if (fs.existsSync(dbPath)) {
    try {
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(dbContent);
      
      if (db[cleanSymbol]) {
        const availableQuarters = Object.keys(db[cleanSymbol]);
        if (availableQuarters.length > 0) {
          const sortedQuarters = sortQuarterKeys(availableQuarters);
          const latestQuarter = sortedQuarters[0];
          const latestReport = transformReportToQ2FY27(db[cleanSymbol][latestQuarter]);

          // If we have previous quarters, dynamically inject comparison if needed
          if (sortedQuarters.length > 1) {
            const prevQuarter = sortedQuarters[1];
            const prevReport = db[cleanSymbol][prevQuarter];
            
            // If comparePrevious has default placeholder text, we can overlay it
            if (prevReport && (!latestReport.comparePrevious || latestReport.comparePrevious.improvements?.length <= 1)) {
              latestReport.comparePrevious = {
                improvements: [
                  `Revenue changed to ${latestReport.keyNumbers?.revenue || 'N/A'} (compared to ${prevReport.keyNumbers?.revenue || 'N/A'} in ${prevQuarter})`,
                  `EBITDA margins stood at ${latestReport.quarterlyPerformance?.ebitda || 'N/A'} (compared to ${prevReport.quarterlyPerformance?.ebitda || 'N/A'} in ${prevQuarter})`
                ],
                deterioration: [
                  `Cost pressures: ${latestReport.managementCommentary?.costPressures?.[0] || 'Continued inflationary impact'}`
                ],
                newDevelopments: latestReport.managementCommentary?.newProducts || []
              };
            }
          }

          cache.set(cleanSymbol, { data: latestReport, timestamp: Date.now() });
          return NextResponse.json({ success: true, cached: false, source: 'concalls.json', data: latestReport });
        }
      }
    } catch (e) {
      console.error('Error reading local concalls.json:', e);
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
  if (whiteList.includes(cleanSymbol)) {
    const report = transformReportToQ2FY27(generateFallbackReport(cleanSymbol, companyName));
    cache.set(cleanSymbol, { data: report, timestamp: Date.now() });
    return NextResponse.json({ success: true, cached: false, source: 'fallbackReports.ts', data: report });
  }

  // 4. If no local concall is available, fail gracefully
  return NextResponse.json(
    { success: false, error: 'No Concall Transcript Available' },
    { status: 404 }
  );
}
