import { NextResponse } from 'next/server';
import { getSessionUser } from '../../../../lib/auth';
import { readData, writeData } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Helper to check admin authorization
async function checkAdminAuth() {
  const user = await getSessionUser();
  if (!user || user.email.toLowerCase() !== 'avipro1122@gmail.com') {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 }), user: null };
  }
  return { authorized: true, response: null, user };
}

// GET: Retrieve all stocks
export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const data = readData();
    return NextResponse.json({
      success: true,
      stocks: data.stocks
    });
  } catch (error) {
    console.error("Fetch stocks error:", error);
    return NextResponse.json({ error: "Failed to load stocks" }, { status: 500 });
  }
}

// POST: Add new stock record
export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { ticker, name, price, change, marketCap, peRatio, divYield, roe } = await request.json();
    if (!ticker || !name || price === undefined) {
      return NextResponse.json({ error: "Missing required fields: ticker, name, price" }, { status: 400 });
    }

    const data = readData();
    const now = new Date().toISOString();
    const cleanTicker = ticker.toUpperCase().trim();

    // Check duplicates
    if (data.stocks.some(s => s.ticker === cleanTicker)) {
      return NextResponse.json({ error: `Stock with ticker ${cleanTicker} already exists.` }, { status: 400 });
    }

    const newStock = {
      id: String(data.stocks.length + 1),
      ticker: cleanTicker,
      name: name.trim(),
      price: Number(price),
      change: change || "+0.00%",
      marketCap: marketCap || "N/A",
      peRatio: peRatio || "N/A",
      divYield: divYield || "N/A",
      roe: roe || "N/A"
    };

    data.stocks.push(newStock);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "STOCK_CREATED",
      details: `Created stock: ${newStock.ticker} (${newStock.name})`,
      timestamp: now
    });

    writeData(data);

    return NextResponse.json({
      success: true,
      stock: newStock
    }, { status: 201 });
  } catch (error) {
    console.error("Create stock error:", error);
    return NextResponse.json({ error: "Failed to create stock record" }, { status: 500 });
  }
}

// PUT: Update stock details
export async function PUT(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { id, ticker, name, price, change, marketCap, peRatio, divYield, roe } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing stock ID in body" }, { status: 400 });
    }

    const data = readData();
    const now = new Date().toISOString();

    const stock = data.stocks.find(s => s.id === String(id));
    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // Update fields
    if (ticker) stock.ticker = ticker.toUpperCase().trim();
    if (name) stock.name = name.trim();
    if (price !== undefined) stock.price = Number(price);
    if (change !== undefined) stock.change = change;
    if (marketCap !== undefined) stock.marketCap = marketCap;
    if (peRatio !== undefined) stock.peRatio = peRatio;
    if (divYield !== undefined) stock.divYield = divYield;
    if (roe !== undefined) stock.roe = roe;

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "STOCK_UPDATED",
      details: `Updated stock details for: ${stock.ticker}`,
      timestamp: now
    });

    writeData(data);

    return NextResponse.json({
      success: true,
      stock
    });
  } catch (error) {
    console.error("Update stock error:", error);
    return NextResponse.json({ error: "Failed to update stock record" }, { status: 500 });
  }
}

// DELETE: Remove stock record
export async function DELETE(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) return auth.response!;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing stock ID in body" }, { status: 400 });
    }

    const data = readData();
    const now = new Date().toISOString();

    const stockIdx = data.stocks.findIndex(s => s.id === String(id));
    if (stockIdx === -1) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const stock = data.stocks[stockIdx];
    data.stocks.splice(stockIdx, 1);

    // Log action
    data.logs.push({
      id: String(data.logs.length + 1),
      email: auth.user!.email,
      action: "STOCK_DELETED",
      details: `Deleted stock record: ${stock.ticker}`,
      timestamp: now
    });

    writeData(data);

    return NextResponse.json({
      success: true,
      message: "Stock record deleted successfully"
    });
  } catch (error) {
    console.error("Delete stock error:", error);
    return NextResponse.json({ error: "Failed to delete stock record" }, { status: 500 });
  }
}
