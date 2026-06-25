import { NextResponse } from 'next/server';
import { generateFallbackReport } from '../../../../lib/fallbackReports';

export const dynamic = 'force-dynamic';

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper to clean JSON string from Gemini markdown blocks
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

  if (!symbol) {
    return NextResponse.json(
      { error: 'Bad Request. Missing "symbol" parameter.' },
      { status: 400 }
    );
  }

  // 1. Check Cache
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ success: true, cached: true, data: cached.data });
  }

  const indianApiKey = process.env.INDIAN_API_KEY || 'YOUR_NEW_API_KEY';
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  let transcriptData = null;
  let apiFetched = false;

  // 2. Fetch from IndianAPI.in Concalls endpoint if key is provided and not placeholder
  if (indianApiKey && indianApiKey !== 'YOUR_NEW_API_KEY') {
    try {
      const concallUrl = `https://analyst.indianapi.in/concalls?stock_name=${encodeURIComponent(symbol)}`;
      const res = await fetch(concallUrl, {
        headers: {
          'X-API-Key': indianApiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // If data is array and has items, get the latest one
        if (Array.isArray(data) && data.length > 0) {
          transcriptData = data[0];
          apiFetched = true;
        } else if (data && !Array.isArray(data)) {
          transcriptData = data;
          apiFetched = true;
        }
      } else {
        console.warn(`IndianAPI.in concalls returned status ${res.status}`);
      }
    } catch (e) {
      console.error('Error fetching from IndianAPI.in:', e);
    }
  }

  // 3. Prepare Gemini Prompt for Analysis
  const systemPrompt = `You are a Senior Equity Research Analyst specializing in the Indian stock market (NSE/BSE).
Deconstruct the conference call transcript for ${companyName} (${symbol}) into a highly professional, institutional-grade equity research analysis.
You must return a valid JSON object matching the requested schema. Ensure the tone is analytical, objective, and dense with financial insight.`;

  const userPrompt = `
Analyze the latest quarterly earnings conference call for ${companyName} (${symbol}).
${transcriptData ? `Here is the transcript/data fetched from our exchange feed: ${JSON.stringify(transcriptData)}` : 'No transcript text was found in the feed. Please use your extensive real-time knowledge of the Indian stock market (including recent quarterly results, capacity expansions, sector tailwinds, margins, and management statements for this company) to generate a realistic and highly accurate analysis.'}

Format the output strictly as a JSON object (do not include markdown formatting, backticks, or "json" tags). The JSON must have the following keys:

{
  "companyName": "${companyName}",
  "symbol": "${symbol}",
  "quarter": "Q4",
  "financialYear": "FY25",
  "date": "June 2025",
  "executiveSummary": {
    "bullets": [
      "8 to 10 dense bullet points explaining the core results, business pivots, operational drivers, and strategic direction.",
      "Bullet 2...",
      "Bullet 3..."
    ],
    "overallSentiment": "Detailed paragraph analyzing the overall management tone and market positioning."
  },
  "quarterlyPerformance": {
    "revenue": "Revenue figures with YoY/QoQ growth (e.g. ₹25,482 Cr, +6.8% YoY)",
    "ebitda": "EBITDA figures and margin performance (e.g. ₹4,251 Cr, margin at 16.7%)",
    "pat": "Profit After Tax and EPS growth details",
    "margins": "Gross margin and operating margin trends",
    "volumeGrowth": "Volume growth metrics (e.g. +4.5% volume growth led by domestic demand)",
    "segmentPerformance": "Detailed breakdown of key business segments and their contributions"
  },
  "managementCommentary": {
    "businessUpdates": ["Update 1", "Update 2", "Update 3"],
    "capacityExpansion": ["Expansion plans and timelines"],
    "newProducts": ["New product launches or R&D pipelines"],
    "demandTrends": ["Current demand outlook across regions"],
    "pricing": ["Pricing power and pricing revisions"],
    "costPressures": ["Cost inflation, raw materials, or employee costs"]
  },
  "futureGuidance": {
    "revenueGuidance": "Expected top-line growth rate or targets",
    "marginGuidance": "Expected margin trajectory",
    "capexPlans": "Planned capital expenditure outlay for the coming quarters",
    "growthOutlook": "Mid to long-term market opportunities",
    "risksHighlighted": ["Risk 1", "Risk 2"]
  },
  "analystQA": {
    "questionsAndAnswers": [
      {
        "question": "Analyst question 1 (e.g., from Kotak Securities regarding capex efficiency)",
        "answer": "Detailed management answer 1"
      },
      // Include exactly 10 realistic, high-quality analyst questions and answers
    ],
    "unansweredConcerns": [
      "Concern 1",
      "Concern 2"
    ]
  },
  "bullishSignals": [
    "Signal 1",
    "Signal 2"
  ],
  "bearishSignals": [
    "Signal 1",
    "Signal 2"
  ],
  "redFlags": {
    "weakGuidance": "Analysis of any soft guidance",
    "decliningMargins": "Analysis of margin pressure points",
    "demandSlowdown": "Analysis of slow product lines",
    "customerConcentration": "Customer risk or segment dependencies",
    "regulatoryRisks": "SEBI, RBI, tariff, or environmental regulations",
    "debtConcerns": "Debt-to-equity and interest coverage risk",
    "governanceConcerns": "Promoter pledges, audits, or board revisions"
  },
  "aiSentiment": {
    "score": 78, 
    "classification": "Bullish" // Choose from: Very Bullish, Bullish, Neutral, Bearish, Very Bearish
  },
  "keyNumbers": {
    "revenue": "₹25,482 Cr",
    "ebitda": "₹4,251 Cr",
    "pat": "₹1,987 Cr",
    "eps": "₹24.50",
    "roce": "14.2%",
    "roe": "12.8%",
    "debt": "₹12,400 Cr",
    "cash": "₹3,150 Cr",
    "capex": "₹4,500 Cr",
    "orderBook": "₹15,400 Cr",
    "volumeGrowth": "4.5%"
  },
  "comparePrevious": {
    "improvements": ["Improvement 1", "Improvement 2"],
    "deterioration": ["Deterioration 1", "Deterioration 2"],
    "newDevelopments": ["Development 1", "Development 2"]
  },
  "investmentThesis": {
    "bullCase": ["Why investors may like this company 1", "Why investors may like this company 2"],
    "bearCase": ["Why investors should be cautious 1", "Why investors should be cautious 2"],
    "longTermOutlook": "Detailed paragraph explaining the 3-5 year growth thesis."
  },
  "importantQuotes": [
    "\"Meaningful quote 1 from the CEO/CFO\"",
    "\"Meaningful quote 2...\""
  ],
  "aiGeneratedRisks": [
    "Risk prediction 1 based on macro variables",
    "Risk prediction 2..."
  ],
  "keywords": [
    "Banking", "Pharma" // Generate 3-5 relevant sector tags (e.g. Railways, Defence, Consumer, IT, Auto, etc.)
  ]
}

CRITICAL: Return ONLY the JSON object. Do not add any conversational text before or after the JSON structure.
`;

  // 4. Try calling Gemini API
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          const cleanedText = cleanJsonString(text);
          const parsedData = JSON.parse(cleanedText);
          
          // Cache and return
          cache.set(symbol, { data: parsedData, timestamp: Date.now() });
          return NextResponse.json({ success: true, cached: false, data: parsedData });
        }
      } else {
        console.warn(`Gemini API error status ${response.status}`);
      }
    } catch (err) {
      console.error('Gemini API call failed, falling back to local generator:', err);
    }
  }

  // 5. Fallback Report Generation (if Gemini fails or is not configured)
  console.log(`Generating fallback report for ${symbol}...`);
  const fallbackReport = generateFallbackReport(symbol, companyName);
  cache.set(symbol, { data: fallbackReport, timestamp: Date.now() });
  
  return NextResponse.json({
    success: true,
    cached: false,
    data: fallbackReport,
    fallback: true
  });
}
