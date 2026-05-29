/**
 * UperAI · Stock Analysis API Route
 * app/api/analyze/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeStock, searchStocks, StockQueryParams } from "@/services/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Free-form search query
    if (body.query && typeof body.query === "string") {
      const result = await searchStocks(body.query);
      return NextResponse.json({ result });
    }

    // Structured stock analysis
    if (body.ticker) {
      const params: StockQueryParams = body;
      const analysis = await analyzeStock(params);
      return NextResponse.json(analysis);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error("[UperAI API]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
