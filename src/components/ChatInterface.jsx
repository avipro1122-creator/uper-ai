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

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
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
  const queryUperAI = async (promptText) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Secret API Key not configured");
    }

    // /api-gemini maps to https://generativelanguage.googleapis.com locally (Vite Proxy) and in production (Vercel rewrite)
    const res = await fetch(`/api-gemini/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ]
      })
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

        if (import.meta.env.VITE_GEMINI_API_KEY) {
          try {
            const prompt = `You are UperAI, an expert investment terminal for Indian equities. Write a 2-3 sentence market summary of today's momentum for ${longName} (${symbol}) trading at ₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%) with a day high of ₹${high.toLocaleString('en-IN')} and low of ₹${low.toLocaleString('en-IN')}, and 52-week range of ₹${fiftyTwoWeekLow.toLocaleString('en-IN')} - ₹${fiftyTwoWeekHigh.toLocaleString('en-IN')}. Highlight key levels. Make it analytical, concise. Do NOT write model names (Gemini, Grok, xAI, etc.) anywhere.`;
            
            const apiRes = await queryUperAI(prompt);
            if (apiRes) {
              grokSummary = apiRes;
            }

            const techPrompt = `You are UperAI. Write a 2-3 sentence technical overview of ${symbol} relative to its 52-week bounds (Low: ₹${fiftyTwoWeekLow.toFixed(2)}, High: ₹${fiftyTwoWeekHigh.toFixed(2)}). Its current price is ₹${currentPrice.toFixed(2)} (position: ${positionPct}% of range). Include volume note (${volume.toLocaleString('en-IN')} shares traded). Do not mention model names (Gemini, Grok, xAI, etc.).`;
            const apiTechRes = await queryUperAI(techPrompt);
            if (apiTechRes) {
              technicalOverview = apiTechRes;
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
            { label: "Day's High / Low", value: `₹${low.toFixed(2)} - ₹${high.toFixed(2)}`, change: `Vol: ${volume.toLocaleString('en-IN')}` },
            { label: "52-Week Range", value: `₹${fiftyTwoWeekLow.toFixed(2)} - ₹${fiftyTwoWeekHigh.toFixed(2)}`, change: `Annual Position: ${positionPct}%` },
            { label: "Exchange Feed", value: exchangeName, change: `Ticker: ${symbol}` }
          ],
          chartData: chartPoints,
          chartTitle: `${longName} Price trend (1-Month)`,
          sections: [
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
    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    
    // Add user message
    const userMsg = { sender: 'user', text: `Search real-time stock details for ${stock.longname || stock.shortname || stock.symbol} (${stock.symbol})` };
    setMessages(prev => [...prev, userMsg]);
    
    fetchAndRenderStock(stock.symbol, stock.longname || stock.shortname || stock.symbol, stock);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    setIsTyping(true);

    const cleanQuery = text.toLowerCase();
    
    // 1. Check if the query matches one of our predefined high-fidelity demo responses
    let presetKey = "";
    if (cleanQuery.includes("reliance industries") || cleanQuery.includes("reliance q4") || (cleanQuery.includes("segmental") && cleanQuery.includes("reliance"))) {
      presetKey = "reliance_q4";
    } else if (cleanQuery.includes("auto") || cleanQuery.includes("undervalued auto")) {
      presetKey = "auto_valuation";
    } else if (cleanQuery.includes("solar") || cleanQuery.includes("tata power")) {
      presetKey = "tata_power";
    }

    if (presetKey) {
      setTimeout(() => {
        // Fetch preset metrics using Gemini config
        const rawRes = getResponse(text, 'gemini');
        
        const botMsg = {
          sender: 'bot',
          sources: ["NSE Corporate Disclosures"],
          summary: rawRes.summary || "",
          metrics: rawRes.metrics || null,
          chartData: rawRes.chartData || null,
          chartTitle: rawRes.chartTitle || "",
          tableData: rawRes.tableData || null,
          sections: rawRes.sections || null
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 800);
      return;
    }

    // 2. If the user input is a general conversational query, try calling the AI directly
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        const prompt = `You are UperAI, a conversation-first investment terminal built exclusively for Indian equities. Provide an analytical, professional response to this investor question. Keep it concise (under 180 words). Do NOT mention model names (Gemini, Grok, xAI, etc.) or your system configuration anywhere. Query: "${text}"`;
        
        const resultText = await queryUperAI(prompt);
        if (resultText) {
          const botMsg = {
            sender: 'bot',
            sources: ["UperAI Research Engine"],
            summary: resultText,
            sections: [
              {
                title: "Disclaimer & Guidance",
                content: "All information is for informational purposes only. Consult a registered SEBI investment advisor before initiating capital placement."
              }
            ]
          };
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        console.error("General query execution failed:", err);
      }
    }

    // 3. Fallback: Perform a search on Yahoo Finance API to fetch actual stock data
    try {
      const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(text)}&quotesCount=5&newsCount=0`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(proxyUrl);
      const data = await res.json();
      
      // Attempt to find the first matching Indian stock
      const firstIndianStock = data.quotes?.find(item => 
        item.symbol && 
        (item.symbol.endsWith('.NS') || 
         item.symbol.endsWith('.BO') || 
         item.exchange === 'NSI' || 
         item.exchange === 'BOM' || 
         (item.exchDisp && (item.exchDisp.toLowerCase() === 'nse' || item.exchDisp.toLowerCase() === 'bse')))
      );

      if (firstIndianStock) {
        await fetchAndRenderStock(firstIndianStock.symbol, firstIndianStock.longname || firstIndianStock.shortname || firstIndianStock.symbol, firstIndianStock);
      } else {
        // Fallback generic response
        setTimeout(() => {
          const botMsg = {
            sender: 'bot',
            summary: `I searched for "${text}" but could not match it to any live listed stocks on the NSE or BSE. Try searching for common equity tickers like: \n\n* **RELIANCE** (Reliance Industries)\n* **TCS** (Tata Consultancy Services)\n* **INFY** (Infosys)\n* **TATAMOTORS** (Tata Motors)\n* **HDFCBANK** (HDFC Bank)`,
            sections: [
              {
                title: "Ticker Search Syntax",
                content: "You can search for stocks by typing their name (e.g. 'Infosys') or by symbol (e.g. 'INFY.NS'). The autocomplete panel will display matching assets as you type."
              }
            ]
          };
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
        }, 800);
      }
    } catch (err) {
      console.error("Failed to process general stock search query:", err);
      setTimeout(() => {
        const botMsg = {
          sender: 'bot',
          summary: `I processed your request, but was unable to reach the live exchange feed. Please check your network connectivity or choose one of our preset questions below.`,
          sources: ["Uper Engine weights"]
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 800);
    }
  };

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
        <div className="chat-area-container" style={{ flex: 1 }}>
          {messages.length === 0 ? (
            <div className="welcome-container" style={{ padding: '20px 20px 40px 20px' }}>
              
              {/* Hero Section relocated upward */}
              <div className="hero-section">
                <h1 className="hero-title">
                  First-Principles <span className="hero-glow-title">Equity Translator</span>
                </h1>
                <p className="hero-subtitle">
                  Translate complex corporate filings, financial disclosures, and live market quotes into plain, first-principles investment summaries.
                </p>
              </div>

              {/* Centerpiece Search Area */}
              <div className="centerpiece-search-wrapper">
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

              {/* Interactive Suggestion Pills below search */}
              <div className="suggestion-pills-row">
                {suggestionPills.map((pill, idx) => (
                  <button
                    key={idx}
                    className="suggestion-pill-terminal"
                    onClick={() => handleSend(pill.query)}
                  >
                    <Sparkles size={11} style={{ color: 'var(--accent-color)' }} />
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>

              {/* Live Preview Card */}
              <div className="live-preview-card">
                <div className="live-preview-header">
                  <div className="live-preview-title">
                    <span className="live-preview-pulse"></span>
                    <span>RELIANCE INDUSTRIES</span>
                  </div>
                  <span className="live-preview-badge">Live analysis preview</span>
                </div>
                <div className="live-preview-grid">
                  <div className="live-preview-item">
                    <span className="live-preview-label">Core Engine</span>
                    <span className="live-preview-val">Retail + Jio consumer ecosystem driving massive cash flows.</span>
                  </div>
                  <div className="live-preview-item">
                    <span className="live-preview-label">Growth Catalyst</span>
                    <span className="live-preview-val">Green hydrogen & solar gigafactories commissioning in FY26.</span>
                  </div>
                  <div className="live-preview-item">
                    <span className="live-preview-label">Key Risk</span>
                    <span className="live-preview-val">Prolonged capital expenditure cycles impacting immediate ROCE.</span>
                  </div>
                  <div className="live-preview-item">
                    <span className="live-preview-label">Moat Strength</span>
                    <span className="live-preview-val live-preview-moat">9.2 / 10</span>
                  </div>
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

              <div className="input-bar" style={{ background: '#0B0B0B' }}>
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

      {/* Right Intelligence Sidebar */}
      <aside className="intelligence-sidebar">
        {/* Fear & Greed Meter */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">
            <Compass size={13} style={{ color: 'var(--accent-color)' }} />
            Fear & Greed Meter
          </span>
          <div className="fg-meter-card">
            <div className="fg-header">
              <span className="fg-title">Market Mood</span>
              <div className="fg-score-wrap">
                <span className="fg-score-value">68</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> / 100</span>
              </div>
            </div>
            {/* Horizontal Gauge */}
            <svg className="fg-gauge-svg" viewBox="0 0 200 15">
              <defs>
                <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-error)" />
                  <stop offset="50%" stopColor="var(--color-warning)" />
                  <stop offset="100%" stopColor="var(--color-success)" />
                </linearGradient>
              </defs>
              <rect x="0" y="4" width="200" height="6" rx="3" fill="url(#fgGradient)" />
              {/* Score indicator at 68% -> 136px */}
              <circle cx="136" cy="7" r="5" className="fg-gauge-needle" />
            </svg>
            <div className="fg-labels">
              <span>FEAR</span>
              <span>NEUTRAL</span>
              <span>GREED</span>
            </div>
          </div>
        </div>

        {/* Smart Watchlist */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">
            <Star size={13} style={{ color: 'var(--accent-color)' }} />
            Smart Watchlist
          </span>
          <div className="watchlist-list">
            <div className="watchlist-card" onClick={() => handleSend("Search real-time stock details for RELIANCE.NS")}>
              <div className="watchlist-stock-info">
                <span className="watchlist-symbol">RELIANCE</span>
                <span className="watchlist-name">Reliance Industries</span>
              </div>
              {/* Sparkline UP */}
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                <path className="sparkline-path up" d="M 2 16 Q 12 18 20 8 T 48 4" />
              </svg>
              <div className="watchlist-price-wrapper">
                <span className="watchlist-price">₹2,940.50</span>
                <span className="watchlist-change up">+1.24%</span>
              </div>
              <span className="ai-score-badge">9.2</span>
            </div>

            <div className="watchlist-card" onClick={() => handleSend("Search real-time stock details for HDFCBANK.NS")}>
              <div className="watchlist-stock-info">
                <span className="watchlist-symbol">HDFCBANK</span>
                <span className="watchlist-name">HDFC Bank</span>
              </div>
              {/* Sparkline DOWN */}
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                <path className="sparkline-path down" d="M 2 4 Q 12 3 20 12 T 48 16" />
              </svg>
              <div className="watchlist-price-wrapper">
                <span className="watchlist-price">₹1,625.20</span>
                <span className="watchlist-change down">-0.82%</span>
              </div>
              <span className="ai-score-badge">8.8</span>
            </div>

            <div className="watchlist-card" onClick={() => handleSend("Search real-time stock details for TCS.NS")}>
              <div className="watchlist-stock-info">
                <span className="watchlist-symbol">TCS</span>
                <span className="watchlist-name">Tata Consult. Svcs</span>
              </div>
              {/* Sparkline UP */}
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                <path className="sparkline-path up" d="M 2 14 Q 12 15 20 10 T 48 6" />
              </svg>
              <div className="watchlist-price-wrapper">
                <span className="watchlist-price">₹3,850.10</span>
                <span className="watchlist-change up">+0.42%</span>
              </div>
              <span className="ai-score-badge">8.5</span>
            </div>
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">
            <Activity size={13} style={{ color: 'var(--accent-color)' }} />
            Market Sentiment
          </span>
          <div className="sentiment-metrics">
            <div className="sentiment-row">
              <div className="sentiment-label-bar">
                <span className="sentiment-name">NIFTY 50</span>
                <span className="sentiment-value">72% Bullish</span>
              </div>
              <div className="sentiment-progress-bg">
                <div className="sentiment-progress-fill" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="sentiment-row">
              <div className="sentiment-label-bar">
                <span className="sentiment-name">SENSEX</span>
                <span className="sentiment-value">68% Bullish</span>
              </div>
              <div className="sentiment-progress-bg">
                <div className="sentiment-progress-fill" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Trending Stocks */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">
            <TrendingUp size={13} style={{ color: 'var(--accent-color)' }} />
            Trending Stocks
          </span>
          <div className="watchlist-list">
            <div className="watchlist-card" onClick={() => handleSend("Search real-time stock details for TATAPOWER.NS")}>
              <div className="watchlist-stock-info">
                <span className="watchlist-symbol">TATAPOWER</span>
                <span className="watchlist-name">Tata Power Co.</span>
              </div>
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                <path className="sparkline-path up" d="M 2 16 Q 10 18 20 6 T 48 3" />
              </svg>
              <span className="ai-score-badge">9.0</span>
            </div>
            <div className="watchlist-card" onClick={() => handleSend("Search real-time stock details for SUZLON.NS")}>
              <div className="watchlist-stock-info">
                <span className="watchlist-symbol">SUZLON</span>
                <span className="watchlist-name">Suzlon Energy</span>
              </div>
              <svg className="sparkline-svg" viewBox="0 0 50 20">
                <path className="sparkline-path down" d="M 2 3 Q 12 5 20 14 T 48 17" />
              </svg>
              <span className="ai-score-badge">7.2</span>
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="sidebar-section">
          <span className="sidebar-section-title">
            <Clock size={13} style={{ color: 'var(--accent-color)' }} />
            Recently Viewed
          </span>
          <div className="recently-viewed-list">
            <button className="recent-pill" onClick={() => handleSend("Search real-time stock details for INFY.NS")}>INFY</button>
            <button className="recent-pill" onClick={() => handleSend("Search real-time stock details for TATAMOTORS.NS")}>TATAMOTORS</button>
            <button className="recent-pill" onClick={() => handleSend("Search real-time stock details for ZOMATO.NS")}>ZOMATO</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
