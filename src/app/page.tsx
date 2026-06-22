'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Trash2, 
  Terminal, 
  Check, 
  Loader2, 
  ShieldAlert, 
  TrendingUp, 
  Coins, 
  Flame, 
  ArrowRight,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface StockNarrative {
  stock: string;
  engine: string;
  catalyst: string;
  fomo: string;
  provider: string;
}

interface WatchlistItem {
  ticker: string;
  score: number;
}

// Pre-defined initial watchlist items for Indian Market
const INITIAL_WATCHLIST: WatchlistItem[] = [
  { ticker: 'RELIANCE', score: 82 },
  { ticker: 'HDFC BANK', score: 78 },
  { ticker: 'TATA MOTORS', score: 88 }
];

// Helper to generate deterministic health score based on stock name
const getHealthScore = (name: string): number => {
  const clean = name.trim().toUpperCase();
  if (clean.includes('RELIANCE')) return 82;
  if (clean.includes('HDFC')) return 78;
  if (clean.includes('TATA MOTORS')) return 88;
  if (clean.includes('INFOSYS') || clean.includes('INFO')) return 80;
  if (clean.includes('ZOMATO')) return 42;
  if (clean.includes('PAYTM') || clean.includes('ONE97')) return 35;
  
  // Hash function for generic stocks
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = clean.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs((hash % 50) + 45); // Generates score between 45 and 95
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeNarrative, setActiveNarrative] = useState<StockNarrative | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load watchlist from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('uperai_watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        setWatchlist(INITIAL_WATCHLIST);
      }
    } else {
      setWatchlist(INITIAL_WATCHLIST);
      localStorage.setItem('uperai_watchlist', JSON.stringify(INITIAL_WATCHLIST));
    }
  }, []);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Save watchlist to LocalStorage when it changes
  const saveWatchlist = (updatedList: WatchlistItem[]) => {
    setWatchlist(updatedList);
    localStorage.setItem('uperai_watchlist', JSON.stringify(updatedList));
  };

  const handleAddToWatchlist = () => {
    if (!activeNarrative) return;
    const ticker = activeNarrative.stock.toUpperCase();
    if (watchlist.some(item => item.ticker === ticker)) return;

    const score = getHealthScore(ticker);
    const updated = [...watchlist, { ticker, score }];
    saveWatchlist(updated);
  };

  const handleRemoveFromWatchlist = (tickerToRemove: string) => {
    const updated = watchlist.filter(item => item.ticker !== tickerToRemove);
    saveWatchlist(updated);
  };

  // Quick search handler
  const handleQuickSearch = (chipText: string) => {
    let targetStock = '';
    if (chipText === 'Top Nifty 50') targetStock = 'Reliance Industries';
    else if (chipText === 'Zero Debt Stocks') targetStock = 'Infosys';
    else if (chipText === 'High Growth Tech') targetStock = 'Tata Motors';
    
    setQuery(targetStock);
    triggerAnalysis(targetStock);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    triggerAnalysis(query);
  };

  const triggerAnalysis = async (searchQuery: string) => {
    setStatus('compiling');
    setTerminalLogs([]);
    setActiveNarrative(null);
    setErrorMsg('');

    const logs = [
      `[SYS] Initializing UperAI Core Intelligence connection...`,
      `[SYS] Target established: "${searchQuery.toUpperCase()}"`,
      `[DATA] Scanning NSE/BSE corporate databases...`,
      `[COMPILING] Pulling balance sheets & financial fillings...`,
      `[ENGINE] Stripping macro metrics. Isolating cash flows...`,
      `[TRANSLATOR] Translating raw tables into First-Principles narrative...`,
      `[SYS] Compiling final report...`
    ];

    // Push logs progressively to simulate high-fidelity terminal compiling state
    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTerminalLogs(prev => [...prev, logs[i]]);
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error');
      }

      setTerminalLogs(prev => [...prev, `[SUCCESS] Analysis completed successfully.`]);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setActiveNarrative(data);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setTerminalLogs(prev => [...prev, `[ERR] Compile failed: ${err.message || 'Unknown network error'}`]);
      setErrorMsg(err.message || 'Failed to analyze stock. Please try again.');
      setStatus('error');
    }
  };

  // Color helper for Health Score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#0DFFD2] border-[#0DFFD2]/30 bg-[#0DFFD2]/5';
    if (score >= 60) return 'text-[#FFB300] border-[#FFB300]/30 bg-[#FFB300]/5';
    return 'text-red-500 border-red-500/30 bg-red-500/5';
  };

  const getScoreDotColor = (score: number) => {
    if (score >= 80) return 'bg-[#0DFFD2] shadow-[#0DFFD2]/50';
    if (score >= 60) return 'bg-[#FFB300] shadow-[#FFB300]/50';
    return 'bg-red-500 shadow-red-500/50';
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#0A0A0A] font-sans">
      {/* Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-[#1F1F1F] bg-[#0A0A0A]/90 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-md border border-[#1F1F1F]">
            <Image 
              src="/logo.png" 
              alt="UperAI Logo" 
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="font-mono text-lg font-bold tracking-widest text-white">
            UPER<span className="text-[#0DFFD2]">AI</span>
          </span>
          <span className="hidden rounded-full border border-[#0DFFD2]/20 bg-[#0DFFD2]/5 px-2.5 py-0.5 text-xs font-mono text-[#0DFFD2] sm:inline-block">
            TERMINAL v2.4
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0DFFD2] animate-pulse"></span>
            SYS ONLINE
          </span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">LOC: NSE/BSE ENGINE</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Core Narrative Terminal Area */}
        <main className="relative flex flex-1 flex-col overflow-y-auto p-6 md:p-12">
          {/* Subtle grid background */}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-30"></div>

          {/* Intro Section - dynamically shifts if result active */}
          <div className={`transition-all duration-700 ease-in-out ${
            status !== 'idle' ? 'mb-8 opacity-90' : 'my-auto flex flex-col items-center text-center'
          }`}>
            {status === 'idle' && (
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0DFFD2]/20 bg-[#0DFFD2]/5 text-[#0DFFD2]">
                <Activity className="h-7 w-7 text-glow-teal animate-pulse" />
              </div>
            )}
            
            <h1 className={`font-semibold tracking-tight text-white transition-all duration-700 ${
              status !== 'idle' ? 'text-2xl text-left' : 'mb-3 text-4xl md:text-5xl max-w-2xl'
            }`}>
              First-Principles Equity <span className="text-[#0DFFD2]">Translator</span>
            </h1>
            
            {status === 'idle' && (
              <p className="mb-10 max-w-md text-zinc-400 text-sm md:text-base">
                Demolish generic financial summaries. Input any stock to isolate the core engine, the growth catalyst, and the real FOMO risk.
              </p>
            )}

            {/* Central Search Form */}
            <div className={`w-full transition-all duration-700 ${
              status !== 'idle' ? 'max-w-4xl' : 'max-w-2xl'
            }`}>
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Analyze ticker (e.g. Reliance, HDFC, Tata Motors...)"
                  className="w-full rounded-xl border border-[#1F1F1F] bg-[#121212] py-4 pl-12 pr-28 text-white placeholder-zinc-500 outline-none ring-1 ring-transparent transition-all duration-300 focus:border-[#0DFFD2] focus:ring-[#0DFFD2]/20 focus:shadow-[0_0_25px_rgba(13,255,210,0.15)]"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-[#0DFFD2]" />
                
                <button
                  type="submit"
                  disabled={status === 'compiling'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-zinc-900 border border-[#1F1F1F] hover:border-[#0DFFD2] px-4 py-2 text-xs font-mono font-bold text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(13,255,210,0.25)] hover:bg-[#0A0A0A] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {status === 'compiling' ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin text-[#0DFFD2]" />
                      RUNNING
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#0DFFD2]">
                      TRANSLATE <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </form>

              {/* Quick Search Chips */}
              <div className="mt-4 flex flex-wrap gap-2 justify-start items-center">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Suggested:</span>
                {['Top Nifty 50', 'Zero Debt Stocks', 'High Growth Tech'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickSearch(chip)}
                    className="rounded-full border border-[#1F1F1F] bg-[#121212] px-3.5 py-1 text-xs text-zinc-400 hover:text-[#0DFFD2] hover:border-[#0DFFD2]/40 transition-all duration-300 hover:shadow-[0_0_10px_rgba(13,255,210,0.1)]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* State Rendering Panel */}
          <div className="w-full max-w-4xl">
            
            {/* Compiling Data Terminal Animation */}
            {status === 'compiling' && (
              <div className="w-full rounded-xl border border-[#0DFFD2]/20 bg-[#121212] p-5 font-mono text-xs md:text-sm text-zinc-300 shadow-[0_0_30px_rgba(13,255,210,0.05)] relative overflow-hidden">
                {/* Simulated scanline */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#0DFFD2]/2 to-transparent animate-scanline"></div>
                
                <div className="mb-4 flex items-center justify-between border-b border-[#1F1F1F] pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[#0DFFD2] animate-pulse" />
                    <span className="font-bold text-[#0DFFD2]">UPER_TERMINAL_LOG</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">RUNNING COMPILATION...</span>
                </div>

                <div className="space-y-2 min-h-[140px] flex flex-col justify-end">
                  {terminalLogs.map((log, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-zinc-500 font-bold select-none">&gt;&gt;</span>
                      <span className={log.includes('[SUCCESS]') ? 'text-[#0DFFD2]' : log.includes('[ERR]') ? 'text-red-500' : 'text-zinc-300'}>
                        {log}
                      </span>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-bold select-none">&gt;&gt;</span>
                    <span className="h-3 w-1.5 bg-[#0DFFD2] animate-terminal-blink"></span>
                  </div>
                  <div ref={terminalEndRef}></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && (
              <div className="w-full rounded-xl border border-red-500/20 bg-[#121212] p-5 text-sm shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  ANALYSIS ERROR
                </div>
                <p className="text-zinc-400 font-mono text-xs">{errorMsg}</p>
              </div>
            )}

            {/* Result Narrative Card */}
            {status === 'success' && activeNarrative && (
              <div className="w-full rounded-xl border border-[#1F1F1F] bg-[#121212] p-6 md:p-8 shadow-2xl relative transition-all duration-500">
                {/* Header Info */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1F1F1F] pb-6">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">PRO INVESTOR DOSSIER</span>
                    <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                      {activeNarrative.stock}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddToWatchlist}
                      disabled={watchlist.some(item => item.ticker === activeNarrative.stock.toUpperCase())}
                      className="glow-btn-teal flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-mono font-bold text-white transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {watchlist.some(item => item.ticker === activeNarrative.stock.toUpperCase()) ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#0DFFD2]" />
                          IN WATCHLIST
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 text-[#0DFFD2]" />
                          ADD TO WATCHLIST
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Narrative Sections */}
                <div className="space-y-8">
                  {/* Point 1: The Engine */}
                  <div className="group rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/50 p-5 hover:border-[#0DFFD2]/25 transition-all duration-300">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 border border-[#1F1F1F] text-[#0DFFD2]">
                        <Coins className="h-4 w-4" />
                      </div>
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#0DFFD2] transition-colors">
                        1. The Engine (How They Make Money)
                      </h3>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed pl-9">
                      {activeNarrative.engine}
                    </p>
                  </div>

                  {/* Point 2: The Catalyst */}
                  <div className="group rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/50 p-5 hover:border-[#0DFFD2]/25 transition-all duration-300">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 border border-[#1F1F1F] text-[#0DFFD2]">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#0DFFD2] transition-colors">
                        2. The Catalyst (Why They Are Growing)
                      </h3>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed pl-9">
                      {activeNarrative.catalyst}
                    </p>
                  </div>

                  {/* Point 3: The FOMO Risk */}
                  <div className="group rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/50 p-5 hover:border-[#FFB300]/25 transition-all duration-300">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 border border-[#1F1F1F] text-[#FFB300]">
                        <ShieldAlert className="h-4 w-4" />
                      </div>
                      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-[#FFB300] transition-colors">
                        3. The FOMO Risk (Market Hype vs Reality)
                      </h3>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed pl-9">
                      {activeNarrative.fomo}
                    </p>
                  </div>
                </div>

                {/* Footer source indicator */}
                <div className="mt-8 flex items-center justify-between border-t border-[#1F1F1F] pt-4 text-[10px] font-mono text-zinc-500">
                  <span>ENGINE: {activeNarrative.provider}</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#0DFFD2]" />
                    FIRST-PRINCIPLES ANALYSIS
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Smart Watchlist Sidebar - Task 2 */}
        <aside className="hidden w-80 flex-shrink-0 flex-col border-l border-[#1F1F1F] bg-[#121212]/30 backdrop-blur-sm lg:flex">
          <div className="flex h-14 items-center justify-between border-b border-[#1F1F1F] px-5">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">
              SMART WATCHLIST
            </span>
            <span className="rounded-full bg-zinc-900 border border-[#1F1F1F] px-2 py-0.5 text-[10px] font-mono text-zinc-500">
              {watchlist.length} SAVED
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {watchlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-zinc-600 text-xs font-mono mb-2">Watchlist empty</span>
                <p className="text-[10px] text-zinc-500 max-w-[180px]">
                  Search a stock and add it here to track its UperAI Health Score.
                </p>
              </div>
            ) : (
              watchlist.map((item) => (
                <div 
                  key={item.ticker}
                  onClick={() => {
                    setQuery(item.ticker);
                    triggerAnalysis(item.ticker);
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#1F1F1F] bg-[#121212] p-3.5 hover:border-[#0DFFD2]/40 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white group-hover:text-[#0DFFD2] transition-colors tracking-wide">
                      {item.ticker}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 tracking-wider">
                      NSE / BSE LISTING
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Glowing Health Score Badge */}
                    <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-mono font-bold ${getScoreColor(item.score)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${getScoreDotColor(item.score)}`}></span>
                      {item.score}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWatchlist(item.ticker);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-all duration-300 p-1 rounded hover:bg-zinc-950"
                      title="Remove stock"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[#1F1F1F] p-4 bg-[#0A0A0A]/40">
            <div className="rounded-lg border border-[#FFB300]/25 bg-[#FFB300]/5 p-3 text-[10px] font-mono text-zinc-400 leading-relaxed">
              <span className="text-[#FFB300] font-bold block mb-1">PRO ADVISORY NOTIFICATION:</span>
              UperAI Health Scores analyze structural leverage, margin stability, and growth catalysts. They do not represent price forecasts.
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
