import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request. Missing or empty "message" payload.' },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey.startsWith('your_')) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured on the server.' },
        { status: 500 }
      );
    }

    const cleanMsg = message.trim().toLowerCase();
    
    // Check if the query seems conversational or a comparison (more than 3 words, or contains question words/indicators)
    const isConversational = cleanMsg.split(/\s+/).length > 3 || 
                             cleanMsg.includes('better') || 
                             cleanMsg.includes('than') || 
                             cleanMsg.includes('why') || 
                             cleanMsg.includes('how') || 
                             cleanMsg.includes('compare') || 
                             cleanMsg.includes('what');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    let prompt = "";
    if (isConversational) {
      prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities.
Answer the following query clearly, analytically, and concisely using professional markdown styling. Focus on business models, numbers, and first-principles comparisons.
Query: "${message}"`;
    } else {
      prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities.
Provide a high-fidelity structured analysis for the query: "${message}".
Return ONLY a valid JSON object (do not include markdown code block formatting like \`\`\`json, do not include any backticks or leading/trailing text) with the following schema:
{
  "summary": "Highly knowledgeable, crisp analytical summary under 75 words. Use bold terms for key metrics.",
  "sources": ["List of 2-3 realistic sources, e.g. Q4 Concall Transcript, SEBI Disclosures"],
  "metrics": [
    {"label": "Metric Name", "value": "Metric Value", "change": "Change/Status (e.g. +1.5%, Low Debt, or N/A)"}
  ],
  "chartTitle": "Title for the chart representing trend",
  "chartData": [
    {"label": "Point Label (e.g. Q1, Q2 or Week 1)", "revenue": 100}
  ],
  "sections": [
    {"title": "Section Title (e.g. Management Guidance, Capex & Margins, Concall Key Takeaways)", "content": "Bulleted takeaways using •, outlining guidance percentages, operational constraints, and clear management comments."}
  ]
}

CRITICAL RULES:
1. Return ONLY the raw JSON object starting with '{' and ending with '}'.
2. Provide at least 3-5 chart points in chartData with numerical values for Y-axis (revenue parameter).
3. Output MUST be extremely crisp, professional, and knowledgeable.`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (isConversational) {
      return NextResponse.json({ success: true, type: 'text', text: responseText });
    } else {
      try {
        const cleanText = responseText.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleanText);
        return NextResponse.json({ success: true, type: 'json', data: parsed });
      } catch (e) {
        // Fallback to text if JSON parsing fails
        return NextResponse.json({ success: true, type: 'text', text: responseText });
      }
    }

  } catch (err: any) {
    console.error('Chat API execution failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate chat response', details: err.message },
      { status: 500 }
    );
  }
}
