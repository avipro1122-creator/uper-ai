/**
 * UperAI · Gemini Integration Service
 * services/gemini.ts
 *
 * Handles all Gemini API calls with strict system instructions
 * for the Indian retail investor context.
 */

import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";

// ── SYSTEM INSTRUCTIONS ──────────────────────────────────────────────────────
const UPERAI_SYSTEM_INSTRUCTIONS = `
Role: You are the core intelligence system for UperAI (uperai.in).

Your job is to translate raw stock market numbers into plain-English business 
stories for Indian retail investors who are smart but not finance professionals.

Strict Rules:
1. Always use Indian numbering: Lakhs (1,00,000), Crores (1,00,00,000). 
   Example: ₹3.5 lakh crore market cap — never "35 billion".
2. Focus purely on: business model health, revenue quality, growth catalysts, 
   competitive moats, and valuation risks.
3. NEVER provide explicit Buy / Sell / Hold advice. You are a business analyst, 
   not a SEBI-registered investment advisor.
4. Keep tone direct, confident, and free of jargon. Write like a smart friend 
   who happens to understand business.
5. Always end with a one-line disclaimer: 
   "This is a business summary, not investment advice."
6. Structure every response in 3 clearly labeled sections:
   - The Story (2-3 sentences: what does this company do and why does it matter)
   - Growth Engine (what's driving growth or what could drive it)
   - Key Risk (the one thing investors must watch)
`;

// ── GENERATION CONFIG ────────────────────────────────────────────────────────
const GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 600,
};

// ── MOCK DATA (used when API key is absent in dev) ───────────────────────────
const MOCK_RESPONSES: Record<string, GeminiStockAnalysis> = {
  default: {
    story:
      "Tata Motors is India's largest auto conglomerate with a dual identity: a scrappy EV pioneer at home and a luxury car maker (Jaguar Land Rover) abroad. FY24 was their best year ever — ₹31,807 crore net profit after years of losses.",
    growthEngine:
      "JLR's order book remains strong with 18-month waiting lists on Range Rover variants. Domestically, Tata leads India's EV market with ~60% share. The Nexon and Punch EV are not just products — they're a structural moat as charging infra expands.",
    keyRisk:
      "Debt. ₹1.3 lakh crore consolidated net debt means any demand slowdown in Western markets (JLR's revenue base) hits hard. A UK/US recession is the single biggest risk to this turnaround story.",
    signals: {
      earningsMomentum: "bullish",
      debtTrajectory: "watch",
      marketPosition: "bullish",
      macroExposure: "risk",
      valuation: "cheap",
      promoterPledging: "neutral",
    },
  },
};

// ── TYPES ────────────────────────────────────────────────────────────────────
export interface GeminiStockAnalysis {
  story: string;
  growthEngine: string;
  keyRisk: string;
  signals: {
    earningsMomentum: "bullish" | "watch" | "risk";
    debtTrajectory: "bullish" | "watch" | "risk";
    marketPosition: "bullish" | "watch" | "risk";
    macroExposure: "bullish" | "watch" | "risk";
    valuation: "cheap" | "fair" | "expensive";
    promoterPledging: "bullish" | "neutral" | "risk";
  };
}

export interface StockQueryParams {
  companyName: string;
  ticker: string;
  sector: string;
  metrics: {
    marketCap: string;
    revenue: string;
    netProfit: string;
    peRatio: number;
    debtToEquity: number;
    revenueGrowthYoY: number;
    ebitdaMargin: number;
    promoterHolding: number;
  };
}

// ── GEMINI CLIENT ────────────────────────────────────────────────────────────
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[UperAI] NEXT_PUBLIC_GEMINI_API_KEY not found — using mock responses"
    );
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

// ── CORE FUNCTION: ANALYZE STOCK ─────────────────────────────────────────────
export async function analyzeStock(
  params: StockQueryParams
): Promise<GeminiStockAnalysis> {
  const client = getGeminiClient();

  // Fallback to mock if no API key
  if (!client) {
    return MOCK_RESPONSES[params.ticker.toLowerCase()] ?? MOCK_RESPONSES.default;
  }

  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: UPERAI_SYSTEM_INSTRUCTIONS,
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = buildPrompt(params);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseGeminiResponse(text);
  } catch (error) {
    console.error("[UperAI] Gemini API error:", error);
    return MOCK_RESPONSES.default;
  }
}

// ── SEARCH QUERY (free-form) ─────────────────────────────────────────────────
export async function searchStocks(query: string): Promise<string> {
  const client = getGeminiClient();

  if (!client) {
    return `Showing mock results for: "${query}". Connect your Gemini API key for live analysis.`;
  }

  const model = client.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: UPERAI_SYSTEM_INSTRUCTIONS,
    generationConfig: GENERATION_CONFIG,
  });

  const prompt = `
User query: "${query}"

If this is a stock/company search, identify the company name and NSE ticker.
If this is a screener query (e.g. "zero debt companies"), return the top 5 
Indian companies matching the criteria with a one-line reason each.

Return JSON in this format:
{
  "type": "stock" | "screener",
  "ticker": "TICKERSYMBOL" (for type=stock),
  "results": [{ "name": "", "ticker": "", "reason": "" }] (for type=screener)
}
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("[UperAI] Search error:", error);
    return "{}";
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function buildPrompt(p: StockQueryParams): string {
  return `
Analyze this Indian listed company for a retail investor:

Company: ${p.companyName} (${p.ticker})
Sector: ${p.sector}

Key Financials:
- Market Cap: ${p.metrics.marketCap}
- Revenue (TTM): ${p.metrics.revenue}
- Net Profit: ${p.metrics.netProfit}
- P/E Ratio: ${p.metrics.peRatio}x
- Debt-to-Equity: ${p.metrics.debtToEquity}x
- Revenue Growth YoY: ${p.metrics.revenueGrowthYoY}%
- EBITDA Margin: ${p.metrics.ebitdaMargin}%
- Promoter Holding: ${p.metrics.promoterHolding}%

Write your analysis in exactly 3 sections labeled:
**The Story**
**Growth Engine**  
**Key Risk**

Keep each section to 2-3 sentences. Use Indian numbering (Lakhs/Crores).
End with the disclaimer line.
  `.trim();
}

function parseGeminiResponse(text: string): GeminiStockAnalysis {
  // Extract sections from markdown-style response
  const storyMatch = text.match(/\*\*The Story\*\*\n([\s\S]+?)(?=\*\*|$)/);
  const growthMatch = text.match(/\*\*Growth Engine\*\*\n([\s\S]+?)(?=\*\*|$)/);
  const riskMatch = text.match(/\*\*Key Risk\*\*\n([\s\S]+?)(?=\*\*|$)/);

  return {
    story: storyMatch?.[1]?.trim() ?? text.slice(0, 200),
    growthEngine: growthMatch?.[1]?.trim() ?? "",
    keyRisk: riskMatch?.[1]?.trim() ?? "",
    signals: inferSignals(text),
  };
}

function inferSignals(text: string): GeminiStockAnalysis["signals"] {
  // Simple keyword inference — replace with structured output in production
  const t = text.toLowerCase();
  return {
    earningsMomentum: t.includes("profit") || t.includes("growth") ? "bullish" : "watch",
    debtTrajectory: t.includes("debt") ? "watch" : "bullish",
    marketPosition: t.includes("market share") || t.includes("leader") ? "bullish" : "watch",
    macroExposure: t.includes("global") || t.includes("export") ? "risk" : "watch",
    valuation: t.includes("cheap") || t.includes("undervalued") ? "cheap" : "fair",
    promoterPledging: "neutral",
  };
}
