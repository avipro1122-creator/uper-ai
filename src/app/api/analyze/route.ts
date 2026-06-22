import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Strict system instruction as defined in the requirements
const SYSTEM_INSTRUCTION = `You are the UperAI Core Intelligence. Do not act like a generic chatbot. You are a First-Principles business analyst for the Indian Stock Market (NSE/BSE). When a user searches a stock, DO NOT just list P/E ratios. Break the company down into three strict bullet points:
1. How they actually make money (The Engine).
2. Why they are growing (The Catalyst).
3. The current market hype vs reality (The FOMO Risk).
Use plain English. Never give Buy/Sell advice.`;

// Pre-defined premium fallback narratives for testing and when API key is missing
const MOCK_NARRATIVES: Record<string, { engine: string; catalyst: string; fomo: string }> = {
  reliance: {
    engine: "Reliance is a giant refining and energy conglomerate that has successfully transitioned to retail and digital connectivity. It uses the massive, consistent cash flows from its petrochemicals and refining divisions to fund high-growth expansions in Jio (telecom) and Reliance Retail.",
    catalyst: "The catalyst is double-fold: the impending IPO listing of Jio and Retail to unlock shareholder value, combined with tariff hikes in telecom and a rapid scaling of green hydrogen/solar gigafactories in Jamnagar.",
    fomo: "Hype: It's seen as a high-tech platform monopoly. Reality: It is still highly capital-intensive, carrying substantial consolidated debt, and refinery margins remain cyclical and sensitive to global oil pricing."
  },
  hdfc: {
    engine: "HDFC Bank makes money through the classic retail banking spread—gathering low-cost deposits (CASA) from millions of Indian savers and lending it out as mortgages, personal, and corporate loans at higher interest rates.",
    catalyst: "The core growth catalyst is the massive cross-selling opportunity post-merger with HDFC Ltd, allowing the bank to offer mortgages directly to its existing base of over 80 million deposit accounts.",
    fomo: "Hype: Regarded as the safest compounding bank in India. Reality: Post-merger liquidity requirements and high deposit competition are putting heavy pressure on net interest margins, forcing slower near-term growth than historical averages."
  },
  tata: {
    engine: "Tata Motors is a global automotive major making money via luxury vehicles (Jaguar Land Rover - JLR), domestic commercial vehicles (trucks/buses), and dominant electric/ICE passenger cars in India.",
    catalyst: "The catalyst is the clean separation of their commercial and passenger vehicle divisions into two independent listed entities, alongside JLR's shift to high-margin Defender/Range Rover sales and domestic EV leadership.",
    fomo: "Hype: The undisputed king of Indian EVs. Reality: Passenger EV adoption is slowing down globally, domestic competitor entries are intensifying, and JLR remains exposed to global luxury consumer discretionary spending cycles."
  },
  infosys: {
    engine: "Infosys makes money by selling high-margin IT consulting, enterprise software integration, and application maintenance services to Fortune 500 companies, operating on a low-cost Indian delivery model.",
    catalyst: "The catalyst is the large-scale consolidation of enterprise IT budgets into multi-year cost-optimization contracts, alongside an expansion of custom generative AI implementation deals.",
    fomo: "Hype: Riding the global wave of generative AI and digital transformation. Reality: Clients are delaying discretionary spending, and legacy maintenance revenues are facing deflationary pressure from AI automation."
  }
};

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Valid stock query is required' }, { status: 400 });
    }

    const cleanQuery = query.trim();
    const lowerQuery = cleanQuery.toLowerCase();
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if we have a matching local mock stock first, or if the API key is not present
    const isMockAvailable = Object.keys(MOCK_NARRATIVES).some(key => lowerQuery.includes(key));
    
    if (!apiKey) {
      console.log('GEMINI_API_KEY is not defined. Using high-fidelity mock fallback.');
      
      // Look for match in query
      let matchedKey = Object.keys(MOCK_NARRATIVES).find(key => lowerQuery.includes(key));
      if (!matchedKey) {
        // Find best match or generate dynamic mock
        matchedKey = 'reliance'; // default
      }
      
      const narrative = MOCK_NARRATIVES[matchedKey!];
      
      // Simulate slight network delay for premium terminal feel
      await new Promise(resolve => setTimeout(resolve, 2000));

      return NextResponse.json({
        stock: cleanQuery.toUpperCase(),
        engine: narrative.engine,
        catalyst: narrative.catalyst,
        fomo: narrative.fomo,
        provider: 'UperAI Local Intelligence (API Key Offline)'
      });
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash as the fast narrative translator
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2, // Keep it focused and analytical
      }
    });

    const prompt = `Perform a first-principles business analysis for: "${cleanQuery}". Output the response as a valid JSON object with exactly three string fields: "engine", "catalyst", and "fomo". The values must follow the strict rules of explaining: 1. How they actually make money (The Engine). 2. Why they are growing (The Catalyst). 3. The current market hype vs reality (The FOMO Risk). Do not include formatting other than a clean JSON response.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean potential markdown blocks
    const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanJsonText);
      return NextResponse.json({
        stock: cleanQuery.toUpperCase(),
        engine: parsed.engine || 'Failed to resolve Engine narrative.',
        catalyst: parsed.catalyst || 'Failed to resolve Catalyst narrative.',
        fomo: parsed.fomo || 'Failed to resolve FOMO Risk narrative.',
        provider: 'UperAI Core Intelligence v1.5'
      });
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response. Plaintext fallback active:', responseText);
      
      // Fallback: If JSON parsing failed, parse the points via split
      // We'll also just parse it or format it
      return NextResponse.json({
        stock: cleanQuery.toUpperCase(),
        engine: "Analyzed: How they actually make money (Engine). " + responseText.substring(0, 300) + "...",
        catalyst: "Catalyst: Drivers of business growth.",
        fomo: "FOMO Risk: Narrative vs underlying cash flows.",
        provider: 'UperAI Core Intelligence (Text Fallback)'
      });
    }

  } catch (error: any) {
    console.error('API Error in analyze route:', error);
    return NextResponse.json({
      error: 'Analysis failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
