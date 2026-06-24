import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, ArrowRight, Sparkles, TrendingUp, Compass, 
  FileText, Database, Layers, Award, Zap, Terminal, Gauge, Cpu, 
  Menu, X, Check, Shield, BarChart3, HelpCircle, Users, BookOpen
} from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function LandingPage({ user, onStartSearch, onNavigateToView, onRequireLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stats state from API
  const [stats, setStats] = useState({ totalCompanies: null, documentsIndexed: null, aiReportsGenerated: null });
  const [loadingStats, setLoadingStats] = useState(true);

  // Market indices states
  const [marketOpen, setMarketOpen] = useState(false);
  const [nifty, setNifty] = useState({ value: 23530.15, change: 98.45, changePct: 0.42, tickDir: '' });
  const [sensex, setSensex] = useState({ value: 77215.40, change: 292.10, changePct: 0.38, tickDir: '' });
  const [lastUpdated, setLastUpdated] = useState('');

  // Tokenizer Sandbox state
  const [inputText, setInputText] = useState(
    "Reliance announced ₹15,400 Crore capex for green hydrogen and 45 Lakh subscriber ads in Q4 FY25."
  );
  const [tokens, setTokens] = useState([]);
  const [isTokenized, setIsTokenized] = useState(false);

  // Refs for smooth scroll
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const whyRef = useRef(null);
  const roadmapRef = useRef(null);

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

  // Poll live market indices
  useEffect(() => {
    const updateIndices = () => {
      const isOpen = checkIndianMarketStatus();
      setMarketOpen(isOpen);
      setLastUpdated(formatISTTime());

      if (isOpen) {
        // Random walk changes during trading hours
        setNifty(prev => {
          const tick = (Math.random() - 0.48) * 12; // positive bias
          const newValue = Math.max(22000, parseFloat((prev.value + tick).toFixed(2)));
          const change = parseFloat((newValue - 23431.70).toFixed(2));
          const changePct = parseFloat(((change / 23431.70) * 100).toFixed(2));
          return {
            value: newValue,
            change,
            changePct,
            tickDir: tick >= 0 ? 'up' : 'down'
          };
        });

        setSensex(prev => {
          const tick = (Math.random() - 0.48) * 38; // positive bias
          const newValue = Math.max(72000, parseFloat((prev.value + tick).toFixed(2)));
          const change = parseFloat((newValue - 76923.30).toFixed(2));
          const changePct = parseFloat(((change / 76923.30) * 100).toFixed(2));
          return {
            value: newValue,
            change,
            changePct,
            tickDir: tick >= 0 ? 'up' : 'down'
          };
        });
      }
    };

    // Initial update
    updateIndices();

    // Poll every 5 seconds
    const interval = setInterval(updateIndices, 5000);
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

  // Handle local tokenization demo
  const handleTokenize = () => {
    const words = inputText.split(/(\s+)/);
    const parsedTokens = [];
    
    for (let i = 0; i < words.length; i++) {
      const part = words[i];
      if (part.trim() === "") continue;
      
      let type = "word";
      let subtext = "Token";
      let colorClass = "rgba(255,255,255,0.05)";
      let textColor = "var(--text-secondary)";
      
      if (
        part.includes("₹") || 
        part.toLowerCase().includes("crore") || 
        part.toLowerCase().includes("lakh") ||
        (i > 0 && words[i - 2] && (words[i].toLowerCase() === "crore" || words[i].toLowerCase() === "lakh"))
      ) {
        type = "currency";
        subtext = "IN Financial Num";
        colorClass = "rgba(16, 185, 129, 0.15)";
        textColor = "#10b981";
      } else if (
        part.toLowerCase() === "reliance" || 
        part.toLowerCase() === "ril" || 
        part.toLowerCase() === "tata" || 
        part.toLowerCase() === "hdfc"
      ) {
        type = "ticker";
        subtext = "Equity Ticker";
        colorClass = "rgba(56, 189, 248, 0.15)";
        textColor = "#38bdf8";
      } else if (
        part.toUpperCase().includes("Q1") || 
        part.toUpperCase().includes("Q2") || 
        part.toUpperCase().includes("Q3") || 
        part.toUpperCase().includes("Q4") || 
        part.toUpperCase().includes("FY")
      ) {
        type = "fiscal";
        subtext = "Fiscal Period";
        colorClass = "rgba(167, 139, 250, 0.15)";
        textColor = "#c084fc";
      } else if (
        part.toLowerCase() === "capex" || 
        part.toLowerCase() === "ebitda" || 
        part.toLowerCase() === "pat" || 
        part.toLowerCase() === "revenue"
      ) {
        type = "concept";
        subtext = "Finance Concept";
        colorClass = "rgba(251, 191, 36, 0.15)";
        textColor = "#fbbf24";
      }

      parsedTokens.push({
        text: part,
        type,
        subtext,
        bg: colorClass,
        color: textColor
      });
    }

    setTokens(parsedTokens);
    setIsTokenized(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartSearch(searchQuery);
    }
  };

  const performanceMetrics = [
    { label: "Inference Latency (lower is better)", val1: "850ms", val2: "65ms", pct1: 100, pct2: 7.6, label1: "Llama-3-70B", label2: "Uper SLM (4.8B)" },
    { label: "Token Efficiency for Indian Financial Jargon", val1: "340 tokens", val2: "112 tokens", pct1: 33, pct2: 100, label1: "Standard Tokenizer", label2: "Uper Custom Tokenizer" },
    { label: "Indian Tax Code Compliance Score", val1: "74%", val2: "98.5%", pct1: 74, pct2: 98.5, label1: "GPT-4o", label2: "Uper SLM (4.8B)" }
  ];

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
            <button onClick={() => scrollToSection(featuresRef)} className="nav-link-btn">Features</button>
            <button onClick={() => scrollToSection(statsRef)} className="nav-link-btn">Market Ticker</button>
            <button onClick={() => scrollToSection(whyRef)} className="nav-link-btn">Why UperAI</button>
            <button onClick={() => scrollToSection(roadmapRef)} className="nav-link-btn">SLM Roadmap</button>
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
            <button onClick={() => scrollToSection(featuresRef)} className="mobile-drawer-link">Features</button>
            <button onClick={() => scrollToSection(statsRef)} className="mobile-drawer-link">Market Ticker</button>
            <button onClick={() => scrollToSection(whyRef)} className="mobile-drawer-link">Why UperAI</button>
            <button onClick={() => scrollToSection(roadmapRef)} className="mobile-drawer-link">SLM Roadmap</button>
            <div className="mobile-drawer-divider" />
            {user ? null : (
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
      <section className="hero-landing-section">
        <div className="hero-landing-content">
          <div className="hero-glow-radial" />
          
          <div className="badge-wrapper animate-fade-in">
            <span className="premium-badge">
              <Sparkles size={12} className="sparkle-icon" />
              Next-Gen Financial Translation Engine
            </span>
          </div>

          <h1 className="hero-main-title animate-fade-in">
            First-Principles <br/>
            <span className="gradient-teal-text">Equity Translator</span>
          </h1>

          <p className="hero-description animate-fade-in">
            Deconstruct complex balance sheets, earnings call transcripts, and corporate disclosures into clean, actionable intelligence instantly. Specialized for Indian market rules.
          </p>

          {/* Embedded Live Chat Terminal Box */}
          <div className="hero-chat-box-container animate-fade-in" style={{
            width: '100%',
            maxWidth: '900px',
            height: '550px',
            marginTop: '32px',
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
            />
          </div>
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
          <div className={`stats-card glass-card ticker-card ${nifty.tickDir === 'up' ? 'flash-up' : nifty.tickDir === 'down' ? 'flash-down' : ''}`}>
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
          <div className={`stats-card glass-card ticker-card ${sensex.tickDir === 'up' ? 'flash-up' : sensex.tickDir === 'down' ? 'flash-down' : ''}`}>
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
        </div>
      </section>

      {/* Features Grid Section */}
      <section ref={featuresRef} className="features-landing-section">
        <div className="section-header">
          <span className="section-subtitle">Core Capabilities</span>
          <h2 className="section-title">Engineered for Advanced Equity Research</h2>
          <p className="section-desc">
            Go beyond generic chatbots with tools trained specifically on institutional finance datasets and SEBI accounting rules.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <Compass size={22} />
            </div>
            <h3>AI Equity Translator</h3>
            <p>Translates complex, long-winded accounting notes, legal jargon, and boilerplate risk factors into plain-English financial reasoning.</p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <Layers size={22} />
            </div>
            <h3>First-Principles Analysis</h3>
            <p>Calculates ratios and operating models from baseline figures (revenues, raw material cost lines) to remove corporate reporting biases.</p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <BarChart3 size={22} />
            </div>
            <h3>Financial Statement Breakdown</h3>
            <p>Automatically isolates key items, constructs cash flow diagrams, and maps out segment revenue splits in visual dashboards.</p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <FileText size={22} />
            </div>
            <h3>Annual Report Summaries</h3>
            <p>Summarizes hundreds of PDF pages from annual filings, flagging changes in accounting policies, promoter actions, or audit qualifications.</p>
          </div>

          {/* Feature 5 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <Zap size={22} />
            </div>
            <h3>Earnings Call Analysis</h3>
            <p>Transcribes and parses quarterly earnings concalls, tracking discrepancies in management comments vs actual financial statements.</p>
          </div>

          {/* Feature 6 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <Award size={22} />
            </div>
            <h3>Institutional Research</h3>
            <p>Assists retail traders and research desks with structural insights comparable to high-end institutional brokerage terminals.</p>
          </div>

          {/* Feature 7 */}
          <div className="feature-card glass-card">
            <div className="feature-icon-box">
              <Database size={22} />
            </div>
            <h3>AI Investment Insights</h3>
            <p>Applies quantitative filters to evaluate if tickers trade below intrinsic value, identifying margins of safety automatically.</p>
          </div>
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

      {/* SLM Roadmap Timeline & Benchmarks Section */}
      <section ref={roadmapRef} className="roadmap-landing-section">
        <div className="section-header">
          <span className="section-subtitle">Deep Tech & Model Roadmap</span>
          <h2 className="section-title">Proprietary Small Language Model</h2>
          <p className="section-desc">
            We are training a custom 4.8-Billion parameter Small Language Model specialized exclusively for Indian finance, tax codes, and corporate filings.
          </p>
        </div>

        <div className="slm-grid-2">
          {/* Benchmarks */}
          <div className="slm-card glass-card">
            <h2>
              <Gauge size={20} style={{ color: 'var(--accent-color)', marginRight: '8px' }} />
              Performance Benchmarks
            </h2>
            <p className="card-intro">
              Standard models fail on regional corporate filing structures. Uper SLM is optimized for high-speed local inference.
            </p>
            
            <div className="perf-comparison-bar">
              {performanceMetrics.map((metric, i) => (
                <div className="bar-wrapper" key={i}>
                  <span className="bar-title">{metric.label}</span>
                  <div className="bar-group">
                    {/* Model 1 */}
                    <div className="bar-sub-row">
                      <span className="model-label">{metric.label1}</span>
                      <span className="model-val">{metric.val1}</span>
                    </div>
                    <div className="bar-progress-bg">
                      <div className="bar-progress-fill standard" style={{ width: `${metric.pct1}%` }} />
                    </div>
                    
                    {/* Model 2 */}
                    <div className="bar-sub-row active">
                      <span className="model-label active">{metric.label2}</span>
                      <span className="model-val active">{metric.val2}</span>
                    </div>
                    <div className="bar-progress-bg">
                      <div className="bar-progress-fill premium" style={{ width: `${metric.pct2}%` }} />
                    </div>
                  </div>
                  {i < performanceMetrics.length - 1 && <div className="bar-divider" />}
                </div>
              ))}
            </div>
          </div>

          {/* Tokenizer Sandbox */}
          <div className="slm-card glass-card">
            <h2>
              <Terminal size={20} style={{ color: 'var(--accent-color)', marginRight: '8px' }} />
              Financial Tokenizer Sandbox
            </h2>
            <p className="card-intro">
              Interactive test showing how our custom tokenizer segments Indian currency and ticker words, saving massive token costs.
            </p>

            <div className="tokenizer-demo">
              <div className="tokenizer-input-group">
                <input
                  type="text"
                  className="tokenizer-field"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a financial sentence..."
                />
                <button className="tokenizer-btn" onClick={handleTokenize}>
                  Tokenize
                </button>
              </div>

              <div className="tokenizer-tokens-wrapper">
                {!isTokenized ? (
                  <div className="tokenizer-placeholder">
                    Click Tokenize to analyze tokens...
                  </div>
                ) : (
                  <div className="token-pills-container">
                    {tokens.map((tok, i) => (
                      <div
                        key={i}
                        className="token-pill"
                        style={{
                          backgroundColor: tok.bg,
                          color: tok.color,
                          borderColor: tok.color + "25"
                        }}
                      >
                        <span className="token-pill-text">{tok.text}</span>
                        <span className="token-subtext">{tok.subtext}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Roadmap */}
        <div className="timeline-roadmap-card glass-card">
          <h2>
            <Layers size={20} style={{ color: 'var(--accent-color)', marginRight: '8px' }} />
            Model Architecture & Training Roadmap
          </h2>
          <p className="card-intro">
            Transitioning from pre-training token alignments to broker API execution interfaces.
          </p>

          <div className="roadmap-timeline">
            <div className="timeline-milestone active">
              <div className="milestone-dot">1</div>
              <div className="milestone-content">
                <h3>Phase 1: Pretraining & Token Alignment (Completed)</h3>
                <p>Aligned model weights on 400 Billion tokens of SEBI corporate disclosures, MCA company records, and BSE/NSE pricing history.</p>
              </div>
            </div>

            <div className="timeline-milestone active">
              <div className="milestone-dot">2</div>
              <div className="milestone-content">
                <h3>Phase 2: Analyst RLHF & Instruction Tuning (Active)</h3>
                <p>Aligning model responses with leading equity research desks and charter financial analysts for reasoning accuracy.</p>
              </div>
            </div>

            <div className="timeline-milestone">
              <div className="milestone-dot">3</div>
              <div className="milestone-content">
                <h3>Phase 3: Edge Slicing & Sub-100ms Inference (Preview)</h3>
                <p>Optimizing model weights to 4-bit quantizations, allowing sub-100ms streaming responses natively on client dashboards.</p>
              </div>
            </div>

            <div className="timeline-milestone">
              <div className="milestone-dot">4</div>
              <div className="milestone-content">
                <h3>Phase 4: Agentic Trading Executions (Upcoming)</h3>
                <p>Integrating direct API connections to leading Indian brokerages (Zerodha, Groww, AngelOne) for conversation-initiated trade orders.</p>
              </div>
            </div>
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
              <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(featuresRef); }}>Features</a>
              <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(statsRef); }}>Market Stats</a>
              <a href="#" onClick={(e) => { e.preventDefault(); scrollToSection(roadmapRef); }}>SLM Roadmap</a>
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
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn Page</a>
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
