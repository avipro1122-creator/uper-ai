import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Star, 
  Download, 
  Copy, 
  Share2, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Sparkles,
  FileText,
  DollarSign,
  Briefcase,
  PieChart,
  Quote,
  ShieldAlert
} from 'lucide-react';

export default function ConcallTerminal({ user, onRequireLogin }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  
  // History & Bookmarks (persisted in localStorage)
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('concall_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('concall_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Report Section Accordion state
  const [openSections, setOpenSections] = useState({
    summary: true,
    commentary: false,
    guidance: false
  });

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const dropdownRef = useRef(null);

  // Auto-fetch default stock (Reliance) on first load if no stock selected
  useEffect(() => {
    if (!selectedStock && !analysisData) {
      handleSelectStock({
        'nse-code': 'RELIANCE',
        name: 'Reliance Industries Ltd.',
        'bse-code': '500325'
      });
    }
  }, []);

  // Save history & bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('concall_search_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('concall_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Click outside listener for search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Autocomplete Fetcher
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/concall/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setSearchResults(json.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Error fetching search autocomplete:', err);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Perform Concall analysis fetch
  const fetchAnalysis = async (stock) => {
    setLoading(true);
    setError(null);
    try {
      const symbol = stock['nse-code'] || stock['bse-code'] || stock.symbol;
      const name = stock.name;
      
      const res = await fetch(`/api/concall/analyze?symbol=${encodeURIComponent(symbol)}&name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const json = await res.json();
      if (json.success && json.data) {
        setAnalysisData(json.data);
        
        // Add to search history (avoid duplicates, keep top 8)
        setSearchHistory(prev => {
          const filtered = prev.filter(h => (h['nse-code'] || h.symbol) !== symbol);
          return [stock, ...filtered].slice(0, 8);
        });
      } else {
        throw new Error('Analysis failed or returned empty data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate concall analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    fetchAnalysis(stock);
  };

  // Bookmark toggler
  const toggleBookmark = () => {
    if (!selectedStock) return;
    const symbol = selectedStock['nse-code'] || selectedStock['bse-code'] || selectedStock.symbol;
    
    const isBookmarked = bookmarks.some(b => (b['nse-code'] || b.symbol) === symbol);
    if (isBookmarked) {
      setBookmarks(prev => prev.filter(b => (b['nse-code'] || b.symbol) !== symbol));
    } else {
      setBookmarks(prev => [...prev, selectedStock]);
    }
  };

  const isCurrentBookmarked = selectedStock && bookmarks.some(b => 
    (b['nse-code'] || b.symbol) === (selectedStock['nse-code'] || selectedStock['bse-code'] || selectedStock.symbol)
  );

  // Export functions
  const copyToClipboard = () => {
    if (!analysisData) return;
    
    let textReport = `EQUITY RESEARCH REPORT: ${analysisData.companyName.toUpperCase()} (${analysisData.symbol})\n`;
    textReport += `${analysisData.quarter} ${analysisData.financialYear} Earnings Call Analysis\n`;
    textReport += `=========================================\n\n`;
    textReport += `AI Sentiment: ${analysisData.aiSentiment.classification} (Score: ${analysisData.aiSentiment.score}/100)\n\n`;
    
    textReport += `EXECUTIVE SUMMARY\n`;
    analysisData.executiveSummary.bullets.forEach(b => textReport += `- ${b}\n`);
    textReport += `\nSentiment Commentary:\n${analysisData.executiveSummary.overallSentiment}\n\n`;
    
    textReport += `QUARTERLY PERFORMANCE\n`;
    textReport += `- Revenue: ${analysisData.quarterlyPerformance.revenue}\n`;
    textReport += `- EBITDA: ${analysisData.quarterlyPerformance.ebitda}\n`;
    textReport += `- PAT: ${analysisData.quarterlyPerformance.pat}\n`;
    textReport += `- Margins: ${analysisData.quarterlyPerformance.margins}\n`;
    textReport += `- Volume Growth: ${analysisData.quarterlyPerformance.volumeGrowth}\n`;
    textReport += `- Segment Performance: ${analysisData.quarterlyPerformance.segmentPerformance}\n\n`;
    
    textReport += `MANAGEMENT COMMENTARY\n`;
    textReport += `Updates:\n`;
    analysisData.managementCommentary.businessUpdates.forEach(b => textReport += `- ${b}\n`);
    textReport += `Capacity Expansion:\n`;
    analysisData.managementCommentary.capacityExpansion.forEach(b => textReport += `- ${b}\n`);
    textReport += `Demand Trends:\n`;
    analysisData.managementCommentary.demandTrends.forEach(b => textReport += `- ${b}\n`);
    textReport += `Pricing:\n`;
    analysisData.managementCommentary.pricing.forEach(b => textReport += `- ${b}\n`);
    textReport += `Cost Pressures:\n`;
    analysisData.managementCommentary.costPressures.forEach(b => textReport += `- ${b}\n\n`);

    textReport += `FUTURE GUIDANCE\n`;
    textReport += `- Revenue Guidance: ${analysisData.futureGuidance.revenueGuidance}\n`;
    textReport += `- Margin Guidance: ${analysisData.futureGuidance.marginGuidance}\n`;
    textReport += `- Capex Plans: ${analysisData.futureGuidance.capexPlans}\n`;
    textReport += `- Growth Outlook: ${analysisData.futureGuidance.growthOutlook}\n`;
    textReport += `Risks:\n`;
    analysisData.futureGuidance.risksHighlighted.forEach(b => textReport += `- ${b}\n\n`);

    textReport += `BULLISH SIGNALS\n`;
    analysisData.bullishSignals.forEach(b => textReport += `- ${b}\n`);
    textReport += `\nBEARISH SIGNALS\n`;
    analysisData.bearishSignals.forEach(b => textReport += `- ${b}\n\n`);

    textReport += `RED FLAGS\n`;
    textReport += `- Weak Guidance: ${analysisData.redFlags.weakGuidance}\n`;
    textReport += `- Declining Margins: ${analysisData.redFlags.decliningMargins}\n`;
    textReport += `- Demand Slowdown: ${analysisData.redFlags.demandSlowdown}\n`;
    textReport += `- Customer Concentration: ${analysisData.redFlags.customerConcentration}\n`;
    textReport += `- Regulatory Risks: ${analysisData.redFlags.regulatoryRisks}\n`;
    textReport += `- Debt Concerns: ${analysisData.redFlags.debtConcerns}\n`;
    textReport += `- Governance Concerns: ${analysisData.redFlags.governanceConcerns}\n\n`;

    navigator.clipboard.writeText(textReport);
    alert('Analysis report copied to clipboard!');
  };

  const exportMarkdown = () => {
    if (!analysisData) return;
    
    let md = `# Equity Research Report: ${analysisData.companyName} (${analysisData.symbol})\n`;
    md += `**Quarter**: ${analysisData.quarter} ${analysisData.financialYear} | **Analysis Date**: ${analysisData.date}\n`;
    md += `**AI Sentiment**: ${analysisData.aiSentiment.classification} (${analysisData.aiSentiment.score}/100)\n\n`;
    
    md += `## Executive Summary\n`;
    analysisData.executiveSummary.bullets.forEach(b => md += `* ${b}\n`);
    md += `\n*Sentiment Summary*:\n${analysisData.executiveSummary.overallSentiment}\n\n`;
    
    md += `## Quarterly Performance\n`;
    md += `* **Revenue**: ${analysisData.quarterlyPerformance.revenue}\n`;
    md += `* **EBITDA**: ${analysisData.quarterlyPerformance.ebitda}\n`;
    md += `* **PAT**: ${analysisData.quarterlyPerformance.pat}\n`;
    md += `* **Margins**: ${analysisData.quarterlyPerformance.margins}\n`;
    md += `* **Volume Growth**: ${analysisData.quarterlyPerformance.volumeGrowth}\n`;
    md += `* **Segment Performance**: ${analysisData.quarterlyPerformance.segmentPerformance}\n\n`;

    md += `## Management Commentary\n`;
    md += `### Business Updates\n`;
    analysisData.managementCommentary.businessUpdates.forEach(b => md += `* ${b}\n`);
    md += `### Capacity Expansion\n`;
    analysisData.managementCommentary.capacityExpansion.forEach(b => md += `* ${b}\n`);
    md += `### Demand Trends\n`;
    analysisData.managementCommentary.demandTrends.forEach(b => md += `* ${b}\n`);
    md += `### Pricing & Cost Pressures\n`;
    analysisData.managementCommentary.pricing.forEach(b => md += `* **Pricing**: ${b}\n`);
    analysisData.managementCommentary.costPressures.forEach(b => md += `* **Costs**: ${b}\n\n`);

    md += `## Future Guidance\n`;
    md += `* **Revenue Guidance**: ${analysisData.futureGuidance.revenueGuidance}\n`;
    md += `* **Margin Guidance**: ${analysisData.futureGuidance.marginGuidance}\n`;
    md += `* **Capex Plans**: ${analysisData.futureGuidance.capexPlans}\n`;
    md += `* **Growth Outlook**: ${analysisData.futureGuidance.growthOutlook}\n`;
    md += `### Key Risks Indicated by Management\n`;
    analysisData.futureGuidance.risksHighlighted.forEach(b => md += `* ${b}\n\n`);

    md += `## Analyst Q&A\n`;
    analysisData.analystQA.questionsAndAnswers.forEach((qa, i) => {
      md += `**Q${i+1}: ${qa.question}**\n`;
      md += `*A: ${qa.answer}*\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Concall_Analysis_${analysisData.symbol}_${analysisData.quarter}_${analysisData.financialYear}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareAnalysis = () => {
    if (!analysisData) return;
    const shareUrl = `${window.location.origin}/concall?symbol=${analysisData.symbol}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Shareable report link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-bg-bloomberg-bg tw-text-bloomberg-text tw-font-sans tw-overflow-hidden">
      {/* Custom Global CSS styles for Print layout & Scrollbars */}
      <style>{`
        /* Custom scrollbar styling for terminal style */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #06080e;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #1b2336;
          border-radius: 3px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #00c9a7;
        }

        /* Print Specific Styles - Institutional Equity Report layout */
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
            overflow: visible !important;
            height: auto !important;
          }
          /* Hide interactive headers, navigation sidebar, search widgets and buttons */
          nav, aside, header, .no-print, button, .print-hidden {
            display: none !important;
          }
          /* Expand main container to fill paper */
          .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          /* Re-style headers for white paper print */
          h1, h2, h3, h4 {
            color: #0c0f17 !important;
            page-break-after: avoid;
          }
          .print-card {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            color: #000000 !important;
            box-shadow: none !important;
            margin-bottom: 1.5em !important;
            page-break-inside: avoid;
            padding: 12px !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: #000000 !important;
            padding: 8px !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Terminal Top Control Bar */}
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-justify-between tw-border-b tw-border-bloomberg-border tw-bg-[#080b12] tw-px-6 tw-py-4 tw-gap-4 print-hidden">
        {/* Branding & Lookup Title */}
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-bg-bloomberg-border tw-p-2 tw-rounded-lg tw-border tw-border-bloomberg-accent/20">
            <FileText size={18} className="tw-text-bloomberg-accent" />
          </div>
          <div>
            <h1 className="tw-font-display tw-font-bold tw-text-lg tw-text-white tw-tracking-wide">
              CONCALL <span className="tw-text-bloomberg-accent">AI</span>
            </h1>
            <span className="tw-text-[10px] tw-text-bloomberg-mutedText tw-font-semibold tw-tracking-widest tw-uppercase">
              NSE/BSE Corporate Earnings Analyzer
            </span>
          </div>
        </div>

        {/* Search Input Autocomplete Panel */}
        <div className="tw-relative tw-w-full md:tw-w-96" ref={dropdownRef}>
          <div className="tw-flex tw-items-center tw-bg-bloomberg-bg tw-border tw-border-bloomberg-border tw-rounded-lg tw-px-3 tw-py-2 tw-focus-within:tw-border-bloomberg-accent tw-transition-all">
            <Search size={16} className="tw-text-bloomberg-accent tw-mr-2" />
            <input
              type="text"
              placeholder="Search Company, NSE or BSE ticker..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(searchResults.length > 0)}
              className="tw-bg-transparent tw-w-full tw-text-white tw-text-sm tw-outline-none placeholder:tw-text-bloomberg-mutedText"
            />
            {query && (
              <button onClick={() => setQuery('')} className="tw-text-bloomberg-mutedText hover:tw-text-white tw-text-xs">
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="tw-absolute tw-left-0 tw-right-0 tw-mt-2 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-shadow-2xl tw-z-50 tw-max-h-60 tw-overflow-y-auto custom-scroll">
              <div className="tw-px-3 tw-py-2 tw-border-b tw-border-bloomberg-border tw-text-[10px] tw-text-bloomberg-mutedText tw-font-bold tw-tracking-wider">
                SEARCH RESULTS
              </div>
              {searchResults.map((stock, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectStock(stock)}
                  className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2.5 hover:tw-bg-bloomberg-border tw-text-left tw-transition-colors"
                >
                  <div>
                    <div className="tw-text-sm tw-font-semibold tw-text-white">{stock.name}</div>
                    <div className="tw-text-xs tw-text-bloomberg-mutedText">
                      NSE: <span className="tw-text-bloomberg-accent tw-font-mono">{stock['nse-code'] || 'N/A'}</span> | BSE: <span className="tw-font-mono">{stock['bse-code'] || 'N/A'}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="tw-text-bloomberg-mutedText" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="tw-flex tw-flex-1 tw-overflow-hidden">
        {/* Left Sidebar (Recent Searches & Bookmarks) - Hidden on mobile, print-hidden */}
        <aside className="tw-hidden lg:tw-flex tw-flex-col tw-w-64 tw-border-r tw-border-bloomberg-border tw-bg-[#090c13] tw-p-4 tw-gap-6 print-hidden">
          {/* Bookmarks Section */}
          <div>
            <h3 className="tw-text-xs tw-font-bold tw-text-white tw-tracking-widest tw-uppercase tw-mb-3 tw-flex tw-items-center tw-gap-2">
              <Star size={12} className="tw-text-bloomberg-yellow" />
              Bookmarked Companies
            </h3>
            {bookmarks.length === 0 ? (
              <p className="tw-text-xs tw-text-bloomberg-mutedText tw-italic tw-pl-2">
                No bookmarked companies yet. Bookmark your top tickers.
              </p>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-1">
                {bookmarks.map((stock, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStock(stock)}
                    className={`tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-rounded-md tw-text-xs tw-text-left tw-transition-all ${
                      selectedStock && (selectedStock['nse-code'] || selectedStock.symbol) === (stock['nse-code'] || stock.symbol)
                        ? 'tw-bg-bloomberg-border tw-text-white tw-font-semibold'
                        : 'hover:tw-bg-bloomberg-border/50 tw-text-bloomberg-mutedText hover:tw-text-white'
                    }`}
                  >
                    <span className="tw-truncate">{stock.name}</span>
                    <span className="tw-text-[9px] tw-font-mono tw-text-bloomberg-accent tw-bg-bloomberg-border/60 tw-px-1.5 tw-py-0.5 tw-rounded">
                      {stock['nse-code'] || stock.symbol}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches History Section */}
          <div>
            <h3 className="tw-text-xs tw-font-bold tw-text-white tw-tracking-widest tw-uppercase tw-mb-3 tw-flex tw-items-center tw-gap-2">
              <Clock size={12} className="tw-text-bloomberg-accent" />
              Search History
            </h3>
            {searchHistory.length === 0 ? (
              <p className="tw-text-xs tw-text-bloomberg-mutedText tw-italic tw-pl-2">
                No search history yet.
              </p>
            ) : (
              <div className="tw-flex tw-flex-col tw-gap-1">
                {searchHistory.map((stock, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStock(stock)}
                    className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-rounded-md tw-text-xs tw-text-left tw-text-bloomberg-mutedText hover:tw-text-white hover:tw-bg-bloomberg-border/40 tw-transition-all"
                  >
                    <span className="tw-truncate">{stock.name}</span>
                    <span className="tw-text-[9px] tw-font-mono tw-bg-bloomberg-border/40 tw-px-1.5 tw-py-0.5 tw-rounded">
                      {stock['nse-code'] || stock.symbol}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Workspace */}
        <div className="tw-flex-1 tw-flex tw-flex-col tw-overflow-y-auto custom-scroll print-area">
          {loading ? (
            /* Premium Skeleton Loading States */
            <div className="tw-p-8 tw-flex tw-flex-col tw-gap-6 tw-w-full print-hidden">
              <div className="tw-animate-pulse tw-flex tw-flex-col tw-gap-4">
                <div className="tw-h-8 tw-bg-bloomberg-border tw-rounded-md tw-w-1/3"></div>
                <div className="tw-h-4 tw-bg-bloomberg-border tw-rounded-md tw-w-1/4"></div>
              </div>
              
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
                <div className="tw-animate-pulse tw-h-24 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg"></div>
                <div className="tw-animate-pulse tw-h-24 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg"></div>
                <div className="tw-animate-pulse tw-h-24 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg"></div>
                <div className="tw-animate-pulse tw-h-24 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg"></div>
              </div>

              <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mt-4">
                <div className="tw-animate-pulse tw-h-96 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg lg:tw-col-span-1"></div>
                <div className="tw-animate-pulse tw-h-96 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg lg:tw-col-span-2"></div>
              </div>
            </div>
          ) : error ? (
            /* Error Display Component with Retry Button */
            <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-8 tw-text-center tw-gap-4">
              <div className="tw-bg-bloomberg-red/10 tw-p-4 tw-rounded-full tw-border tw-border-bloomberg-red/25">
                <AlertTriangle size={36} className="tw-text-bloomberg-red" />
              </div>
              <h2 className="tw-text-lg tw-font-bold tw-text-white">Analysis Request Failed</h2>
              <p className="tw-text-sm tw-text-bloomberg-mutedText tw-max-w-md">{error}</p>
              <button
                onClick={() => selectedStock && fetchAnalysis(selectedStock)}
                className="tw-flex tw-items-center tw-gap-2 tw-bg-bloomberg-accent tw-text-black tw-px-4 tw-py-2 tw-rounded-md tw-text-sm tw-font-bold hover:tw-bg-bloomberg-accent/80 tw-transition-colors"
              >
                <RefreshCw size={14} />
                <span>Retry Fetch</span>
              </button>
            </div>
          ) : analysisData ? (
            /* Rich Interactive Equity Report Terminal */
            <div className="tw-p-6 tw-flex tw-flex-col tw-gap-6">
              
              {/* Report Header Block */}
              <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-pb-6 tw-border-b tw-border-bloomberg-border tw-gap-4">
                <div>
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <h2 className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-white print-text-dark">
                      {analysisData.companyName}
                    </h2>
                    <button 
                      onClick={toggleBookmark}
                      className="tw-text-bloomberg-mutedText hover:tw-text-bloomberg-yellow tw-transition-colors print-hidden"
                      title={isCurrentBookmarked ? "Remove Bookmark" : "Bookmark Company"}
                    >
                      <Star size={18} fill={isCurrentBookmarked ? "var(--color-warning, #f59e0b)" : "none"} className={isCurrentBookmarked ? "tw-text-bloomberg-yellow" : ""} />
                    </button>
                  </div>
                  <div className="tw-text-xs tw-text-bloomberg-mutedText tw-mt-1 print-text-muted">
                    NSE Ticker: <span className="tw-font-mono tw-text-bloomberg-accent tw-font-semibold">{analysisData.symbol}</span> | 
                    Period: <span className="tw-font-semibold">{analysisData.quarter} {analysisData.financialYear}</span> | 
                    Published: <span className="tw-font-semibold">{analysisData.date}</span>
                    {analysisData.fallback && (
                      <span className="tw-ml-2 tw-text-bloomberg-yellow tw-bg-bloomberg-yellow/10 tw-border tw-border-bloomberg-yellow/20 tw-px-1.5 tw-py-0.5 tw-rounded tw-text-[9px]">
                        AI Synthesized Report
                      </span>
                    )}
                  </div>
                </div>

                {/* Toolbar Options */}
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 print-hidden">
                  <button 
                    onClick={copyToClipboard}
                    className="tw-flex tw-items-center tw-gap-1.5 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-text-xs tw-px-3 tw-py-1.5 tw-rounded tw-text-bloomberg-mutedText hover:tw-text-white hover:tw-border-bloomberg-mutedText tw-transition-colors"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                  <button 
                    onClick={exportMarkdown}
                    className="tw-flex tw-items-center tw-gap-1.5 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-text-xs tw-px-3 tw-py-1.5 tw-rounded tw-text-bloomberg-mutedText hover:tw-text-white hover:tw-border-bloomberg-mutedText tw-transition-colors"
                  >
                    <Download size={12} />
                    <span>Markdown</span>
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="tw-flex tw-items-center tw-gap-1.5 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-text-xs tw-px-3 tw-py-1.5 tw-rounded tw-text-bloomberg-mutedText hover:tw-text-white hover:tw-border-bloomberg-mutedText tw-transition-colors"
                  >
                    <Printer size={12} />
                    <span>Print/PDF</span>
                  </button>
                  <button 
                    onClick={shareAnalysis}
                    className="tw-flex tw-items-center tw-gap-1.5 tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-text-xs tw-px-3 tw-py-1.5 tw-rounded tw-text-bloomberg-mutedText hover:tw-text-white hover:tw-border-bloomberg-mutedText tw-transition-colors"
                  >
                    <Share2 size={12} />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Key Indicators Scorecards Grid */}
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
                
                {/* AI Sentiment Gauge Card */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-p-4 tw-flex tw-items-center tw-justify-between print-card">
                  <div>
                    <span className="tw-text-[10px] tw-text-bloomberg-mutedText tw-font-bold tw-tracking-wider tw-uppercase">
                      AI SENTIMENT SCORE
                    </span>
                    <div className="tw-text-2xl tw-font-bold tw-text-white tw-mt-1 tw-flex tw-items-baseline tw-gap-1.5 print-text-dark">
                      <span>{analysisData.aiSentiment.score}</span>
                      <span className="tw-text-xs tw-text-bloomberg-mutedText">/100</span>
                    </div>
                    <span className={`tw-text-xs tw-font-semibold tw-mt-1 tw-inline-block ${
                      analysisData.aiSentiment.classification.includes('Bullish') ? 'tw-text-bloomberg-accent' : 
                      analysisData.aiSentiment.classification.includes('Bearish') ? 'tw-text-bloomberg-red' : 'tw-text-bloomberg-yellow'
                    }`}>
                      {analysisData.aiSentiment.classification}
                    </span>
                  </div>
                  {/* Gauge Arc representation */}
                  <div className="tw-relative tw-w-16 tw-h-16 tw-flex tw-items-center tw-justify-center">
                    <svg className="tw-w-full tw-h-full tw-transform -tw-rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="#1b2336" strokeWidth="4" />
                      <circle 
                        cx="32" 
                        cy="32" 
                        r="28" 
                        fill="transparent" 
                        stroke={
                          analysisData.aiSentiment.classification.includes('Bullish') ? '#00c9a7' : 
                          analysisData.aiSentiment.classification.includes('Bearish') ? '#ef4444' : '#f59e0b'
                        } 
                        strokeWidth="4" 
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - analysisData.aiSentiment.score / 100)}
                      />
                    </svg>
                    <span className="tw-absolute tw-text-[10px] tw-font-mono tw-font-bold text-white">
                      {analysisData.aiSentiment.score}%
                    </span>
                  </div>
                </div>

                {/* Revenue Key Stat */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-p-4 print-card">
                  <span className="tw-text-[10px] tw-text-bloomberg-mutedText tw-font-bold tw-tracking-wider tw-uppercase tw-flex tw-items-center tw-gap-1">
                    <DollarSign size={10} className="tw-text-bloomberg-accent" />
                    REVENUE
                  </span>
                  <div className="tw-text-lg tw-font-bold tw-text-white tw-mt-1 print-text-dark">
                    {analysisData.keyNumbers.revenue || analysisData.quarterlyPerformance.revenue}
                  </div>
                  <div className="tw-text-xs tw-text-bloomberg-accent tw-mt-1 tw-flex tw-items-center tw-gap-1">
                    <TrendingUp size={12} />
                    <span>Quarterly Net</span>
                  </div>
                </div>

                {/* EBITDA & Margins */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-p-4 print-card">
                  <span className="tw-text-[10px] tw-text-bloomberg-mutedText tw-font-bold tw-tracking-wider tw-uppercase tw-flex tw-items-center tw-gap-1">
                    <PieChart size={10} className="tw-text-bloomberg-blue" />
                    EBITDA / MARGINS
                  </span>
                  <div className="tw-text-lg tw-font-bold tw-text-white tw-mt-1 print-text-dark">
                    {analysisData.keyNumbers.ebitda}
                  </div>
                  <div className="tw-text-xs tw-text-bloomberg-blue tw-mt-1">
                    Margin: {analysisData.keyNumbers.roce || 'Stable'}
                  </div>
                </div>

                {/* Order Book / Capex */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-p-4 print-card">
                  <span className="tw-text-[10px] tw-text-bloomberg-mutedText tw-font-bold tw-tracking-wider tw-uppercase tw-flex tw-items-center tw-gap-1">
                    <Briefcase size={10} className="tw-text-bloomberg-yellow" />
                    CAPEX / ORDER BOOK
                  </span>
                  <div className="tw-text-lg tw-font-bold tw-text-white tw-mt-1 print-text-dark">
                    {analysisData.keyNumbers.orderBook !== 'N/A' ? analysisData.keyNumbers.orderBook : `Capex: ${analysisData.keyNumbers.capex}`}
                  </div>
                  <div className="tw-text-xs tw-text-bloomberg-yellow tw-mt-1">
                    Volume Growth: {analysisData.keyNumbers.volumeGrowth}
                  </div>
                </div>

              </div>

              {/* Keywords sector tags */}
              <div className="tw-flex tw-flex-wrap tw-gap-2 print-hidden">
                {analysisData.keywords.map((tag, idx) => (
                  <span key={idx} className="tw-text-xs tw-bg-bloomberg-border/50 tw-text-bloomberg-mutedText tw-px-2.5 tw-py-1 tw-rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Report Main Content - Accordions Stacked in Front */}
              <div className="tw-w-full tw-flex tw-flex-col tw-gap-4">
                
                {/* Executive Summary Accordion */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-overflow-hidden print-card">
                  <button 
                    onClick={() => toggleSection('summary')}
                    className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-bg-bloomberg-border/20 tw-text-sm tw-font-bold tw-text-white tw-transition-colors hover:tw-bg-bloomberg-border/30 print-hidden"
                  >
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <FileText size={16} className="tw-text-bloomberg-accent" />
                      Executive Summary
                    </span>
                    {openSections.summary ? <ChevronRight size={16} className="tw-transform tw-rotate-90 tw-transition-transform" /> : <ChevronRight size={16} className="tw-transition-transform" />}
                  </button>
                  {/* Keep title visible for printing */}
                  <h3 className="tw-hidden print:tw-block tw-text-base tw-font-bold tw-text-slate-900 tw-px-5 tw-pt-4 tw-border-b tw-pb-2">
                    Executive Summary
                  </h3>
                  {openSections.summary && (
                    <div className="tw-p-5 tw-flex tw-flex-col tw-gap-4">
                      <ul className="tw-list-disc tw-pl-5 tw-flex tw-flex-col tw-gap-2">
                        {analysisData.executiveSummary.bullets.map((bullet, idx) => (
                          <li key={idx} className="tw-text-sm tw-leading-relaxed print-text-dark">{bullet}</li>
                        ))}
                      </ul>
                      <div className="tw-bg-[#0d121f] tw-p-4 tw-rounded-md tw-border-l-4 tw-border-bloomberg-accent tw-mt-4 print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-bloomberg-accent tw-uppercase tw-mb-2">
                          Overall Sentiment & Management Tone
                        </h4>
                        <p className="tw-text-xs tw-leading-relaxed tw-italic print-text-dark">
                          {analysisData.executiveSummary.overallSentiment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Management Commentary Accordion */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-overflow-hidden print-card">
                  <button 
                    onClick={() => toggleSection('commentary')}
                    className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-bg-bloomberg-border/20 tw-text-sm tw-font-bold tw-text-white tw-transition-colors hover:tw-bg-bloomberg-border/30 print-hidden"
                  >
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <Quote size={16} className="tw-text-bloomberg-accent" />
                      Management Commentary
                    </span>
                    {openSections.commentary ? <ChevronRight size={16} className="tw-transform tw-rotate-90 tw-transition-transform" /> : <ChevronRight size={16} className="tw-transition-transform" />}
                  </button>
                  <h3 className="tw-hidden print:tw-block tw-text-base tw-font-bold tw-text-slate-900 tw-px-5 tw-pt-4 tw-border-b tw-pb-2">
                    Management Commentary
                  </h3>
                  {openSections.commentary && (
                    <div className="tw-p-5 tw-flex tw-flex-col tw-gap-6">
                      {[
                        { label: 'Business Updates & Pivots', data: analysisData.managementCommentary.businessUpdates },
                        { label: 'Capacity Expansion & Execution', data: analysisData.managementCommentary.capacityExpansion },
                        { label: 'New Product Pipelines & R&D', data: analysisData.managementCommentary.newProducts },
                        { label: 'Demand Trends & Market Penetration', data: analysisData.managementCommentary.demandTrends },
                        { label: 'Pricing Power & Tariff Revisions', data: analysisData.managementCommentary.pricing },
                        { label: 'Input Cost Pressures & Logistics Constraints', data: analysisData.managementCommentary.costPressures }
                      ].map((sec, idx) => (
                        <div key={idx} className="tw-flex tw-flex-col tw-gap-2">
                          <h4 className="tw-text-xs tw-font-bold tw-text-white tw-uppercase print-text-dark">{sec.label}</h4>
                          <ul className="tw-list-disc tw-pl-5 tw-flex tw-flex-col tw-gap-1">
                            {sec.data.map((bullet, i) => (
                              <li key={i} className="tw-text-xs tw-leading-relaxed print-text-dark">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Important Quotes */}
                      <div className="tw-border-t tw-border-bloomberg-border tw-pt-4">
                        <h4 className="tw-text-xs tw-font-bold tw-text-bloomberg-accent tw-uppercase tw-mb-3">
                          Verbatim Management Quotes
                        </h4>
                        <div className="tw-flex tw-flex-col tw-gap-3">
                          {analysisData.importantQuotes.map((quote, idx) => (
                            <div key={idx} className="tw-bg-[#090d14] tw-border-l-2 tw-border-bloomberg-accent tw-p-3 tw-rounded-r-md tw-flex tw-items-start tw-gap-2.5 print-card">
                              <Quote size={14} className="tw-text-bloomberg-accent tw-shrink-0 tw-mt-0.5" />
                              <p className="tw-text-xs tw-leading-relaxed tw-italic print-text-dark">{quote}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Future Guidance Accordion */}
                <div className="tw-bg-bloomberg-card tw-border tw-border-bloomberg-border tw-rounded-lg tw-overflow-hidden print-card">
                  <button 
                    onClick={() => toggleSection('guidance')}
                    className="tw-w-full tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-bg-bloomberg-border/20 tw-text-sm tw-font-bold tw-text-white tw-transition-colors hover:tw-bg-bloomberg-border/30 print-hidden"
                  >
                    <span className="tw-flex tw-items-center tw-gap-2">
                      <Briefcase size={16} className="tw-text-bloomberg-accent" />
                      Future Guidance
                    </span>
                    {openSections.guidance ? <ChevronRight size={16} className="tw-transform tw-rotate-90 tw-transition-transform" /> : <ChevronRight size={16} className="tw-transition-transform" />}
                  </button>
                  <h3 className="tw-hidden print:tw-block tw-text-base tw-font-bold tw-text-slate-900 tw-px-5 tw-pt-4 tw-border-b tw-pb-2">
                    Future Guidance
                  </h3>
                  {openSections.guidance && (
                    <div className="tw-p-5 tw-flex tw-flex-col tw-gap-4">
                      <div className="tw-bg-bloomberg-bg/60 tw-border tw-border-bloomberg-border tw-p-4 tw-rounded-md print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-white tw-uppercase tw-mb-2 print-text-dark">Revenue Outlook</h4>
                        <p className="tw-text-xs tw-leading-relaxed print-text-dark">{analysisData.futureGuidance.revenueGuidance}</p>
                      </div>

                      <div className="tw-bg-bloomberg-bg/60 tw-border tw-border-bloomberg-border tw-p-4 tw-rounded-md print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-white tw-uppercase tw-mb-2 print-text-dark">Margin Trajectory</h4>
                        <p className="tw-text-xs tw-leading-relaxed print-text-dark">{analysisData.futureGuidance.marginGuidance}</p>
                      </div>

                      <div className="tw-bg-bloomberg-bg/60 tw-border tw-border-bloomberg-border tw-p-4 tw-rounded-md print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-white tw-uppercase tw-mb-2 print-text-dark">Capex Outlays</h4>
                        <p className="tw-text-xs tw-leading-relaxed print-text-dark">{analysisData.futureGuidance.capexPlans}</p>
                      </div>

                      <div className="tw-bg-bloomberg-bg/60 tw-border tw-border-bloomberg-border tw-p-4 tw-rounded-md print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-white tw-uppercase tw-mb-2 print-text-dark">Long-term Growth Outlook</h4>
                        <p className="tw-text-xs tw-leading-relaxed print-text-dark">{analysisData.futureGuidance.growthOutlook}</p>
                      </div>

                      <div className="tw-bg-bloomberg-red/5 tw-border tw-border-bloomberg-red/10 tw-p-4 tw-rounded-md print-card">
                        <h4 className="tw-text-xs tw-font-bold tw-text-bloomberg-red tw-uppercase tw-mb-2">
                          Core Execution Risks Indicated by Management
                        </h4>
                        <ul className="tw-list-disc tw-pl-5 tw-flex tw-flex-col tw-gap-1">
                          {analysisData.futureGuidance.risksHighlighted.map((risk, idx) => (
                            <li key={idx} className="tw-text-xs tw-leading-relaxed print-text-dark">{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            /* Selected Company Empty state */
            <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-8 tw-text-center tw-text-bloomberg-mutedText tw-gap-3">
              <Search size={36} className="tw-text-bloomberg-border" />
              <p className="tw-text-sm">Please search and select an Indian listed stock to begin the analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
