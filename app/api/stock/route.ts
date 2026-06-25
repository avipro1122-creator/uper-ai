import { NextResponse } from 'next/server';
import { fetchUpstoxQuote } from '../../../lib/upstox';
import { supabase } from '../../../lib/supabase';
import { checkRateLimit } from '../../../lib/rateLimit';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  // 1. Request Query validation
  if (!symbol || symbol.trim() === '') {
    return NextResponse.json(
      { error: 'Bad Request. Missing or empty "symbol" query parameter.' },
      { status: 400 }
    );
  }

  // 2. Identify client IP address (handles Vercel reverse proxy headers)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  let rateLimitStatus;
  try {
    // 3. Database rate limit validation
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

  try {
    // 4. Query live quote details from Upstox
    const quote = await fetchUpstoxQuote(symbol);

    // 5. Write quote log into Supabase stock_data table
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: dbError } = await supabase
        .from('stock_data')
        .insert({
          symbol: quote.symbol,
          price: quote.price,
          volume: quote.volume,
          timestamp: quote.timestamp
        });

      if (dbError) {
        console.warn(`Supabase insert failed for symbol ${symbol}:`, dbError.message);
      }
    }

    // 6. Return response with rate limit metadata headers
    const headers = new Headers();
    if (rateLimitStatus) {
      headers.set('X-RateLimit-Limit', String(rateLimitStatus.limit));
      headers.set('X-RateLimit-Remaining', String(rateLimitStatus.remaining));
      headers.set('X-RateLimit-Reset', rateLimitStatus.reset.toISOString());
    }

    return NextResponse.json(
      { success: true, data: quote },
      { status: 200, headers }
    );

  } catch (err: any) {
    console.error(`API execution failed for stock lookup "${symbol}":`, err.message || err);
    
    const statusCode = err.message?.includes('HTTP error') ? 400 : 500;
    return NextResponse.json(
      { 
        error: 'Failed to retrieve stock quote data.', 
        details: err.message || 'Unknown internal error' 
      },
      { status: statusCode }
    );
  }
}
