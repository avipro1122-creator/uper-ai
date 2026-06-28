import { supabase } from './supabase';

const LIMIT = 60; // Max requests
const WINDOW_MS = 60 * 1000; // 1 minute window

// Fallback in-memory tracking in case database is offline or unconfigured
const fallbackCache = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Checks and updates rate limit status for a given IP address.
 * Uses Supabase database tracking with a local fallback cache for robustness.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = new Date();

  // Guard: If Supabase connection details are missing, fall back immediately to in-memory limits
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return handleInMemoryFallback(ip, now);
  }

  try {
    // 1. Fetch current request limits from database
    const { data, error } = await supabase
      .from('rate_limits')
      .select('request_count, last_request_at')
      .eq('ip_address', ip)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Case A: No previous record exists for this IP address
    if (!data) {
      const reset = new Date(now.getTime() + WINDOW_MS);
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          ip_address: ip,
          request_count: 1,
          last_request_at: now.toISOString()
        });

      if (insertError) throw insertError;
      return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset };
    }

    const lastRequest = new Date(data.last_request_at);
    const diffMs = now.getTime() - lastRequest.getTime();
    
    // Case B: Previous window has expired
    if (diffMs > WINDOW_MS) {
      const reset = new Date(now.getTime() + WINDOW_MS);
      const { error: updateError } = await supabase
        .from('rate_limits')
        .update({
          request_count: 1,
          last_request_at: now.toISOString()
        })
        .eq('ip_address', ip);

      if (updateError) throw updateError;
      return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset };
    }

    const currentCount = data.request_count;
    const reset = new Date(lastRequest.getTime() + WINDOW_MS);

    // Case C: Rate limit exceeded
    if (currentCount >= LIMIT) {
      return { success: false, limit: LIMIT, remaining: 0, reset };
    }

    // Case D: Request is within limits, increment counter
    const { error: incrementError } = await supabase
      .from('rate_limits')
      .update({
        request_count: currentCount + 1
      })
      .eq('ip_address', ip);

    if (incrementError) throw incrementError;

    return { success: true, limit: LIMIT, remaining: LIMIT - (currentCount + 1), reset };

  } catch (err) {
    console.warn(`Rate Limit Database check failed for IP ${ip}. Falling back to memory:`, err.message || err);
    return handleInMemoryFallback(ip, now);
  }
}

function handleInMemoryFallback(ip: string, now: Date): RateLimitResult {
  const record = fallbackCache.get(ip);
  
  if (!record || record.resetTime < now.getTime()) {
    const reset = new Date(now.getTime() + WINDOW_MS);
    fallbackCache.set(ip, { count: 1, resetTime: reset.getTime() });
    return { success: true, limit: LIMIT, remaining: LIMIT - 1, reset };
  }

  if (record.count >= LIMIT) {
    return { success: false, limit: LIMIT, remaining: 0, reset: new Date(record.resetTime) };
  }

  record.count += 1;
  return { success: true, limit: LIMIT, remaining: LIMIT - record.count, reset: new Date(record.resetTime) };
}
