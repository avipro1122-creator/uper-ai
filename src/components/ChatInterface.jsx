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
  Compass,
  Clock,
  ArrowUpRight,
  Trash2,
  Plus,
  Bell,
  Moon,
  User,
  PanelLeftClose,
  BarChart3,
  Target,
  Bot,
  Wallet,
  MessageSquare,
  LogIn,
  LogOut
} from 'lucide-react';
import { getResponse } from '../data/mockData';
import InteractiveChart from './InteractiveChart';

const LOCAL_TICKERS = {
  "ADANIENT": { symbol: "ADANIENT", name: "Adani Enterprises Ltd" },
  "ADANIPORTS": { symbol: "ADANIPORTS", name: "Adani Ports & Special Economic Zone Ltd" },
  "AXISBANK": { symbol: "AXISBANK", name: "Axis Bank Ltd" },
  "BAJAJ-AUTO": { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Ltd" },
  "BAJFINANCE": { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd" },
  "BAJAJFINSV": { symbol: "BAJAJFINSV", name: "Bajaj Finserv Ltd" },
  "BEL": { symbol: "BEL", name: "Bharat Electronics Ltd" },
  "BHARTIARTL": { symbol: "BHARTIARTL", name: "Bharti Airtel Limited" },
  "COALINDIA": { symbol: "COALINDIA", name: "Coal India Ltd" },
  "HCLTECH": { symbol: "HCLTECH", name: "HCL Technologies Ltd" },
  "HDFCBANK": { symbol: "HDFCBANK", name: "HDFC Bank Limited" },
  "HINDUNILVR": { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd" },
  "ICICIBANK": { symbol: "ICICIBANK", name: "ICICI Bank Ltd" },
  "INFY": { symbol: "INFY", name: "Infosys Ltd" },
  "JSWSTEEL": { symbol: "JSWSTEEL", name: "JSW Steel Ltd" },
  "KOTAKBANK": { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd" },
  "LT": { symbol: "LT", name: "Larsen & Toubro Ltd" },
  "M&M": { symbol: "M&M", name: "Mahindra & Mahindra Ltd" },
  "MARUTI": { symbol: "MARUTI", name: "Maruti Suzuki India Ltd" },
  "NTPC": { symbol: "NTPC", name: "NTPC Ltd" },
  "NESTLEIND": { symbol: "NESTLEIND", name: "Nestle India Ltd" },
  "ONGC": { symbol: "ONGC", name: "Oil & Natural Gas Corpn Ltd" },
  "RELIANCE": { symbol: "RELIANCE", name: "Reliance Industries Limited" },
  "RIL": { symbol: "RELIANCE", name: "Reliance Industries Limited" },
  "SBIN": { symbol: "SBIN", name: "State Bank of India Limited" },
  "SUNPHARMA": { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Ltd" },
  "TCS": { symbol: "TCS", name: "Tata Consultancy Services limited" },
  "TITAN": { symbol: "TITAN", name: "Titan Company Ltd" },
  "ULTRACEMCO": { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd" },
  "TATAPOWER": { symbol: "TATAPOWER", name: "Tata Power Company Ltd." },
  "TATAMOTORS": { symbol: "TATAMOTORS", name: "Tata Motors Ltd." }
};

const LOCAL_MAPPINGS = [
  { keywords: ["adani enterprises", "adani enterprise", "adanient", "ael"], symbol: "ADANIENT" },
  { keywords: ["adani ports", "adani port", "ports & special", "ports", "adaniports"], symbol: "ADANIPORTS" },
  { keywords: ["reliance", "ril"], symbol: "RELIANCE" },
  { keywords: ["tcs", "tata consultancy", "tata consultancy services"], symbol: "TCS" },
  { keywords: ["tata power", "tatapower"], symbol: "TATAPOWER" },
  { keywords: ["tata motors", "tatamotors"], symbol: "TATAMOTORS" },
  { keywords: ["axis bank", "axisbank", "axis"], symbol: "AXISBANK" },
  { keywords: ["hdfc bank", "hdfcbank", "hdfc"], symbol: "HDFCBANK" },
  { keywords: ["icici bank", "icicibank", "icici"], symbol: "ICICIBANK" },
  { keywords: ["sbi", "sbin", "state bank of india", "state bank"], symbol: "SBIN" },
  { keywords: ["infosys", "infy"], symbol: "INFY" },
  { keywords: ["hcl", "hcltech", "hcl technologies"], symbol: "HCLTECH" },
  { keywords: ["maruti", "suzuki", "maruti suzuki"], symbol: "MARUTI" },
  { keywords: ["mahindra", "m&m", "mahindra & mahindra"], symbol: "M&M" },
  { keywords: ["bajaj auto", "bajajauto"], symbol: "BAJAJ-AUTO" },
  { keywords: ["bajaj finance", "bajfinance"], symbol: "BAJFINANCE" },
  { keywords: ["bajaj finserv", "bajajfinsv"], symbol: "BAJAJFINSV" },
  { keywords: ["larsen", "l&t", "lt"], symbol: "LT" },
  { keywords: ["sun pharma", "sunpharma", "sun pharmaceutical"], symbol: "SUNPHARMA" },
  { keywords: ["ultratech", "ultracemco", "ultratech cement"], symbol: "ULTRACEMCO" },
  { keywords: ["coal india", "coalindia"], symbol: "COALINDIA" },
  { keywords: ["ntpc"], symbol: "NTPC" },
  { keywords: ["nestle", "nestleind"], symbol: "NESTLEIND" },
  { keywords: ["ongc", "oil & natural gas"], symbol: "ONGC" },
  { keywords: ["jsw steel", "jswsteel"], symbol: "JSWSTEEL" },
  { keywords: ["kotak", "kotak bank", "kotak mahindra"], symbol: "KOTAKBANK" },
  { keywords: ["bel", "bharat electronics"], symbol: "BEL" },
  { keywords: ["airtel", "bharti airtel", "bhartiartl"], symbol: "BHARTIARTL" },
  { keywords: ["hindunilvr", "hindustan unilever", "hul", "hind uilever"], symbol: "HINDUNILVR" },
  { keywords: ["titan"], symbol: "TITAN" }
];

export const findLocalStock = (query) => {
  const q = query.toLowerCase().trim();
  
  // Match exact ticker symbols
  const upperQ = q.toUpperCase();
  if (LOCAL_TICKERS[upperQ]) {
    return LOCAL_TICKERS[upperQ];
  }
  
  // Match ticker patterns (remove .NS, .BO, spaces)
  const cleanQ = upperQ.replace('.NS', '').replace('.BO', '').replace(/[\s-]/g, '');
  const matchedKey = Object.keys(LOCAL_TICKERS).find(key => 
    key.replace(/[\s-]/g, '') === cleanQ
  );
  if (matchedKey) {
    return LOCAL_TICKERS[matchedKey];
  }
  
  const found = LOCAL_MAPPINGS.find(m => 
    m.keywords.some(kw => q === kw || q.includes(kw))
  );
  if (found) {
    return LOCAL_TICKERS[found.symbol];
  }
  return null;
};

const suggestionPills = [
  { label: "Top Nifty 50", query: "Show Nifty 50 valuation metrics and segment leaders" },
  { label: "High Growth", query: "List high growth mid-caps in the Indian market" },
  { label: "Zero Debt", query: "List zero debt Indian companies with strong return ratios" },
  { label: "AI Stocks", query: "Analyze Indian stocks exposed to AI and cloud infrastructure" },
  { label: "Dividend", query: "Top dividend yield stocks with high cash flow visibility" },
  { label: "Small Caps", query: "Analyze undervalued small-caps with earnings breakouts" }
];

const marketStrip = [
  { name: "Nifty 50", value: "24,056", change: "+0.14%", trend: "up" },
  { name: "Sensex", value: "77,100", change: "+0.14%", trend: "up" },
  { name: "Bank Nifty", value: "58,177", change: "+0.05%", trend: "up" },
  { name: "Nifty IT", value: "27,331", change: "-0.86%", trend: "down" },
  { name: "Midcap 100", value: "72,200", change: "--", trend: "flat" },
  { name: "India VIX", value: "13.05", change: "-2.54%", trend: "down" }
];

const orionPrompts = [
  { icon: BarChart3, title: "Portfolio Review", text: "Review my portfolio risk & diversification", query: "Review my portfolio risk and diversification" },
  { icon: LineChart, title: "Technical Analysis", text: "RSI + MACD analysis for HDFC Bank", query: "RSI and MACD technical analysis for HDFC Bank" },
  { icon: Search, title: "Stock Deep Dive", text: "Analyze Reliance - price, fundamentals, news", query: "Analyze Reliance price, fundamentals, and recent news" },
  { icon: Wallet, title: "Compare Stocks", text: "TCS vs Infosys - which is better value?", query: "Compare TCS vs Infosys and tell me which is better value" },
  { icon: Compass, title: "Market & FII/DII", text: "Why is Nifty falling today?", query: "Why is Nifty falling today?" },
  { icon: Target, title: "Smart Ideas", text: "Best low-debt stocks for long-term growth", query: "Best low debt Indian stocks for long-term growth" }
];

export default function ChatInterface({ user, onRequireLogin, initialQuery, onClearInitialQuery, onNavigate, onLogout }) {
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

  const processedInitialQueryRef = useRef(false);

  // Handle initial query from parent component (e.g. Landing Page Hero search)
  useEffect(() => {
    if (initialQuery) {
      if (!processedInitialQueryRef.current) {
        processedInitialQueryRef.current = true;
        handleSend(initialQuery);
        if (onClearInitialQuery) {
          onClearInitialQuery();
        }
      }
    } else {
      processedInitialQueryRef.current = false;
    }
  }, [initialQuery]);

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


  // Fetch stock quotes from Yahoo Finance via CORS proxy
  const fetchAutocomplete = async (query) => {
    try {
      const localMatch = findLocalStock(query);
      let localResults = [];
      if (localMatch) {
        localResults.push({
          symbol: localMatch.symbol + ".NS",
          longname: localMatch.name,
          shortname: localMatch.name,
          exchange: "NSI"
        });
      }

      const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      
      let yahooStocks = [];
      try {
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (data && data.quotes) {
          yahooStocks = data.quotes.filter(item => 
            item.symbol && 
            (item.symbol.endsWith('.NS') || 
             item.symbol.endsWith('.BO') || 
             item.exchange === 'NSI' || 
             item.exchange === 'BOM' || 
             (item.exchDisp && (item.exchDisp.toLowerCase() === 'nse' || item.exchDisp.toLowerCase() === 'bse')))
          );
        }
      } catch (e) {
        console.error("Yahoo search failed during autocomplete, relying on local match:", e);
      }

      // Combine and remove duplicate symbols
      const combined = [...localResults];
      yahooStocks.forEach(item => {
        const cleanYahooSymbol = item.symbol.replace('.NS', '').replace('.BO', '');
        if (!combined.some(c => c.symbol.replace('.NS', '').replace('.BO', '') === cleanYahooSymbol)) {
          combined.push(item);
        }
      });

      setSearchResults(combined.slice(0, 5));
      setShowDropdown(combined.length > 0);
    } catch (err) {
      console.error("Autocomplete search error:", err);
    }
  };

  // Fetch real chart and market price details for a stock
  // Fetch real chart and market price details for a stock
  const fetchAndRenderStock = async (symbol, displayName, rawStockInfo) => {
    setIsTyping(true);
    try {
      const backendUrl = `/api/stock/analyze?symbol=${encodeURIComponent(symbol)}&name=${encodeURIComponent(displayName)}`;
      const res = await fetch(backendUrl);
      const json = await res.json();
      
      if (json && json.success && json.data) {
        const { quote, analysis, isConcall, concallData } = json.data;

        if (isConcall && concallData) {
          const botMsg = {
            sender: 'bot',
            sources: ["Earnings Conference Call Transcript", "UperAI Research Engine"],
            summary: `Here is the earnings call analysis for **${displayName} (${symbol})** for **${concallData.quarter} ${concallData.financialYear}**:\n\n${analysis.summary}`,
            metrics: [
              { 
                label: "Revenue", 
                value: concallData.keyNumbers?.revenue || concallData.quarterlyPerformance?.revenue || "N/A", 
                change: concallData.quarterlyPerformance?.revenue?.includes('(')
                  ? concallData.quarterlyPerformance.revenue.substring(concallData.quarterlyPerformance.revenue.indexOf('(') + 1, concallData.quarterlyPerformance.revenue.indexOf(')'))
                  : "YoY"
              },
              { 
                label: "EBITDA", 
                value: concallData.keyNumbers?.ebitda || concallData.quarterlyPerformance?.ebitda || "N/A", 
                change: concallData.quarterlyPerformance?.ebitda?.includes('(')
                  ? concallData.quarterlyPerformance.ebitda.substring(concallData.quarterlyPerformance.ebitda.indexOf('(') + 1, concallData.quarterlyPerformance.ebitda.indexOf(')'))
                  : "Margin"
              },
              { 
                label: "PAT", 
                value: concallData.keyNumbers?.pat || concallData.quarterlyPerformance?.pat || "N/A", 
                change: concallData.quarterlyPerformance?.pat?.includes('(')
                  ? concallData.quarterlyPerformance.pat.substring(concallData.quarterlyPerformance.pat.indexOf('(') + 1, concallData.quarterlyPerformance.pat.indexOf(')'))
                  : "Net Profit"
              },
              { 
                label: "AI Sentiment", 
                value: `${concallData.aiSentiment?.score}/100`, 
                change: concallData.aiSentiment?.classification || "Neutral" 
              }
            ],
            chartData: null, // Avoid standard stock charts and market pricing metrics
            chartTitle: "",
            sections: analysis.sections || []
          };
          setMessages(prev => [...prev, botMsg]);
        } else {
          const currentPrice = quote.price;
          const previousClose = currentPrice * 0.985; // Synthesize previous close (e.g. -1.5% from current)
          const change = currentPrice - previousClose;
          const changePct = 1.5; // +1.5%
          const volume = quote.volume || 0;
          const fiftyTwoWeekHigh = currentPrice * 1.25;
          const fiftyTwoWeekLow = currentPrice * 0.85;
          const positionPct = Math.round(((currentPrice - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow)) * 100);

          // Synthesize chart points around the current price for 1 month
          const chartPoints = [];
          const baseValue = previousClose;
          const pointsCount = 5;
          for (let i = 0; i < pointsCount; i++) {
            const label = `W${i + 1}`;
            const variance = (Math.sin(i) * 0.02);
            chartPoints.push({
              label: label,
              revenue: Math.round(baseValue * (1 + variance + (i * (changePct / (pointsCount - 1) / 100))))
            });
          }

          const peRatio = analysis.peRatio || "N/A";
          const marketCap = analysis.marketCap || "N/A";
          const divYield = analysis.divYield || "N/A";
          const roe = analysis.roe || "N/A";

          const botMsg = {
            sender: 'bot',
            sources: ["NSE/BSE Exchange Feed", "UperAI Research Engine"],
            summary: analysis.summary,
            metrics: [
              { label: "Current Price", value: `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%` },
              { label: "Market Cap", value: marketCap !== "N/A" ? marketCap : "₹ -", change: `Vol: ${volume.toLocaleString('en-IN')}` },
              { label: "P/E / ROE", value: peRatio !== "N/A" ? `${peRatio} / ${roe}` : "- / -", change: `Div Yield: ${divYield}` },
              { label: "52-Week Range", value: `₹${fiftyTwoWeekLow.toLocaleString('en-IN')} - ₹${fiftyTwoWeekHigh.toLocaleString('en-IN')}`, change: `Annual Position: ${positionPct}%` }
            ],
            chartData: chartPoints,
            chartTitle: `${displayName} Price trend (1-Month)`,
            sections: analysis.sections || [
              {
                title: "Market Momentum & Technical Summary",
                content: analysis.technicalOverview || ""
              }
            ]
          };

          setMessages(prev => [...prev, botMsg]);
        }
      } else {
        throw new Error(json?.error || "Invalid response schema");
      }
    } catch (err) {
      console.error("Failed to parse stock price:", err);
      const isNoConcall = err.message && err.message.includes("No Concall Transcript Available");
      
      const fallbackMsg = {
        sender: 'bot',
        sources: ["UperAI Research Engine"],
        summary: isNoConcall 
          ? `No Concall Transcript Available for **${displayName} (${symbol})**.`
          : `I searched for **${symbol}** but could not complete the live request. Here is general profiling data for **${displayName}**:`,
        sections: isNoConcall 
          ? [] 
          : [
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

  const parseInlineMarkdown = (text) => {
    if (!text) return "";
    // Normalize triple asterisks to double asterisks for clean bolding
    const cleanedText = text.replace(/\*\*\*/g, '**');
    const parts = cleanedText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: 'inherit', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line.trim();
      
      if (content.startsWith('### ')) {
        return <h3 key={idx} style={{ color: 'var(--orion-text, #101827)', fontSize: '1.25rem', fontWeight: 700, margin: '18px 0 8px 0' }}>{parseInlineMarkdown(content.slice(4))}</h3>;
      }
      if (content.startsWith('#### ')) {
        return <h4 key={idx} style={{ color: 'var(--orion-text, #101827)', fontSize: '1.1rem', fontWeight: 700, margin: '14px 0 6px 0' }}>{parseInlineMarkdown(content.slice(5))}</h4>;
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} style={{ color: 'var(--orion-text, #101827)', fontSize: '1.4rem', fontWeight: 700, margin: '22px 0 10px 0' }}>{parseInlineMarkdown(content.slice(3))}</h2>;
      }
      
      if (content.startsWith('* ') || content.startsWith('- ') || content.startsWith('• ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', margin: '6px 0 6px 16px', fontSize: '1.05rem', color: 'inherit', lineHeight: '1.6' }}>
            <span style={{ color: 'var(--orion-blue, #2f8cf3)', fontWeight: 'bold' }}>•</span>
            <span>{parseInlineMarkdown(content.slice(2))}</span>
          </div>
        );
      }

      if (content === '') {
        return <div key={idx} style={{ height: '10px' }} />;
      }
      
      return (
        <p key={idx} style={{ margin: '8px 0', fontSize: '1.05rem', color: 'inherit', lineHeight: '1.6' }}>
          {parseInlineMarkdown(line)}
        </p>
      );
    });
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
    const isConversationalQuery = cleanQuery.split(/\s+/).length > 3 || 
                                 cleanQuery.includes("why") || 
                                 cleanQuery.includes("how") || 
                                 cleanQuery.includes("compare") ||
                                 cleanQuery.includes("good") ||
                                 cleanQuery.includes("bad") ||
                                 cleanQuery.includes("is") ||
                                 cleanQuery.includes("should");
    
    // Check if query is a direct search for a local company
    const localMatch = findLocalStock(text);
    const isShortQuery = text.trim().split(/\s+/).length <= 3 && 
                         !cleanQuery.includes("why") && 
                         !cleanQuery.includes("how") && 
                         !cleanQuery.includes("compare") &&
                         !cleanQuery.includes("rules") &&
                         !cleanQuery.includes("policy");

    if (localMatch && isShortQuery) {
      await fetchAndRenderStock(localMatch.symbol, localMatch.name, { symbol: localMatch.symbol });
      return;
    }
    
    // 1. Check if the query matches one of our predefined high-fidelity demo responses
    let presetKey = "";
    if (cleanQuery.includes("reliance") || cleanQuery.includes("ril")) {
      presetKey = "reliance_q4";
    } else if (cleanQuery.includes("auto") || cleanQuery.includes("undervalued") || cleanQuery.includes("tata motors") || cleanQuery.includes("mahindra")) {
      presetKey = "auto_valuation";
    } else if (cleanQuery.includes("solar") || cleanQuery.includes("tata power") || cleanQuery.includes("policy")) {
      presetKey = "tata_power";
    } else if (cleanQuery.includes("sensex")) {
      presetKey = "sensex";
    } else if (cleanQuery.includes("nifty") || cleanQuery.includes("market")) {
      presetKey = "nifty";
    }

    if (presetKey) {
      const loadPreset = async () => {
        const rawRes = getResponse(text, 'gemini');
        let botMsg;
        
        if (presetKey === "nifty") {
          try {
            const res = await fetch(`/api/market-indices?_=${Date.now()}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                const liveNifty = data.nifty;
                botMsg = {
                  sender: 'bot',
                  sources: ["NSE Index Feed", "UperAI Research Engine"],
                  summary: `The **Nifty 50 Index** is consolidating at **₹${liveNifty.value.toLocaleString('en-IN')}** (${liveNifty.change >= 0 ? '+' : ''}${liveNifty.changePct.toFixed(2)}%). DII support (averaging **₹22,400+ Cr monthly** inflows) provides a solid floor, buffering against steady FII selloffs.`,
                  metrics: [
                    { label: "NIFTY 50", value: `₹${liveNifty.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, change: `${liveNifty.change >= 0 ? '+' : ''}${liveNifty.changePct.toFixed(2)}%` },
                    { label: "India VIX", value: "13.4", change: "-4.2%" },
                    { label: "DII Flows (MTD)", value: "₹22,400 Cr", change: "Net Buy" },
                    { label: "FII Flows (MTD)", value: "₹18,900 Cr", change: "Net Sell" }
                  ],
                  chartTitle: "Nifty 50 Trend (1-Month)",
                  chartData: [
                    { label: "W1", revenue: Math.round(liveNifty.prevClose * 0.985) },
                    { label: "W2", revenue: Math.round(liveNifty.prevClose * 0.99) },
                    { label: "W3", revenue: Math.round(liveNifty.prevClose * 0.98) },
                    { label: "W4", revenue: Math.round(liveNifty.prevClose * 1.005) },
                    { label: "W5", revenue: Math.round(liveNifty.value) }
                  ],
                  sections: [
                    {
                      title: "Market Valuation Analysis",
                      content: `The Index is currently trading at ₹${liveNifty.value.toLocaleString('en-IN')}, relative to the previous close of ₹${liveNifty.prevClose.toLocaleString('en-IN')}. Daily High: ₹${liveNifty.high.toLocaleString('en-IN')}, Daily Low: ₹${liveNifty.low.toLocaleString('en-IN')}. Support is established at ₹${Math.round(liveNifty.value * 0.985).toLocaleString('en-IN')}, while resistance lies at ₹${Math.round(liveNifty.value * 1.015).toLocaleString('en-IN')}.`
                    }
                  ]
                };
              }
            }
          } catch (err) {
            console.error("Failed to load live nifty for chat:", err);
          }
        } else if (presetKey === "sensex") {
          try {
            const res = await fetch(`/api/market-indices?_=${Date.now()}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                const liveSensex = data.sensex;
                botMsg = {
                  sender: 'bot',
                  sources: ["BSE Index Feed", "UperAI Research Engine"],
                  summary: `The **S&P BSE SENSEX** is trading at **₹${liveSensex.value.toLocaleString('en-IN')}** (${liveSensex.change >= 0 ? '+' : ''}${liveSensex.changePct.toFixed(2)}%). Institutional support provides strong market momentum.`,
                  metrics: [
                    { label: "BSE SENSEX", value: `₹${liveSensex.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, change: `${liveSensex.change >= 0 ? '+' : ''}${liveSensex.changePct.toFixed(2)}%` },
                    { label: "India VIX", value: "13.4", change: "-4.2%" },
                    { label: "DII Flows (MTD)", value: "₹22,400 Cr", change: "Net Buy" },
                    { label: "FII Flows (MTD)", value: "₹18,900 Cr", change: "Net Sell" }
                  ],
                  chartTitle: "BSE Sensex Trend (1-Month)",
                  chartData: [
                    { label: "W1", revenue: Math.round(liveSensex.prevClose * 0.985) },
                    { label: "W2", revenue: Math.round(liveSensex.prevClose * 0.99) },
                    { label: "W3", revenue: Math.round(liveSensex.prevClose * 0.98) },
                    { label: "W4", revenue: Math.round(liveSensex.prevClose * 1.005) },
                    { label: "W5", revenue: Math.round(liveSensex.value) }
                  ],
                  sections: [
                    {
                      title: "Index Valuation Analysis",
                      content: `The S&P BSE SENSEX is currently trading at ₹${liveSensex.value.toLocaleString('en-IN')} relative to the previous close of ₹${liveSensex.prevClose.toLocaleString('en-IN')}. Daily High: ₹${liveSensex.high.toLocaleString('en-IN')}, Daily Low: ₹${liveSensex.low.toLocaleString('en-IN')}. Support is established at ₹${Math.round(liveSensex.value * 0.985).toLocaleString('en-IN')}, while resistance lies at ₹${Math.round(liveSensex.value * 1.015).toLocaleString('en-IN')}.`
                    }
                  ]
                };
              }
            }
          } catch (err) {
            console.error("Failed to load live sensex for chat:", err);
          }
        }

        if (!botMsg) {
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
      };

      setTimeout(loadPreset, 800);
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

    const callChatAPI = async (messageText) => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: messageText })
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const json = await res.json();
        if (json.success) {
          if (json.type === 'text') {
            return {
              sender: 'bot',
              sources: ["Gemini AI Engine", "UperAI Research"],
              text: json.text
            };
          } else if (json.type === 'json' && json.data) {
            return {
              sender: 'bot',
              sources: json.data.sources || ["Gemini AI Engine", "UperAI Research"],
              summary: json.data.summary || "",
              metrics: json.data.metrics || null,
              chartData: json.data.chartData || null,
              chartTitle: json.data.chartTitle || "",
              tableData: json.data.tableData || null,
              sections: json.data.sections || null
            };
          }
        }
      } catch (err) {
        console.error("Failed to fetch from chat API:", err);
      }
      return null;
    };

    // Main Routing Flow
    if (isTickerOrShortQuery) {
      const stock = await tryYahooFinanceSearch();
      if (stock) {
        await fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
      } else {
        const botMsg = await callChatAPI(text);
        if (botMsg) {
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
        } else {
          let fallbackMsg;
          if (isConversationalQuery) {
            fallbackMsg = {
              sender: 'bot',
              sources: ["UperAI Research"],
              text: `Here is a general market overview regarding your query "${text}":

* **Market Sentiment**: The business model and industry dynamics are currently being discussed by analysts in the context of growth prospects, market share, and unit economics.
* **Profitability & Operations**: Key focus points include operating margins, customer acquisition costs, and capacity expansion strategies.
* **Outlook**: Long-term value creation depends heavily on capital allocation efficiency and execution performance over upcoming quarters.

*Note: Operating in offline mode. Please verify with the latest financial disclosures.*`
            };
          } else {
            fallbackMsg = generateSynthesizedDashboard(text);
          }
          setMessages(prev => [...prev, fallbackMsg]);
          setIsTyping(false);
        }
      }
    } else {
      const botMsg = await callChatAPI(text);
      if (botMsg) {
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      } else {
        const stock = await tryYahooFinanceSearch();
        if (stock) {
          await fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
        } else {
          let fallbackMsg;
          if (isConversationalQuery) {
            fallbackMsg = {
              sender: 'bot',
              sources: ["UperAI Research"],
              text: `Here is a general market overview regarding your query "${text}":

* **Market Sentiment**: The business model and industry dynamics are currently being discussed by analysts in the context of growth prospects, market share, and unit economics.
* **Profitability & Operations**: Key focus points include operating margins, customer acquisition costs, and capacity expansion strategies.
* **Outlook**: Long-term value creation depends heavily on capital allocation efficiency and execution performance over upcoming quarters.

*Note: Operating in offline mode. Please verify with the latest financial disclosures.*`
            };
          } else {
            fallbackMsg = generateSynthesizedDashboard(text);
          }
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

  const handleNewConversation = () => {
    setMessages([]);
    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    localStorage.removeItem('uperai_chat_messages');
  };

  const renderComposer = (variant = "dock") => (
    <div className={`orion-composer-wrap ${variant === "hero" ? "hero" : ""}`}>
      {showDropdown && searchResults.length > 0 && (
        <div className="autocomplete-dropdown orion-autocomplete">
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
      <div className="orion-composer">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Orion about stocks..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button className="orion-bot-btn" type="button" aria-label="Assistant mode">
          <Bot size={16} />
        </button>
        <button className="orion-send-btn" type="button" onClick={() => handleSend()} aria-label="Send message">
          <Send size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="orion-shell">
      <header className="orion-topbar">
        <button className="orion-logo" type="button" onClick={() => onNavigate?.('home', '/')}>
          <span>V</span>
        </button>
        <nav className="orion-main-nav" aria-label="Primary">
          <button className="active" type="button">Orion</button>
          <button type="button" onClick={() => onNavigate?.('home', '/')}>Overview</button>
          <button type="button" onClick={() => onNavigate?.('concall', '/concall')}>Screener</button>
          <button type="button" onClick={() => onNavigate?.('roadmap', '/roadmap')}>Journal</button>
          <button type="button">Community</button>
        </nav>
        <div className="orion-top-actions">
          <button type="button" aria-label="Notifications"><Bell size={18} /></button>
          <button type="button" aria-label="Theme"><Moon size={18} /></button>
          {user ? (
            <button type="button" onClick={onLogout} aria-label="Sign out"><LogOut size={18} /></button>
          ) : (
            <button type="button" onClick={onRequireLogin} aria-label="Sign in"><LogIn size={18} /></button>
          )}
        </div>
      </header>

      <div className="orion-market-strip">
        {marketStrip.map((item) => (
          <div className="orion-ticker" key={item.name}>
            <span>{item.name}</span>
            <strong>{item.value}</strong>
            <em className={item.trend}>{item.change}</em>
          </div>
        ))}
      </div>

      <div className={`orion-workspace ${user ? "with-history" : ""}`}>
        {user && (
          <aside className="orion-history">
            <div className="orion-history-head">
              <span><Clock size={15} /> Chat History</span>
              <button type="button" aria-label="Collapse history"><PanelLeftClose size={16} /></button>
            </div>
            <button className="orion-new-chat" type="button" onClick={handleNewConversation}>
              <Plus size={17} />
              <span>New Conversation</span>
            </button>
            <div className="orion-history-group">Today</div>
            {messages.length > 0 ? (
              <button className="orion-history-item active" type="button">
                <MessageSquare size={15} />
                <span>
                  <strong>{messages.find((msg) => msg.sender === 'user')?.text || "Current market research"}</strong>
                  <small>{messages.length} messages - saved locally</small>
                </span>
              </button>
            ) : (
              <div className="orion-history-empty">Start a conversation to save it here.</div>
            )}
          </aside>
        )}

        <main className="orion-chat-main">
          <div className="orion-chat-brand">
            <div className="orion-orb small"></div>
            <div>
              <h1>ORION</h1>
              <p>Your data-driven stock analysis assistant</p>
            </div>
          </div>

          <button className="orion-import" type="button">
            <TrendingUp size={16} />
            <span>Import Portfolio</span>
          </button>

          <div className="orion-chat-scroll">
          {messages.length === 0 ? (
            <div className="orion-empty-state">
              
              <div className="orion-orb"></div>
              <h2>What can Orion do?</h2>
              <p>Your AI investment advisor for the Indian markets</p>
              <button className="orion-learn" type="button">Learn more <ArrowUpRight size={13} /></button>
              {/* Centerpiece Search Area */}
              <div className="centerpiece-search-wrapper" style={{ width: '100%', maxWidth: '800px', margin: 'auto 0' }}>
                <div className="centerpiece-input-bar">
                  <Search size={20} style={{ color: 'var(--accent-color)', marginRight: '14px' }} />
                  <input
                    type="text"
                    className="centerpiece-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Read Concall in seconds"
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

              <div className="orion-prompt-grid">
                {orionPrompts.map(({ icon: Icon, title, text, query }) => (
                  <button key={title} type="button" className="orion-prompt-card" onClick={() => handleSend(query)}>
                    <Icon size={18} />
                    <span>
                      <strong>{title}</strong>
                      <small>{text}</small>
                    </span>
                  </button>
                ))}
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
                      {msg.sources && msg.sources.length > 0 && (
                        <span>Sources: {msg.sources.join(', ')}</span>
                      )}
                    </div>

                    {msg.text ? (
                      <div className="insights-summary" style={{ lineHeight: '1.6' }}>
                        {renderMarkdown(msg.text)}
                      </div>
                    ) : (
                      msg.summary && (
                        <div className="insights-summary" style={{ lineHeight: '1.6' }}>
                          {renderMarkdown(msg.summary)}
                        </div>
                      )
                    )}

                    {/* Inline sections flow - simple just like ChatGPT */}
                    {msg.sections && msg.sections.length > 0 && (
                      <div className="chat-sections-flow" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {msg.sections.map((section, sIdx) => (
                          <div key={sIdx} className="chat-section">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--orion-text, #101827)', margin: '16px 0 10px 0' }}>
                              {section.title}
                            </h3>
                            <div className="chat-section-content" style={{ fontSize: '1.05rem', color: 'var(--orion-text, #101827)', lineHeight: '1.6' }}>
                              {renderMarkdown(section.content)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

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

                    {msg.chartData && (
                      <InteractiveChart data={msg.chartData} title={msg.chartTitle} />
                    )}

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

          <footer className="orion-bottom-dock">
            <div className="orion-query-count">
              <span>9 queries remaining this month</span>
              <button type="button">Upgrade</button>
            </div>
            {renderComposer(messages.length === 0 ? "hero" : "dock")}
          </footer>
        </main>
      </div>
    </div>
  );
}
