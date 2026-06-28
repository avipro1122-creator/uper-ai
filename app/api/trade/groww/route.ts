import { NextResponse } from 'next/server';
import { GrowwAPI } from '../../../../lib/groww';
import { getSessionUser } from '../../../../lib/auth';
import { supabase } from '../../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { apiKey, secretKey, symbol, quantity, transactionType, product, exchange } = await request.json();

    if (!symbol || !quantity || !transactionType) {
      return NextResponse.json({ error: "Missing required fields: symbol, quantity, transactionType" }, { status: 400 });
    }

    // Authenticate user session if available to log email, otherwise guest
    const user = await getSessionUser();
    const email = user ? user.email : 'guest@uperai.in';

    // Retrieve API credentials (from body parameters or fallback to env vars)
    const activeApiKey = apiKey || process.env.GROWW_API_KEY || 'mock_groww_key';
    const activeSecretKey = secretKey || process.env.GROWW_SECRET_KEY || 'mock_groww_secret';

    console.log(`[Groww API] Authenticating token for transaction: ${transactionType} ${symbol}`);
    const token = await GrowwAPI.getAccessToken(activeApiKey, activeSecretKey);
    const growwClient = new GrowwAPI(token);

    console.log(`[Groww API] Placing order for ${quantity} shares of ${symbol}`);
    const orderResult = await growwClient.placeOrder({
      tradingSymbol: symbol.toUpperCase().trim(),
      quantity: Number(quantity),
      validity: GrowwAPI.VALIDITY_DAY,
      exchange: exchange || GrowwAPI.EXCHANGE_NSE,
      segment: GrowwAPI.SEGMENT_CASH,
      product: product || GrowwAPI.PRODUCT_MIS,
      orderType: GrowwAPI.ORDER_TYPE_MARKET,
      transactionType: transactionType.toUpperCase().trim()
    });

    // Write audit log to Supabase logs table
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Fetch latest logs to generate ID
      const { data: currentLogs } = await supabase.from('logs').select('id');
      const nextId = String((currentLogs?.length || 0) + 1);

      await supabase.from('logs').insert({
        id: nextId,
        email,
        action: `GROWW_ORDER_${transactionType.toUpperCase()}`,
        details: `Placed Groww ${transactionType} order for ${quantity} share(s) of ${symbol}. Order ID: ${orderResult.groww_order_id}`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      data: orderResult
    });

  } catch (error: any) {
    console.error("Groww Order placement failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to place Groww order."
    }, { status: 500 });
  }
}
