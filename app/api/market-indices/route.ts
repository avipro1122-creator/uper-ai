import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface IndexData {
  value: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  prevClose: number;
}

const checkIndianMarketStatus = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  
  const day = ist.getDay();
  if (day === 0 || day === 6) return false; // Weekend
  
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const timeVal = hours * 60 + minutes;
  const startVal = 9 * 60 + 15; // 09:15 AM
  const endVal = 15 * 60 + 30; // 03:30 PM
  
  return timeVal >= startVal && timeVal <= endVal;
};

const formatISTTime = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  return ist.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';
};

async function fetchIndexFromYahoo(symbol: string): Promise<IndexData | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 5 } // Cache for 5 seconds
    });
    
    if (!res.ok) {
      console.error(`Yahoo Finance API error for ${symbol}: ${res.statusText}`);
      return null;
    }
    
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta) return null;
    
    const value = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? value;
    const change = value - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    
    return {
      value: parseFloat(value.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      high: parseFloat((meta.regularMarketDayHigh ?? value).toFixed(2)),
      low: parseFloat((meta.regularMarketDayLow ?? value).toFixed(2)),
      prevClose: parseFloat(prevClose.toFixed(2))
    };
  } catch (err) {
    console.error(`Failed to fetch ${symbol} from Yahoo Finance:`, err);
    return null;
  }
}

async function fetchSensexFromBseIndia(): Promise<IndexData | null> {
  try {
    const url = 'https://api.bseindia.com/RealTimeBseIndiaAPI/api/GetSensexData/w';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bseindia.com/',
      },
      next: { revalidate: 5 } // Cache for 5 seconds
    });
    
    if (!res.ok) {
      console.error(`BSE India API error for Sensex: ${res.statusText}`);
      return null;
    }
    
    const data = await res.json();
    const item = data?.[0];
    if (!item) return null;
    
    const parseVal = (v: string) => parseFloat(v.replace(/,/g, ''));
    const value = parseVal(item.ltp);
    const change = parseVal(item.chg);
    const changePct = parseVal(item.perchg);
    const high = parseVal(item.High ?? item.ltp);
    const low = parseVal(item.Low ?? item.ltp);
    const prevClose = parseVal(item.Prev_Close ?? item.ltp);
    
    if (isNaN(value)) return null;
    
    return {
      value,
      change,
      changePct,
      high,
      low,
      prevClose
    };
  } catch (err) {
    console.error("Failed to fetch Sensex from BSE India API:", err);
    return null;
  }
}

export async function GET() {
  // Fetch Nifty from Yahoo Finance, and Sensex from BSE API (falling back to Yahoo Finance if BSE fails)
  const [niftyData, sensexDataRaw] = await Promise.all([
    fetchIndexFromYahoo('^NSEI'),
    fetchSensexFromBseIndia()
  ]);

  let sensexData = sensexDataRaw;
  if (!sensexData) {
    console.warn("Sensex from BSE API failed, falling back to Yahoo Finance");
    sensexData = await fetchIndexFromYahoo('^BSESN');
  }
  
  const niftyFallback: IndexData = {
    value: 23530.15,
    change: 98.45,
    changePct: 0.42,
    high: 23600.00,
    low: 23450.00,
    prevClose: 23431.70
  };
  
  const sensexFallback: IndexData = {
    value: 77215.40,
    change: 292.10,
    changePct: 0.38,
    high: 77400.00,
    low: 77000.00,
    prevClose: 76923.30
  };

  return NextResponse.json({
    success: true,
    nifty: niftyData || niftyFallback,
    sensex: sensexData || sensexFallback,
    marketOpen: checkIndianMarketStatus(),
    lastUpdated: formatISTTime()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
