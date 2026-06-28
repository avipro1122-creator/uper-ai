import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateFallbackReport, transformReportToQ2FY27 } from '../../../lib/fallbackReports';

export const dynamic = 'force-dynamic';

const TICKER_MAPPING = [
  { keywords: ["adani enterprises", "adani enterprise", "adanient", "ael"], symbol: "ADANIENT", name: "Adani Enterprises Ltd" },
  { keywords: ["adani ports", "adani port", "ports & special", "ports", "adaniports"], symbol: "ADANIPORTS", name: "Adani Ports & Special Economic Zone Ltd" },
  { keywords: ["reliance", "ril"], symbol: "RELIANCE", name: "Reliance Industries Limited" },
  { keywords: ["tcs", "tata consultancy", "tata consultancy services"], symbol: "TCS", name: "Tata Consultancy Services limited" },
  { keywords: ["tata power", "tatapower"], symbol: "TATAPOWER", name: "Tata Power Company Ltd." },
  { keywords: ["tata motors", "tatamotors"], symbol: "TATAMOTORS", name: "Tata Motors Ltd." },
  { keywords: ["axis bank", "axisbank", "axis"], symbol: "AXISBANK", name: "Axis Bank Ltd" },
  { keywords: ["hdfc bank", "hdfcbank", "hdfc"], symbol: "HDFCBANK", name: "HDFC Bank Limited" },
  { keywords: ["icici bank", "icicibank", "icici"], symbol: "ICICIBANK", name: "ICICI Bank Ltd" },
  { keywords: ["sbi", "sbin", "state bank of india", "state bank"], symbol: "SBIN", name: "State Bank of India Limited" },
  { keywords: ["infosys", "infy"], symbol: "INFY", name: "Infosys Ltd" },
  { keywords: ["hcl", "hcltech", "hcl technologies"], symbol: "HCLTECH", name: "HCL Technologies Ltd" },
  { keywords: ["maruti", "suzuki", "maruti suzuki"], symbol: "MARUTI", name: "Maruti Suzuki India Ltd" },
  { keywords: ["mahindra", "m&m", "mahindra & mahindra"], symbol: "M&M", name: "Mahindra & Mahindra Ltd" },
  { keywords: ["bajaj auto", "bajajauto"], symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd" },
  { keywords: ["bajaj finance", "bajfinance"], symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" },
  { keywords: ["bajaj finserv", "bajajfinsv"], symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd" },
  { keywords: ["larsen", "l&t", "lt"], symbol: "LT", name: "Larsen & Toubro Ltd" },
  { keywords: ["sun pharma", "sunpharma", "sun pharmaceutical"], symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd" },
  { keywords: ["ultratech", "ultracemco", "ultratech cement"], symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd" },
  { keywords: ["coal india", "coalindia"], symbol: "COALINDIA", name: "Coal India Ltd" },
  { keywords: ["ntpc"], symbol: "NTPC", name: "NTPC Ltd" },
  { keywords: ["nestle", "nestleind"], symbol: "NESTLEIND", name: "Nestle India Ltd" },
  { keywords: ["ongc", "oil & natural gas"], symbol: "ONGC", name: "Oil & Natural Gas Corpn Ltd" },
  { keywords: ["jsw steel", "jswsteel"], symbol: "JSWSTEEL", name: "JSW Steel Ltd" },
  { keywords: ["kotak", "kotak bank", "kotak mahindra"], symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd" },
  { keywords: ["bel", "bharat electronics"], symbol: "BEL", name: "Bharat Electronics Ltd" },
  { keywords: ["airtel", "bharti airtel", "bhartiartl"], symbol: "BHARTIARTL", name: "Bharti Airtel Limited" },
  { keywords: ["hindunilvr", "hindustan unilever", "hul", "hind uilever"], symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" },
  { keywords: ["titan"], symbol: "TITAN", name: "Titan Company Ltd" }
];

function findMatchedTickers(message: string): { symbol: string, name: string }[] {
  const msg = message.toLowerCase();
  const matched: { symbol: string, name: string }[] = [];
  
  for (const item of TICKER_MAPPING) {
    if (item.keywords.some(kw => msg.includes(kw) || msg === kw)) {
      if (!matched.some(m => m.symbol === item.symbol)) {
        matched.push({ symbol: item.symbol, name: item.name });
      }
    }
  }
  
  return matched;
}

function getCompanyData(symbol: string, name: string) {
  const cleanSymbol = symbol.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  
  // 1. Try reading from concalls.json
  const dbPath = path.join(process.cwd(), 'concalls.json');
  if (fs.existsSync(dbPath)) {
    try {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (db[cleanSymbol]) {
        const quarters = Object.keys(db[cleanSymbol]);
        if (quarters.length > 0) {
          // Sort quarters to get the latest
          const sorted = quarters.sort((a, b) => {
            const aParts = a.split('_');
            const bParts = b.split('_');
            const aYr = aParts[1] || '';
            const bYr = bParts[1] || '';
            if (aYr !== bYr) return bYr.localeCompare(aYr);
            return (bParts[0] || '').localeCompare(aParts[0] || '');
          });
          return transformReportToQ2FY27(db[cleanSymbol][sorted[0]]);
        }
      }
    } catch (e) {
      console.error('Error reading concalls.json in chat route:', e);
    }
  }
  
  // 2. Return fallback report
  return transformReportToQ2FY27(generateFallbackReport(cleanSymbol, name));
}

export async function POST(request: Request) {
  let matchedCompanies: { symbol: string, name: string }[] = [];
  let isConversational = false;
  let message = "";

  try {
    const payload = await request.json();
    message = payload.message || '';
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Bad Request. Missing or empty "message" payload.' },
        { status: 400 }
      );
    }

    const cleanMsg = message.trim().toLowerCase();
    matchedCompanies = findMatchedTickers(message);
    
    // Check if the query seems conversational or a comparison
    isConversational = cleanMsg.split(/\s+/).length > 3 || 
                       cleanMsg.includes('better') || 
                       cleanMsg.includes('than') || 
                       cleanMsg.includes('why') || 
                       cleanMsg.includes('how') || 
                       cleanMsg.includes('compare') || 
                       cleanMsg.includes('what');

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey.startsWith('your_')) {
      throw new Error('Gemini API key is not configured on the server.');
    }

    // Ground prompt with real parsed PDF / fallback data context
    let contextStr = "";
    if (matchedCompanies.length > 0) {
      contextStr = "\n\nYou have access to the following verified corporate earnings call summaries. Use this exact information as your primary reference and ground truth:\n";
      for (const comp of matchedCompanies) {
        const compData = getCompanyData(comp.symbol, comp.name);
        contextStr += `\n--- START OF DATA FOR ${comp.name} (${comp.symbol}) ---\n`;
        contextStr += JSON.stringify(compData, null, 2);
        contextStr += `\n--- END OF DATA FOR ${comp.name} (${comp.symbol}) ---\n`;
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    let prompt = "";
    if (isConversational) {
      prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities.
Answer the following query clearly, analytically, and concisely using professional markdown styling. Focus on business models, numbers, and first-principles comparisons.
${contextStr}
Query: "${message}"`;
    } else {
      prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities.
Provide a high-fidelity structured analysis for the query: "${message}".
${contextStr}
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
    {"title": "Executive Summary", "content": "Detailed bulleted highlights of the executive summary and core high-level takeaways using •."},
    {"title": "Management Commentary", "content": "Detailed bulleted highlights of business updates, capacity expansion, demand trends, and pricing/costs using •."},
    {"title": "Future Guidance", "content": "Detailed bulleted highlights of growth outlook, revenue/margin guidance, capex plans, and highlighted execution risks using •."}
  ]
}

CRITICAL RULES:
1. Return ONLY the raw JSON object starting with '{' and ending with '}'.
2. Provide at least 3-5 chart points in chartData with numerical values for Y-axis (revenue parameter).
3. Output MUST be extremely crisp, professional, and knowledgeable.`;
    }

    let responseText = "";
    if (geminiApiKey.startsWith('sk-')) {
      const isDeepSeek = geminiApiKey.length === 35;
      const apiEndpoint = isDeepSeek 
        ? 'https://api.deepseek.com/chat/completions' 
        : 'https://api.openai.com/v1/chat/completions';
      const modelName = isDeepSeek 
        ? 'deepseek-chat' 
        : 'gpt-4o-mini';

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiApiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        const providerName = isDeepSeek ? 'DeepSeek' : 'OpenAI';
        throw new Error(`${providerName} API returned status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
    } else {
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
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (isConversational) {
      return NextResponse.json({ success: true, type: 'text', text: responseText });
    } else {
      try {
        const cleanText = responseText.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleanText);
        return NextResponse.json({ success: true, type: 'json', data: parsed });
      } catch (e) {
        return NextResponse.json({ success: true, type: 'text', text: responseText });
      }
    }

  } catch (err: any) {
    console.error('Chat API execution failed, checking local fallback:', err);
    
    // Check if we can generate a local fallback response for matched companies
    if (matchedCompanies.length > 0) {
      try {
        const cleanMsg = message.trim().toLowerCase();
        const isComparison = cleanMsg.includes('compare') || cleanMsg.includes('versus') || cleanMsg.includes('vs') || matchedCompanies.length > 1;
        
        if (isComparison) {
          const comp1 = matchedCompanies[0];
          const comp2 = matchedCompanies[1] || matchedCompanies[0];
          const data1 = getCompanyData(comp1.symbol, comp1.name);
          const data2 = getCompanyData(comp2.symbol, comp2.name);
          
          if (isConversational) {
            const comparisonText = `### Analyst Comparison: ${comp1.name} vs ${comp2.name}
Generated in offline fallback mode.

| Metric | ${comp1.symbol} (${data1.quarter} ${data1.financialYear}) | ${comp2.symbol} (${data2.quarter} ${data2.financialYear}) |
| :--- | :--- | :--- |
| **Revenue** | ${data1.quarterlyPerformance.revenue} | ${data2.quarterlyPerformance.revenue} |
| **EBITDA** | ${data1.quarterlyPerformance.ebitda} | ${data2.quarterlyPerformance.ebitda} |
| **Margins** | ${data1.quarterlyPerformance.margins} | ${data2.quarterlyPerformance.margins} |
| **PAT** | ${data1.quarterlyPerformance.pat} | ${data2.quarterlyPerformance.pat} |
| **Debt / Cash** | Debt: ${data1.keyNumbers.debt} / Cash: ${data1.keyNumbers.cash} | Debt: ${data2.keyNumbers.debt} / Cash: ${data2.keyNumbers.cash} |
| **AI Sentiment** | Score: ${data1.aiSentiment.score} (${data1.aiSentiment.classification}) | Score: ${data2.aiSentiment.score} (${data2.aiSentiment.classification}) |

#### Executive Summary:
* **${comp1.symbol}**: ${data1.executiveSummary.bullets[0]}
* **${comp2.symbol}**: ${data2.executiveSummary.bullets[0]}

#### Management Commentary:
* **${comp1.symbol}**: ${data1.managementCommentary.businessUpdates[0]}
* **${comp2.symbol}**: ${data2.managementCommentary.businessUpdates[0]}

#### Future Guidance:
* **${comp1.symbol}**: ${data1.futureGuidance.growthOutlook}
* **${comp2.symbol}**: ${data2.futureGuidance.growthOutlook}
`;
            return NextResponse.json({ success: true, type: 'text', text: comparisonText });
          } else {
            const comparisonJson = {
              summary: `Comparative review of **${comp1.name}** and **${comp2.name}**. Both companies exhibit strong positions, with ${comp1.symbol} showing a sentiment score of **${data1.aiSentiment.score}** and ${comp2.symbol} showing **${data2.aiSentiment.score}**.`,
              sources: ["Earnings Call Transcripts", "UperAI Local Analysis"],
              metrics: [
                { label: `${comp1.symbol} Rev`, value: data1.keyNumbers.revenue, change: `PAT: ${data1.keyNumbers.pat}` },
                { label: `${comp2.symbol} Rev`, value: data2.keyNumbers.revenue, change: `PAT: ${data2.keyNumbers.pat}` },
                { label: `${comp1.symbol} Margin`, value: data1.keyNumbers.roe || "N/A", change: data1.aiSentiment.classification },
                { label: `${comp2.symbol} Margin`, value: data2.keyNumbers.roe || "N/A", change: data2.aiSentiment.classification }
              ],
              chartTitle: "Return on Equity comparison (%)",
              chartData: [
                { label: `${comp1.symbol}`, revenue: Math.round(parseFloat(data1.keyNumbers.roe) || 15) },
                { label: `${comp2.symbol}`, revenue: Math.round(parseFloat(data2.keyNumbers.roe) || 15) }
              ],
              tableData: [
                { name: data1.companyName, ticker: data1.symbol, pe: data1.keyNumbers.eps, peg: data1.keyNumbers.roe, roe: data1.keyNumbers.roce, ebitda: data1.keyNumbers.ebitda },
                { name: data2.companyName, ticker: data2.symbol, pe: data2.keyNumbers.eps, peg: data2.keyNumbers.roe, roe: data2.keyNumbers.roce, ebitda: data2.keyNumbers.ebitda }
              ],
              sections: [
                {
                  title: "Executive Summary",
                  content: `**${comp1.symbol}**:\n${data1.executiveSummary.bullets.map((b: string) => `• ${b}`).join('\n')}\n\n**${comp2.symbol}**:\n${data2.executiveSummary.bullets.map((b: string) => `• ${b}`).join('\n')}`
                },
                {
                  title: "Management Commentary",
                  content: `**${comp1.symbol}**:\n${data1.managementCommentary.businessUpdates.map((b: string) => `• ${b}`).join('\n')}\n\n**${comp2.symbol}**:\n${data2.managementCommentary.businessUpdates.map((b: string) => `• ${b}`).join('\n')}`
                },
                {
                  title: "Future Guidance",
                  content: `**${comp1.symbol}**:\n• Growth: ${data1.futureGuidance.growthOutlook}\n• Capex: ${data1.futureGuidance.capexPlans}\n\n**${comp2.symbol}**:\n• Growth: ${data2.futureGuidance.growthOutlook}\n• Capex: ${data2.futureGuidance.capexPlans}`
                }
              ]
            };
            return NextResponse.json({ success: true, type: 'json', data: comparisonJson });
          }
        } else {
          const comp = matchedCompanies[0];
          const data = getCompanyData(comp.symbol, comp.name);
          
          if (isConversational) {
            const reportText = `### Research Note: ${data.companyName} (${data.symbol})
Generated in offline fallback mode.

**Quarter**: ${data.quarter} ${data.financialYear} | **Date**: ${data.date}

#### Executive Summary:
${data.executiveSummary.bullets.map((b: string) => `* ${b}`).join('\n')}

#### Management Commentary:
* **Business Updates**: ${data.managementCommentary.businessUpdates?.[0] || 'Ongoing operations'}
* **Pricing & Costs**: ${data.managementCommentary.pricing?.[0] || 'Stable pricing'}

#### Future Guidance:
* **Revenue Guidance**: ${data.futureGuidance.revenueGuidance}
* **Margin Guidance**: ${data.futureGuidance.marginGuidance}
* **Capex Plans**: ${data.futureGuidance.capexPlans}
* **Outlook**: ${data.futureGuidance.growthOutlook}
`;
            return NextResponse.json({ success: true, type: 'text', text: reportText });
          } else {
            const reportJson = {
              summary: `Earnings review for **${data.companyName} (${data.symbol})** for **${data.quarter} ${data.financialYear}**. The company has completed key milestones with solid volume traction. Sentiment is categorized as **${data.aiSentiment.classification}** (Score: **${data.aiSentiment.score}**).`,
              sources: ["Earnings Call Transcript", "UperAI Local Analysis"],
              metrics: [
                { label: "Revenue", value: data.keyNumbers.revenue, change: data.quarterlyPerformance.revenue.includes('+') ? data.quarterlyPerformance.revenue.substring(data.quarterlyPerformance.revenue.indexOf('+')) : "YoY" },
                { label: "EBITDA", value: data.keyNumbers.ebitda, change: data.quarterlyPerformance.ebitda.includes('margin') ? data.quarterlyPerformance.ebitda.substring(data.quarterlyPerformance.ebitda.indexOf('margin')) : "EBITDA" },
                { label: "PAT", value: data.keyNumbers.pat, change: "Net Profit" },
                { label: "AI Sentiment", value: `${data.aiSentiment.score}/100`, change: data.aiSentiment.classification }
              ],
              chartTitle: `${data.symbol} Key Metrics Profile`,
              chartData: [
                { label: "ROE", revenue: Math.round(parseFloat(data.keyNumbers.roe) || 12) },
                { label: "ROCE", revenue: Math.round(parseFloat(data.keyNumbers.roce) || 14) },
                { label: "Volume Growth", revenue: Math.round(parseFloat(data.keyNumbers.volumeGrowth) || 8) }
              ],
              sections: [
                {
                  title: "Executive Summary",
                  content: data.executiveSummary.bullets.map((b: string) => `• ${b}`).join('\n')
                },
                {
                  title: "Management Commentary",
                  content: `• Business Updates:\n${data.managementCommentary.businessUpdates.map((b: string) => `  - ${b}`).join('\n')}\n\n• Capacity Expansion:\n${data.managementCommentary.capacityExpansion.map((b: string) => `  - ${b}`).join('\n')}\n\n• Pricing & Costs:\n${data.managementCommentary.pricing.map((b: string) => `  - ${b}`).join('\n')}`
                },
                {
                  title: "Future Guidance",
                  content: `• Growth Outlook: ${data.futureGuidance.growthOutlook}\n• Revenue Guidance: ${data.futureGuidance.revenueGuidance}\n• Margin Guidance: ${data.futureGuidance.marginGuidance}\n• Capex Plans: ${data.futureGuidance.capexPlans}\n• Risks:\n${data.futureGuidance.risksHighlighted.map((r: string) => `  - ${r}`).join('\n')}`
                }
              ]
            };
            return NextResponse.json({ success: true, type: 'json', data: reportJson });
          }
        }
      } catch (localErr: any) {
        console.error('Failed to construct local analysis fallback:', localErr);
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate chat response', details: err.message },
      { status: 500 }
    );
  }
}
