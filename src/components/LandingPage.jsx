import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, ArrowRight, Sparkles, TrendingUp, Compass, 
  FileText, Database, Layers, Award, Zap, Terminal, Gauge, Cpu, 
  Menu, X, Check, Shield, BarChart3, HelpCircle, Users, BookOpen,
  RefreshCw, LogOut
} from 'lucide-react';
import ChatInterface from './ChatInterface';
import { findLocalStock } from './ChatInterface';

export default function LandingPage({ user, onStartSearch, onNavigateToView, onRequireLogin, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat transition states
  const [showChat, setShowChat] = useState(false);
  const [initialQuery, setInitialQuery] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Stats state from API
  const [stats, setStats] = useState({ totalCompanies: null, documentsIndexed: null, aiReportsGenerated: null });
  const [loadingStats, setLoadingStats] = useState(true);

  // Market indices states
  const [marketOpen, setMarketOpen] = useState(false);
  const [nifty, setNifty] = useState({ value: 23530.15, change: 98.45, changePct: 0.42, tickDir: '' });
  const [sensex, setSensex] = useState({ value: 77215.40, change: 292.10, changePct: 0.38, tickDir: '' });
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for smooth scroll
  const statsRef = useRef(null);
  const whyRef = useRef(null);
  const pricingRef = useRef(null);
  const heroRef = useRef(null);

  // Billing period state for pricing
  const [billingPeriod, setBillingPeriod] = useState('yearly');

  const scrollToSection = (elementRef) => {
    setMobileMenuOpen(false);
    elementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Indian Standard Time converter
  const getCurrentIST = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
  };

  const checkIndianMarketStatus = () => {
    const ist = getCurrentIST();
    const day = ist.getDay();
    if (day === 0 || day === 6) return false; // Weekend
    
    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    const timeVal = hours * 60 + minutes;
    const startVal = 9 * 60 + 15; // 09:15 AM
    const endVal = 15 * 60 + 30; // 03:30 PM
    
    return timeVal >= startVal && timeVal <= endVal;
  };

  // Format current IST timestamp
  const formatISTTime = () => {
    const ist = getCurrentIST();
    return ist.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST';
  };

  // Fetch dynamic stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const updateIndices = async () => {
    try {
      const res = await fetch(`/api/market-indices?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMarketOpen(data.marketOpen);
          setLastUpdated(data.lastUpdated);

          setNifty(prev => {
            const tickDir = data.nifty.value > prev.value ? 'up' : data.nifty.value < prev.value ? 'down' : '';
            return {
              value: data.nifty.value,
              change: data.nifty.change,
              changePct: data.nifty.changePct,
              tickDir
            };
          });

          setSensex(prev => {
            const tickDir = data.sensex.value > prev.value ? 'up' : data.sensex.value < prev.value ? 'down' : '';
            return {
              value: data.sensex.value,
              change: data.sensex.change,
              changePct: data.sensex.changePct,
              tickDir
            };
          });
        }
      }
    } catch (err) {
      console.error("Failed to load live market indices:", err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const startTime = Date.now();
    await updateIndices();
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, 800 - elapsedTime);
    setTimeout(() => {
      setIsRefreshing(false);
    }, remainingTime);
  };

  // Poll live market indices
  useEffect(() => {
    // Initial update
    updateIndices();

    // Poll every 10 seconds
    const interval = setInterval(updateIndices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Clear tick classes after flash animations
  useEffect(() => {
    if (nifty.tickDir) {
      const timer = setTimeout(() => setNifty(p => ({ ...p, tickDir: '' })), 800);
      return () => clearTimeout(timer);
    }
  }, [nifty.value]);

  useEffect(() => {
    if (sensex.tickDir) {
      const timer = setTimeout(() => setSensex(p => ({ ...p, tickDir: '' })), 800);
      return () => clearTimeout(timer);
    }
  }, [sensex.value]);

  // Debounced search logic for autocomplete
  useEffect(() => {
    if (searchValue.trim().length < 2) {
      setAutocompleteResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchAutocompleteResults(searchValue);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  const fetchAutocompleteResults = async (query) => {
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

      const targetUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
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
        console.error("Yahoo search failed during landing page autocomplete:", e);
      }

      const combined = [...localResults];
      yahooStocks.forEach(item => {
        const cleanYahooSymbol = item.symbol.replace('.NS', '').replace('.BO', '');
        if (!combined.some(c => c.symbol.replace('.NS', '').replace('.BO', '') === cleanYahooSymbol)) {
          combined.push(item);
        }
      });

      setAutocompleteResults(combined.slice(0, 5));
      setShowDropdown(combined.length > 0);
    } catch (err) {
      console.error("Landing page autocomplete error:", err);
    }
  };

  const handleSearchSubmit = () => {
    if (!searchValue.trim()) return;
    setInitialQuery(searchValue);
    setShowChat(true);
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleSelectStock = (stock) => {
    const symbol = stock.symbol.replace('.NS', '').replace('.BO', '');
    const queryStr = `Search real-time stock details for ${stock.longname || stock.shortname} (${symbol})`;
    setInitialQuery(queryStr);
    setShowChat(true);
    setShowDropdown(false);
    setSearchValue('');
  };

  const triggerQuickSearch = (query) => {
    let queryStr = query;
    const localMap = {
      "Reliance": "Search real-time stock details for Reliance Industries Limited (RELIANCE)",
      "TCS": "Search real-time stock details for Tata Consultancy Services limited (TCS)",
      "Tata Power": "Search real-time stock details for Tata Power Company Ltd. (TATAPOWER)",
      "Titan": "Search real-time stock details for Titan Company Ltd (TITAN)"
    };
    queryStr = localMap[query] || query;
    setInitialQuery(queryStr);
    setShowChat(true);
  };

  return (
    <div className="landing-scroll-container">
      {/* Sticky Header */}
      <header className="sticky-header">
        <div className="header-inner">
          <div className="header-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-badge">
              <Activity size={18} />
            </div>
            <div>
              <span className="logo-text">UPER<span className="teal-text">AI</span></span>
              <span className="logo-sub">Equity Intelligence</span>
            </div>
          </div>

          <nav className="desktop-nav">
            <button onClick={() => scrollToSection(heroRef)} className="nav-link-btn">Ask Pro</button>
            <button onClick={() => scrollToSection(statsRef)} className="nav-link-btn">Discovery</button>
            <button onClick={() => scrollToSection(pricingRef)} className="nav-link-btn">Pricing</button>
          </nav>

          <div className="header-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} 
                  alt={user.name} 
                  className="nav-user-avatar" 
                  title={user.name} 
                />
                <button 
                  onClick={onLogout} 
                  className="btn-logout-nav"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogOut size={12} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => onNavigateToView('auth')} className="btn-signin-nav">Sign In</button>
              </div>
            )}
            
            {/* Mobile Hamburger toggle */}
            <button 
              className="mobile-hamburger" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <button onClick={() => scrollToSection(heroRef)} className="mobile-drawer-link">Ask Pro</button>
            <button onClick={() => scrollToSection(statsRef)} className="mobile-drawer-link">Discovery</button>
            <button onClick={() => scrollToSection(pricingRef)} className="mobile-drawer-link">Pricing</button>
            <div className="mobile-drawer-divider" />
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 16px 16px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <img 
                    src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} 
                    alt={user.name} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-subtle)' }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => onNavigateToView('auth')} className="btn-signin-nav mobile-drawer-btn">
                  Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="hero-landing-section">
        <div className="hero-landing-content">
          <div className="hero-glow-radial" />
          
          <div className="badge-wrapper animate-fade-in">
            <span className="premium-badge">
              <Sparkles size={12} className="sparkle-icon" />
              Next-Gen Financial Translation Engine
            </span>
          </div>

          <h1 className="hero-main-title animate-fade-in">
            Understand Earnings <br/>
            <span className="gradient-teal-text">Calls in Seconds</span>
          </h1>

          <p className="hero-description animate-fade-in">
            AI that converts complex earnings calls and financial reports into simple, actionable insights for Indian investors.
          </p>

          {!showChat ? (
            <div className="search-hero-container animate-fade-in">
              <div className="search-bar-wrapper">
                <Search className="search-bar-icon" size={20} />
                <input
                  type="text"
                  className="search-bar-input"
                  placeholder="Read Concall in seconds"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <span className="enter-badge">
                  <span className="enter-arrow">↵</span> Enter
                </span>
                <button className="search-bar-btn" onClick={handleSearchSubmit}>
                  Translate <ArrowUpRight size={16} className="translate-arrow" />
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && autocompleteResults.length > 0 && (
                <div className="search-autocomplete-dropdown glass-card">
                  {autocompleteResults.map((stock) => (
                    <div 
                      key={stock.symbol} 
                      className="autocomplete-item"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <span className="stock-symbol">{stock.symbol.replace('.NS', '').replace('.BO', '')}</span>
                      <span className="stock-name">{stock.longname || stock.shortname}</span>
                      <ArrowUpRight size={14} className="stock-arrow" />
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestion pills under the search bar */}
              <div className="search-suggestions">
                <span className="suggestion-label">Try searching:</span>
                <button onClick={() => triggerQuickSearch("Reliance")} className="suggestion-pill">Reliance</button>
                <button onClick={() => triggerQuickSearch("TCS")} className="suggestion-pill">TCS</button>
                <button onClick={() => triggerQuickSearch("Tata Power")} className="suggestion-pill">Tata Power</button>
                <button onClick={() => triggerQuickSearch("Titan")} className="suggestion-pill">Titan</button>
              </div>
            </div>
          ) : (
            <div className="chat-terminal-wrapper animate-fade-in">
              <div className="chat-terminal-header">
                <button className="btn-back-search" onClick={() => setShowChat(false)}>
                  ← Back to Search
                </button>
                <span className="terminal-title">UPERAI AI Research Terminal</span>
              </div>
              <div className="hero-chat-box-container" style={{
                width: '100%',
                maxWidth: '1050px',
                height: '620px',
                borderRadius: '12px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(11, 18, 37, 0.45)',
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
                boxShadow: 'var(--card-shadow), 0 0 30px rgba(0, 201, 167, 0.05)',
                textAlign: 'left'
              }}>
                <ChatInterface 
                  user={user} 
                  onRequireLogin={onRequireLogin}
                  initialQuery={initialQuery}
                  onClearInitialQuery={() => setInitialQuery(null)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Market Statistics Section */}
      <section ref={statsRef} className="stats-landing-section">
        <div className="section-header">
          <span className="section-subtitle">Real-time Dashboard</span>
          <h2 className="section-title">Live Market Ticker</h2>
          <p className="section-desc">
            Automatically tracks Indian market metrics. Updated live every 5 seconds during trading hours (Mon–Fri, 9:15 AM – 3:30 PM IST).
          </p>
        </div>

        <div className="stats-grid">
          {/* Card 1: Market Status */}
          <div className="stats-card glass-card">
            <div className="stats-card-header">
              <span className="stats-card-title">📈 Market Status</span>
              <span className={`market-status-dot ${marketOpen ? 'open' : 'closed'}`} />
            </div>
            <div className="stats-card-body">
              <span className={`market-status-text ${marketOpen ? 'open' : 'closed'}`}>
                {marketOpen ? 'Trading Open' : 'Market Closed'}
              </span>
              <span className="stats-card-subtext">NSE / BSE India</span>
            </div>
          </div>

          {/* Card 2: Nifty 50 */}
          <div 
            className={`stats-card glass-card ticker-card ${nifty.tickDir === 'up' ? 'flash-up' : nifty.tickDir === 'down' ? 'flash-down' : ''}`}
            onClick={() => window.open('https://www.nseindia.com/market-data/live-equity-market', '_blank')}
            style={{ cursor: 'pointer' }}
            title="Click to view Nifty 50 live page"
          >
            <div className="stats-card-header">
              <span className="stats-card-title">📊 NIFTY 50</span>
              <span className={`ticker-indicator-pill ${nifty.change >= 0 ? 'up' : 'down'}`}>
                {nifty.change >= 0 ? '+' : ''}{nifty.changePct}%
              </span>
            </div>
            <div className="stats-card-body">
              <span className="ticker-value">₹{nifty.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="ticker-change-val">
                {nifty.change >= 0 ? '▲' : '▼'} {Math.abs(nifty.change).toFixed(2)} pts
              </span>
            </div>
          </div>

          {/* Card 3: BSE Sensex */}
          <div 
            className={`stats-card glass-card ticker-card ${sensex.tickDir === 'up' ? 'flash-up' : sensex.tickDir === 'down' ? 'flash-down' : ''}`}
            onClick={() => window.open('https://www.bseindia.com/sensex/code/16', '_blank')}
            style={{ cursor: 'pointer' }}
            title="Click to view BSE Sensex live page"
          >
            <div className="stats-card-header">
              <span className="stats-card-title">📊 BSE SENSEX</span>
              <span className={`ticker-indicator-pill ${sensex.change >= 0 ? 'up' : 'down'}`}>
                {sensex.change >= 0 ? '+' : ''}{sensex.changePct}%
              </span>
            </div>
            <div className="stats-card-body">
              <span className="ticker-value">₹{sensex.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="ticker-change-val">
                {sensex.change >= 0 ? '▲' : '▼'} {Math.abs(sensex.change).toFixed(2)} pts
              </span>
            </div>
          </div>

          {/* Card 4: Companies Covered */}
          <div className="stats-card glass-card">
            <div className="stats-card-header">
              <span className="stats-card-title">🏢 Companies Covered</span>
              <Users size={16} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="stats-card-body">
              {loadingStats ? (
                <div className="skeleton-text" style={{ width: '90px', height: '24px', margin: '4px 0' }} />
              ) : (
                <span className="stats-big-number">{stats.totalCompanies}</span>
              )}
              <span className="stats-card-subtext">Active corporate profiles</span>
            </div>
          </div>

          {/* Card 5: Documents Indexed */}
          <div className="stats-card glass-card">
            <div className="stats-card-header">
              <span className="stats-card-title">📄 Documents Indexed</span>
              <BookOpen size={16} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="stats-card-body">
              {loadingStats ? (
                <div className="skeleton-text" style={{ width: '130px', height: '24px', margin: '4px 0' }} />
              ) : (
                <span className="stats-big-number">{stats.documentsIndexed?.toLocaleString()}</span>
              )}
              <span className="stats-card-subtext">SEBI files & transcripts</span>
            </div>
          </div>

          {/* Card 6: AI Reports Generated */}
          <div className="stats-card glass-card">
            <div className="stats-card-header">
              <span className="stats-card-title">🤖 AI Reports Generated</span>
              <Cpu size={16} style={{ color: 'var(--accent-color)' }} />
            </div>
            <div className="stats-card-body">
              {loadingStats ? (
                <div className="skeleton-text" style={{ width: '100px', height: '24px', margin: '4px 0' }} />
              ) : (
                <span className="stats-big-number">{stats.aiReportsGenerated?.toLocaleString()}</span>
              )}
              <span className="stats-card-subtext">Analyst summaries outputted</span>
            </div>
          </div>
        </div>

        <div className="stats-footer-note">
          <div className="live-pulse" />
          <span>Last Updated: <strong style={{ color: 'var(--text-primary)' }}>{lastUpdated || 'Loading...'}</strong></span>
          <button 
            onClick={handleManualRefresh}
            className="refresh-btn"
            disabled={isRefreshing}
            title="Refresh indices"
          >
            <RefreshCw size={12} className={isRefreshing ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>



      {/* Why UperAI Section */}
      <section ref={whyRef} className="why-landing-section">
        <div className="section-header">
          <span className="section-subtitle">Platform Comparison</span>
          <h2 className="section-title">Why choose UperAI?</h2>
          <p className="section-desc">
            A head-to-head comparison demonstrating our small language model advantage for domestic equity markets.
          </p>
        </div>

        <div className="why-comparison-container glass-card">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature/Attribute</th>
                <th className="highlight-column">UperAI Platform</th>
                <th>Standard Chatbots (GPT/Claude)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="attribute-name">Indian Currency Notation</td>
                <td className="highlight-cell"><Check size={16} /> Lakhs/Crores aware (trained natively)</td>
                <td>❌ Confused by lakhs/crores; forces millions/billions</td>
              </tr>
              <tr>
                <td className="attribute-name">Regulatory Compliance</td>
                <td className="highlight-cell"><Check size={16} /> Real-time SEBI, MCA, & Ind-AS mapping</td>
                <td>❌ Generic global accounting norms only</td>
              </tr>
              <tr>
                <td className="attribute-name">Data Freshness</td>
                <td className="highlight-cell"><Check size={16} /> Live indexed exchange files & news feeds</td>
                <td>❌ Restricted to static web crawls & older knowledge</td>
              </tr>
              <tr>
                <td className="attribute-name">Financial Reasoning Speed</td>
                <td className="highlight-cell"><Check size={16} /> Custom 4.8B SLM latency (&lt;65ms)</td>
                <td>❌ Multi-second inference times over API</td>
              </tr>
              <tr>
                <td className="attribute-name">Structured Dashboards</td>
                <td className="highlight-cell"><Check size={16} /> Interactive chart renders & ratios tables</td>
                <td>❌ Plain-text text outputs or generic markdown only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>


      {/* Pricing Section */}
      <section ref={pricingRef} className="pricing-landing-section">
        <div className="section-header">
          <span className="section-subtitle">Flexible Plans</span>
          <h2 className="section-title animate-fade-in">Get the AI Advantage,<br/><span className="gradient-teal-text">Become a Pro Investor</span></h2>
          
          <div className="pricing-billing-toggle animate-fade-in">
            <button 
              className={`toggle-tab ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`toggle-tab ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly <span className="discount-badge">Save 40%</span>
            </button>
          </div>
        </div>

        <div className="pricing-grid animate-fade-in">
          {/* Card 1: Premium */}
          <div className="pricing-card glass-card">
            <div className="card-header">
              <span className="plan-name">Premium</span>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">{billingPeriod === 'yearly' ? '599' : '999'}</span>
                <span className="period">/mo</span>
              </div>
              {billingPeriod === 'yearly' && <span className="billing-annually-note">Billed annually</span>}
            </div>
            <p className="plan-desc">Ideal for active investors who prefer data-driven research before picking stocks.</p>
            <ul className="plan-features">
              <li><Check size={14} className="feature-check" /> 20 AI Research Queries / day</li>
              <li><Check size={14} className="feature-check" /> Standard SLM Analysis</li>
              <li><Check size={14} className="feature-check" /> Corporate Disclosures & News</li>
              <li><Check size={14} className="feature-check" /> Community Support</li>
            </ul>
            <button className="btn-plan-select" onClick={onRequireLogin}>Get Started</button>
          </div>

          {/* Card 2: Professional (Best Seller) */}
          <div className="pricing-card glass-card best-seller">
            <div className="best-seller-badge">Best Seller</div>
            <div className="card-header">
              <span className="plan-name">Professional</span>
              <div className="plan-price">
                <span className="currency">₹</span>
                <span className="amount">{billingPeriod === 'yearly' ? '1,499' : '2,499'}</span>
                <span className="period">/mo</span>
              </div>
              {billingPeriod === 'yearly' && <span className="billing-annually-note">Billed annually</span>}
            </div>
            <p className="plan-desc">Ideal for pro investors who require deep historical data and upgraded AI capabilities.</p>
            <ul className="plan-features">
              <li><Check size={14} className="feature-check" /> Unlimited AI Research Queries</li>
              <li><Check size={14} className="feature-check" /> Deep Historical Concall Scans</li>
              <li><Check size={14} className="feature-check" /> Advanced Valuation Models</li>
              <li><Check size={14} className="feature-check" /> Export PDF Reports</li>
              <li><Check size={14} className="feature-check" /> Priority AI Inference Speed</li>
            </ul>
            <button className="btn-plan-select btn-featured" onClick={onRequireLogin}>Become a Pro</button>
          </div>

          {/* Card 3: Enterprise */}
          <div className="pricing-card glass-card">
            <div className="card-header">
              <span className="plan-name">Enterprise</span>
              <div className="plan-price">
                <span className="amount">Custom</span>
              </div>
              <span className="billing-annually-note">Tailored solutions</span>
            </div>
            <p className="plan-desc">Ideal for research teams and institutions requiring custom data, API integrations, and higher limits.</p>
            <ul className="plan-features">
              <li><Check size={14} className="feature-check" /> Custom Data Integrations</li>
              <li><Check size={14} className="feature-check" /> Dedicated API Endpoints</li>
              <li><Check size={14} className="feature-check" /> Higher Concurrency & Limits</li>
              <li><Check size={14} className="feature-check" /> Custom SLM Fine-tuning</li>
              <li><Check size={14} className="feature-check" /> 24/7 Account Manager</li>
            </ul>
            <button className="btn-plan-select" onClick={() => alert("Contact sales at sales@uperai.in")}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">UPER<span className="teal-text">AI</span></span>
            <p>Next-Generation Equity Intelligence Platform. Built for Retail Investors and Financial Professionals in India.</p>
            <span className="copyright-text">© {new Date().getFullYear()} UperAI. All rights reserved.</span>
          </div>

          <div className="footer-links-grid">
            <div className="footer-link-group">
              <h4>Platform</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(statsRef); }}>Market Stats</a>
            </div>

            <div className="footer-link-group">
              <h4>Legal & Info</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("UperAI is an AI-powered financial translation tool. Not financial or SEBI investment advice."); }}>About Platform</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: All conversations are encrypted and cached locally."); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Platform is provided as-is."); }}>Terms & Conditions</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Contact support at support@uperai.in"); }}>Contact Support</a>
            </div>

            <div className="footer-link-group">
              <h4>Connect</h4>
              <a href="https://github.com/avipro1122-creator/uper-ai" target="_blank" rel="noreferrer">GitHub Repo</a>
              <a href="https://www.linkedin.com/in/avanish-rai-proshot/" target="_blank" rel="noreferrer">LinkedIn Page</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter / X</a>
            </div>
          </div>
        </div>
        
        <div className="footer-disclaimer">
          <strong>Disclaimer:</strong> Financial investments are subject to market risks. All AI responses, analytics, and metrics generated by UperAI are for educational and analysis assistance purposes only. Please consult a SEBI registered investment advisor before executing trades.
        </div>
      </footer>
    </div>
  );
}
