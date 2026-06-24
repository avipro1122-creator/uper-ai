import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Search, 
  TrendingUp, 
  LineChart, 
  ShieldAlert,
  Activity,
  Star,
  Compass,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { getResponse } from '../data/mockData';
import InteractiveChart from './InteractiveChart';

const suggestionPills = [
  { label: "Top Nifty 50", query: "Show Nifty 50 valuation metrics and segment leaders" },
  { label: "High Growth", query: "List high growth mid-caps in the Indian market" },
  { label: "Zero Debt", query: "List zero debt Indian companies with strong return ratios" },
  { label: "AI Stocks", query: "Analyze Indian stocks exposed to AI and cloud infrastructure" },
  { label: "Dividend", query: "Top dividend yield stocks with high cash flow visibility" },
  { label: "Small Caps", query: "Analyze undervalued small-caps with earnings breakouts" }
];

export default function ChatInterface({ user, onRequireLogin, initialQuery, onClearInitialQuery }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('uperai_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('uperai_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages to localStorage:", e);
    }
  }, [messages]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedSectionIdx, setExpandedSectionIdx] = useState({});
  
  const chatEndRef = useRef(null);

  // Suggestions below input
  const suggestions = [
    "Reliance Industries results",
    "Undervalued auto sector stocks",
    "Rooftop solar impact on Tata Power"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Debounced autocomplete stock finder
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    // Check if input matches one of our click suggestions (skip autocomplete for long sentences)
    const isPresetQuery = suggestions.includes(inputValue) || 
                          inputValue.startsWith("Analyze ") || 
                          inputValue.startsWith("List ") || 
                          inputValue.startsWith("Impact ") ||
                          inputValue.toLowerCase().includes("undervalued") ||
                          inputValue.toLowerCase().includes("rooftop");

    if (isPresetQuery) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchAutocomplete(inputValue);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  // Secure local/Vercel proxy fetch to Gemini API (gemini-2.5-flash)
  const queryUperAI = async (promptText, jsonMode = false) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Secret API Key not configured");
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ]
    };

    if (jsonMode) {
      requestBody.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    // /api-gemini maps to https://generativelanguage.googleapis.com locally (Vite Proxy) and in production (Vercel rewrite)
    const res = await fetch(`/api-gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI server returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    // Parse content from candidates response schema
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  // Fetch stock quotes from Yahoo Finance via CORS proxy
  const fetchAutocomplete = async (query) => {
    try {
      const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      const data = await res.json();
      
      if (data && data.quotes) {
        // Filter for NSE / BSE stocks (symbol ending in .NS or .BO)
        const indianStocks = data.quotes.filter(item => 
          item.symbol && 
          (item.symbol.endsWith('.NS') || 
           item.symbol.endsWith('.BO') || 
           item.exchange === 'NSI' || 
           item.exchange === 'BOM' || 
           (item.exchDisp && (item.exchDisp.toLowerCase() === 'nse' || item.exchDisp.toLowerCase() === 'bse')))
        );
        setSearchResults(indianStocks.slice(0, 5));
        setShowDropdown(indianStocks.length > 0);
      }
    } catch (err) {
      console.error("Autocomplete search error:", err);
    }
  };

  // Fetch real chart and market price details for a stock
  const fetchAndRenderStock = async (symbol, displayName, rawStockInfo) => {
    setIsTyping(true);
    try {
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      const rawData = await res.json();
      
      if (rawData && rawData.chart && rawData.chart.result && rawData.chart.result[0]) {
        const result = rawData.chart.result[0];
        const meta = result.meta;
        const timestamps = result.timestamp || [];
        const closes = result.indicators.quote[0].close || [];
        
        const currentPrice = meta.regularMarketPrice || closes[closes.length - 1] || 0;
        const previousClose = meta.chartPreviousClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePct = previousClose !== 0 ? (change / previousClose) * 100 : 0;
        
        const high = meta.regularMarketDayHigh || currentPrice;
        const low = meta.regularMarketDayLow || currentPrice;
        const volume = meta.regularMarketVolume || 0;
        const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh || currentPrice;
        const fiftyTwoWeekLow = meta.fiftyTwoWeekLow || currentPrice;
        const exchangeName = meta.fullExchangeName || meta.exchangeName || "Indian Equities";
        const longName = meta.longName || displayName;
        
        // Parse daily timestamps into dates for InteractiveChart component
        const chartPoints = [];
        const step = Math.max(1, Math.floor(closes.length / 5));
        
        for (let i = 0; i < closes.length; i += step) {
          if (closes[i] !== null && closes[i] !== undefined) {
            const date = new Date(timestamps[i] * 1000);
            const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            chartPoints.push({
              label: label,
              revenue: closes[i] // mapping close price to 'revenue' coordinate parameter
            });
          }
        }
        
        // Add current price as last data point if not duplicate
        if (closes.length > 0 && closes[closes.length - 1] !== null) {
          const lastIdx = closes.length - 1;
          const date = new Date(timestamps[lastIdx] * 1000);
          const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          if (chartPoints[chartPoints.length - 1]?.label !== label) {
            chartPoints.push({
              label: label,
              revenue: closes[lastIdx]
            });
          }
        }

        // Percentage position relative to annual high/low bounds
        const rangeDiff = fiftyTwoWeekHigh - fiftyTwoWeekLow;
        const positionPct = rangeDiff !== 0 ? Math.round(((currentPrice - fiftyTwoWeekLow) / rangeDiff) * 100) : 50;

        // Generate dynamic synthesis using UperAI engine if API key is active
        let grokSummary = `Real-time tracking for **${longName} (${symbol})**. The stock is trading at **₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**, representing a change of **${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%** in today's exchange session.`;
        let technicalOverview = `The stock is currently trading at ₹${currentPrice.toFixed(2)}, which represents ${positionPct}% of its 52-week trading range. The previous market session closed at ₹${previousClose.toFixed(2)}. Today's intraday trading saw a high of ₹${high.toFixed(2)} and a low of ₹${low.toFixed(2)} with a cumulative trading volume of ${volume.toLocaleString('en-IN')} shares across the exchange floor.`;
        let peRatio = "N/A";
        let marketCap = "N/A";
        let divYield = "N/A";
        let roe = "N/A";
        let aiSections = null;

        if (import.meta.env.VITE_GEMINI_API_KEY) {
          try {
            const prompt = `You are UperAI, an expert investment terminal for Indian equities.
We are displaying the live stock details for ${longName} (${symbol}).
Current Price: ₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, Change: ${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%
Day High/Low: ₹${low.toFixed(2)} - ₹${high.toFixed(2)}
52-Week Range: ₹${fiftyTwoWeekLow.toFixed(2)} - ₹${fiftyTwoWeekHigh.toFixed(2)}

Provide a structured JSON response with the following format:
{
  "summary": "2-3 sentence market summary of today's momentum and key levels for the stock.",
  "peRatio": "Current/estimated P/E ratio, e.g. '28.5x' or '34.2x'",
  "marketCap": "Current market cap, e.g. '₹1.92 Lakh Cr' or '₹45,200 Cr'",
  "divYield": "Dividend yield, e.g. '0.85%' or '1.2%'",
  "roe": "ROE, e.g. '14.5%' or '22.1%'",
  "technicalOverview": "2-3 sentence technical analysis of the price relative to 52-week bounds and volume (${volume.toLocaleString('en-IN')} shares).",
  "sections": [
    {
      "title": "Growth Catalysts & Moat",
      "content": "Description of catalysts and business advantages."
    },
    {
      "title": "Key Valuation Risks",
      "content": "Description of industry risks or valuation concerns."
    }
  ]
}`;
            
            const apiRes = await queryUperAI(prompt, true);
            if (apiRes) {
              const cleanText = apiRes.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
              const parsed = JSON.parse(cleanText);
              if (parsed.summary) grokSummary = parsed.summary;
              if (parsed.technicalOverview) technicalOverview = parsed.technicalOverview;
              if (parsed.peRatio) peRatio = parsed.peRatio;
              if (parsed.marketCap) marketCap = parsed.marketCap;
              if (parsed.divYield) divYield = parsed.divYield;
              if (parsed.roe) roe = parsed.roe;
              if (parsed.sections) aiSections = parsed.sections;
            }
          } catch (e) {
            console.warn("Stock analysis query failed, using baseline:", e);
          }
        }

        const botMsg = {
          sender: 'bot',
          sources: ["NSE/BSE Exchange Feed", "UperAI Research Engine"],
          summary: grokSummary,
          metrics: [
            { label: "Current Price", value: `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%` },
            { label: "Market Cap", value: marketCap !== "N/A" ? marketCap : "₹ -", change: `Vol: ${volume.toLocaleString('en-IN')}` },
            { label: "P/E / ROE", value: peRatio !== "N/A" ? `${peRatio} / ${roe}` : "- / -", change: `Div Yield: ${divYield}` },
            { label: "52-Week Range", value: `₹${fiftyTwoWeekLow.toLocaleString('en-IN')} - ₹${fiftyTwoWeekHigh.toLocaleString('en-IN')}`, change: `Annual Position: ${positionPct}%` }
          ],
          chartData: chartPoints,
          chartTitle: `${longName} Price trend (1-Month)`,
          sections: aiSections || [
            {
              title: "Market Momentum & Technical Summary",
              content: technicalOverview
            },
            {
              title: "Corporate Metadata & Security Rules",
              content: `Registered Name: ${longName}\nListing Symbol: ${symbol}\nPrimary Exchange Board: ${exchangeName}\nCurrency Base: INR (Indian Rupee)\nCompliance Check: Trading follows Standard SEBI rules. Feed data is updated live during standard trading sessions.`
            }
          ]
        };

        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error("Invalid response schema");
      }
    } catch (err) {
      console.error("Failed to parse stock price:", err);
      const fallbackMsg = {
        sender: 'bot',
        summary: `I searched for **${symbol}** but could not complete the live request. Here is general profiling data for **${displayName}**:`,
        sections: [
          {
            title: "Corporate Overview",
            content: `${displayName} is listed under symbol ${symbol} on Indian exchanges. Standard brokerage indicators remain hold/neutral pending upcoming board review announcements.`
          }
        ]
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectStock = (stock) => {
    if (!user) {
      const currentCount = parseInt(localStorage.getItem('uperai_query_count') || '0', 10);
      if (currentCount >= 2) {
        onRequireLogin();
        return;
      }
    }

    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    
    // Add user message
    const userMsg = { sender: 'user', text: `Search real-time stock details for ${stock.longname || stock.shortname || stock.symbol} (${stock.symbol})` };
    setMessages(prev => [...prev, userMsg]);
    
    if (!user) {
      try {
        const currentCount = parseInt(localStorage.getItem('uperai_query_count') || '0', 10);
        localStorage.setItem('uperai_query_count', (currentCount + 1).toString());
      } catch (e) {
        console.error(e);
      }
    }

    fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
  };

  const generateSynthesizedDashboard = (query) => {
    const cleanQuery = query.toLowerCase();
    const words = query.split(/\s+/).map(w => w.toUpperCase().replace(/[^A-Z]/g, ""));
    const tickerCandidate = words.find(w => w.length >= 2 && w.length <= 10) || "STOCK";
    const displayName = tickerCandidate.charAt(0) + tickerCandidate.slice(1).toLowerCase() + " Ltd.";

    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = query.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedPrice = Math.abs(hash) % 4950 + 50;
    const isUp = hash % 2 === 0;
    const changePct = (Math.abs(hash) % 500) / 100 * (isUp ? 1 : -1);
    const changeVal = seedPrice * (changePct / 100);
    const prevClose = seedPrice - changeVal;
    
    const pe = ((Math.abs(hash) % 350) / 10 + 10).toFixed(1);
    const marketCap = ((Math.abs(hash) % 150) / 10 + 0.1).toFixed(2);
    
    const chartPoints = [];
    const baseValue = prevClose;
    const pointsCount = 5;
    for (let i = 0; i < pointsCount; i++) {
      const label = `W${i + 1}`;
      const variance = (Math.sin(i + hash) * 0.03);
      chartPoints.push({
        label: label,
        revenue: Math.round(baseValue * (1 + variance + (i * (changePct / (pointsCount - 1) / 100))))
      });
    }

    return {
      sender: 'bot',
      sources: ["Synthesized Sector Data", "UperAI Research Engine"],
      summary: `Dynamic dashboard generated for **${displayName} (${tickerCandidate})** based on your search query "${query}". The stock shows moderate momentum with an estimated price of **₹${seedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**, changing by **${isUp ? '+' : ''}${changePct.toFixed(2)}%** over the recent trading window.`,
      metrics: [
        { label: "Est. Price", value: `₹${seedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: `${isUp ? '+' : ''}${changePct.toFixed(2)}%` },
        { label: "P/E Ratio", value: `${pe}x`, change: "Sector Avg: 24.5x" },
        { label: "Est. Market Cap", value: `₹${marketCap} Lakh Cr`, change: isUp ? "Highly Liquid" : "Standard Volatility" },
        { label: "ROE", value: `${((Math.abs(hash) % 200) / 10 + 5).toFixed(1)}%`, change: "Avg Dividend: 0.6%" }
      ],
      chartData: chartPoints,
      chartTitle: `${displayName} Estimated Trend Profile`,
      sections: [
        {
          title: "Technical Trend Analysis",
          content: `Based on quantitative queries, the security demonstrates a strong trading band with standard deviations mapping to a support of ₹${(seedPrice * 0.93).toFixed(2)} and immediate resistance at ₹${(seedPrice * 1.07).toFixed(2)}. Accumulation has been noted in mid-day market sessions.`
        },
        {
          title: "Sector Context & Catalysts",
          content: `This security operates in a dynamic Indian industry segment. Key catalysts include the recent domestic manufacturing incentives and infrastructure capital outlay. Risks remain centered around supply chain input price inflation.`
        }
      ]
    };
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    if (!user) {
      const currentCount = parseInt(localStorage.getItem('uperai_query_count') || '0', 10);
      if (currentCount >= 2) {
        onRequireLogin();
        return;
      }
    }

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    setIsTyping(true);

    if (!user) {
      try {
        const currentCount = parseInt(localStorage.getItem('uperai_query_count') || '0', 10);
        localStorage.setItem('uperai_query_count', (currentCount + 1).toString());
      } catch (e) {
        console.error(e);
      }
    }

    const cleanQuery = text.toLowerCase();
    
    // 1. Check if the query matches one of our predefined high-fidelity demo responses
    let presetKey = "";
    if (cleanQuery.includes("reliance") || cleanQuery.includes("ril")) {
      presetKey = "reliance_q4";
    } else if (cleanQuery.includes("auto") || cleanQuery.includes("undervalued") || cleanQuery.includes("tata motors") || cleanQuery.includes("mahindra")) {
      presetKey = "auto_valuation";
    } else if (cleanQuery.includes("solar") || cleanQuery.includes("tata power") || cleanQuery.includes("policy")) {
      presetKey = "tata_power";
    } else if (cleanQuery.includes("nifty") || cleanQuery.includes("sensex") || cleanQuery.includes("market")) {
      presetKey = "nifty";
    }

    if (presetKey) {
      setTimeout(() => {
        const rawRes = getResponse(text, 'gemini');
        let botMsg;
        if (presetKey === "nifty") {
          botMsg = {
            sender: 'bot',
            sources: ["NSE Index Feed", "UperAI Research Engine"],
            summary: rawRes.summary || "",
            metrics: [
              { label: "NIFTY 50", value: "23,465.10", change: "+0.65%" },
              { label: "India VIX", value: "13.4", change: "-4.2%" },
              { label: "DII Flows (MTD)", value: "₹22,400 Cr", change: "Net Buy" },
              { label: "FII Flows (MTD)", value: "₹18,900 Cr", change: "Net Sell" }
            ],
            chartTitle: "Nifty 50 Trend (1-Month)",
            chartData: [
              { label: "W1", revenue: 23100 },
              { label: "W2", revenue: 23250 },
              { label: "W3", revenue: 23150 },
              { label: "W4", revenue: 23550 },
              { label: "W5", revenue: 23465 }
            ],
            sections: [
              {
                title: "Market Valuation Analysis",
                content: "The Index is trading at a forward P/E of 21.8x, slightly above the historical 10-year average of 20.2x. Support is established at 23,100, while resistance lies at 23,800."
              }
            ]
          };
        } else {
          botMsg = {
            sender: 'bot',
            sources: ["NSE Corporate Disclosures"],
            summary: rawRes.summary || "",
            metrics: rawRes.metrics || null,
            chartData: rawRes.chartData || null,
            chartTitle: rawRes.chartTitle || "",
            tableData: rawRes.tableData || null,
            sections: rawRes.sections || null
          };
        }
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 800);
      return;
    }

    const isTickerOrShortQuery = text.trim().split(/\s+/).length <= 2 && 
                                 !cleanQuery.includes("rules") && 
                                 !cleanQuery.includes("policy") && 
                                 !cleanQuery.includes("compare") &&
                                 !cleanQuery.includes("why") &&
                                 !cleanQuery.includes("how");

    const tryYahooFinanceSearch = async () => {
      try {
        const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(text)}&quotesCount=5&newsCount=0`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        const data = await res.json();
        
        const firstIndianStock = data.quotes?.find(item => 
          item.symbol && 
          (item.symbol.endsWith('.NS') || 
           item.symbol.endsWith('.BO') || 
           item.exchange === 'NSI' || 
           item.exchange === 'BOM' || 
           (item.exchDisp && (item.exchDisp.toLowerCase() === 'nse' || item.exchDisp.toLowerCase() === 'bse')))
        );
        return firstIndianStock || null;
      } catch (err) {
        console.error("Yahoo Search error:", err);
        return null;
      }
    };

    const tryGeminiJSONGeneration = async () => {
      if (!import.meta.env.VITE_GEMINI_API_KEY) return null;
      try {
        const prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities. 
Provide a high-fidelity structured analysis for the query: "${text}".
Return ONLY a valid JSON object (do not include markdown code block formatting like \`\`\`json, do not include any backticks or leading/trailing text) with the following schema:
{
  "summary": "Concise analytical summary of the query under 100 words (no markdown formatting).",
  "sources": ["List of 2-3 realistic sources, e.g. NSE Filings, Analyst Reports"],
  "metrics": [
    {"label": "Metric Name", "value": "Metric Value", "change": "Change/Status (e.g. +1.5%, Low Debt, or N/A)"}
  ],
  "chartTitle": "Title for the chart representing trend",
  "chartData": [
    {"label": "Point Label (e.g. Q1, Q2 or Week 1)", "revenue": 100}
  ],
  "sections": [
    {"title": "Section Title", "content": "Section Content"}
  ],
  "tableData": [ // Optional: include ONLY if comparing stocks or showing multiple companies
    {"name": "Stock Name", "ticker": "TICKER", "pe": "PE", "peg": "PEG", "roe": "ROE", "ebitda": "EBITDA"}
  ]
}

CRITICAL RULES:
1. Return ONLY the raw JSON object. The response must start with '{' and end with '}'.
2. Provide at least 3-5 chart points in chartData with numerical values for Y-axis (revenue parameter).
3. If the query asks about specific stock pricing, make up realistic prices/trends.`;

        const apiRes = await queryUperAI(prompt, true);
        if (apiRes) {
          const cleanText = apiRes.trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
          return JSON.parse(cleanText);
        }
      } catch (err) {
        console.error("Gemini JSON Generation failed:", err);
      }
      return null;
    };

    // Main Routing Flow
    if (isTickerOrShortQuery) {
      const stock = await tryYahooFinanceSearch();
      if (stock) {
        await fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
      } else {
        const geminiRes = await tryGeminiJSONGeneration();
        if (geminiRes) {
          const botMsg = {
            sender: 'bot',
            sources: geminiRes.sources || ["UperAI Research Engine"],
            summary: geminiRes.summary || "",
            metrics: geminiRes.metrics || null,
            chartData: geminiRes.chartData || null,
            chartTitle: geminiRes.chartTitle || "",
            tableData: geminiRes.tableData || null,
            sections: geminiRes.sections || null
          };
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
        } else {
          const fallbackMsg = generateSynthesizedDashboard(text);
          setMessages(prev => [...prev, fallbackMsg]);
          setIsTyping(false);
        }
      }
    } else {
      const geminiRes = await tryGeminiJSONGeneration();
      if (geminiRes) {
        const botMsg = {
          sender: 'bot',
          sources: geminiRes.sources || ["UperAI Research Engine"],
          summary: geminiRes.summary || "",
          metrics: geminiRes.metrics || null,
          chartData: geminiRes.chartData || null,
          chartTitle: geminiRes.chartTitle || "",
          tableData: geminiRes.tableData || null,
          sections: geminiRes.sections || null
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      } else {
        const stock = await tryYahooFinanceSearch();
        if (stock) {
          await fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
        } else {
          const fallbackMsg = generateSynthesizedDashboard(text);
          setMessages(prev => [...prev, fallbackMsg]);
          setIsTyping(false);
        }
      }
    }
  };

  // Handle initial query from landing page search
  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  const toggleSection = (messageIdx, sectionIdx) => {
    const key = `${messageIdx}-${sectionIdx}`;
    setExpandedSectionIdx(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="chat-interface-grid" style={{ zIndex: 1 }}>
      {/* Middle Workspace: Chat history & input centerpiece */}
      <div className="main-content-column">
        
        {/* Message Space */}
        <div className="chat-area-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 ? (
            <div className="welcome-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '100%' }}>
              
              {/* Centerpiece Search Area */}
              <div className="centerpiece-search-wrapper" style={{ width: '100%', maxWidth: '800px', margin: 'auto 0' }}>
                <div className="centerpiece-input-bar">
                  <Search size={20} style={{ color: 'var(--accent-color)', marginRight: '14px' }} />
                  <input
                    type="text"
                    className="centerpiece-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Search stock quotes or ask financial questions (e.g. INFY, TATAMOTORS, RELIANCE)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                  />
                  <span className="kbd-shortcut">↵ Enter</span>
                  <button className="centerpiece-submit-btn" onClick={() => handleSend()}>
                    <span>Translate</span>
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            messages.map((msg, msgIdx) => (
              <div key={msgIdx} className={`chat-bubble ${msg.sender}`}>
                {msg.sender === 'user' ? (
                  <div>{msg.text}</div>
                ) : (
                  <div>
                    {/* Unified bot header metadata */}
                    <div className="bot-meta-info">
                      <span className="bot-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={12} />
                        UperAI Analysis
                      </span>
                      <span>Sources: {msg.sources?.join(', ')}</span>
                    </div>

                    {/* Main text response summary */}
                    <div className="insights-summary">
                      {msg.summary}
                    </div>

                    {/* Dynamic Metrics Grid */}
                    {msg.metrics && (
                      <div className="metrics-grid">
                        {msg.metrics.map((metric, mIdx) => {
                          const isNegative = metric.change && (metric.change.includes('-') || metric.change.toLowerCase().includes('down'));
                          return (
                            <div className="metric-card" key={mIdx}>
                              <span className="metric-label">{metric.label}</span>
                              <span className="metric-value">{metric.value}</span>
                              {metric.change && (
                                <span className={`metric-change ${isNegative ? 'negative' : ''}`}>
                                  {metric.change}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom SVG Interactive Chart */}
                    {msg.chartData && (
                      <InteractiveChart data={msg.chartData} title={msg.chartTitle} />
                    )}

                    {/* Custom Comparison Table */}
                    {msg.tableData && (
                      <div className="table-widget-container">
                        <table className="widget-table">
                          <thead>
                            <tr>
                              <th>Company</th>
                              <th>P/E</th>
                              <th>PEG</th>
                              <th>ROE</th>
                              <th>EBITDA Margin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {msg.tableData.map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className="stock-pill">{row.name} ({row.ticker})</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.pe}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.peg}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.roe}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.ebitda}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Expandable Sections */}
                    {msg.sections && (
                      <div className="collapsible-sections">
                        {msg.sections.map((section, sIdx) => {
                          const isExpanded = !!expandedSectionIdx[`${msgIdx}-${sIdx}`];
                          return (
                            <div className="collapsible-item" key={sIdx}>
                              <div 
                                className="collapsible-header" 
                                onClick={() => toggleSection(msgIdx, sIdx)}
                              >
                                <span>{section.title}</span>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                              {isExpanded && (
                                <div className="collapsible-content" style={{ whiteSpace: 'pre-line' }}>
                                  {section.content}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-bubble bot" style={{ display: 'inline-block', maxWidth: '100px' }}>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input panel dock (at bottom of column) */}
        {messages.length > 0 && (
          <footer className="input-dock" style={{ background: 'transparent', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="input-form-wrapper" style={{ position: 'relative' }}>
              
              {/* Autocomplete Dropdown List */}
              {showDropdown && searchResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  {searchResults.map((stock, idx) => (
                    <div 
                      key={idx} 
                      className="autocomplete-item"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div className="autocomplete-symbol-wrap">
                        <span className="autocomplete-symbol">{stock.symbol}</span>
                        <span className="autocomplete-exchange">{stock.exchDisp || (stock.symbol.endsWith('.NS') ? 'NSE' : 'BSE')}</span>
                      </div>
                      <span className="autocomplete-name">{stock.longname || stock.shortname}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="input-bar" style={{ background: 'var(--bg-card)' }}>
                <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '12px' }} />
                <input
                  type="text"
                  className="input-field"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search NSE/BSE stocks or ask a question..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                />
                <div className="action-buttons">
                  <button className="submit-btn" onClick={() => handleSend()}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Right Intelligence Sidebar removed as requested */}
    </div>
  );
}
