import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface StockItem {
  'bse-code': string;
  name: string;
  id: string;
  'nse-code': string;
}

let cachedStocks: StockItem[] | null = null;
let lastFetchedTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getStocks(): Promise<StockItem[]> {
  const now = Date.now();
  if (cachedStocks && (now - lastFetchedTime < CACHE_DURATION)) {
    return cachedStocks;
  }

  try {
    const res = await fetch('https://analyst.indianapi.in/static/all_stocks.json', {
      next: { revalidate: 86400 } // Cache in Next.js
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch stocks: ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      cachedStocks = data;
      lastFetchedTime = now;
      return cachedStocks;
    }
    throw new Error('Stocks data is not an array');
  } catch (error) {
    console.error('Error fetching stock list:', error);
    return cachedStocks || [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  if (!query || query.trim() === '' || query.toLowerCase() === 'undefined' || query.toLowerCase() === 'null') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const stocks = await getStocks();
    const filtered = stocks.filter(stock => {
      const name = stock.name || '';
      const nse = stock['nse-code'] || '';
      const bse = stock['bse-code'] || '';
      
      return name.toLowerCase().includes(query) || 
             nse.toLowerCase().includes(query) || 
             bse.toLowerCase().includes(query);
    }).slice(0, 15); // Return top 15 results for rich UI dropdown

    return NextResponse.json({ success: true, data: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to search stocks', details: err.message },
      { status: 500 }
    );
  }
}
