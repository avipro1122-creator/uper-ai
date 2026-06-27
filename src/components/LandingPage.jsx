import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, ArrowRight, Sparkles, TrendingUp, Compass, 
  FileText, Database, Layers, Award, Zap, Terminal, Gauge, Cpu, 
  Menu, X, Check, Shield, BarChart3, HelpCircle, Users, BookOpen,
  RefreshCw, LogOut
} from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function LandingPage({ user, onStartSearch, onNavigateToView, onRequireLogin, onLogout }) {
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for smooth scroll
  const statsRef = useRef(null);
  const whyRef = useRef(null);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onStartSearch(searchQuery);
    }
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
            <button onClick={() => scrollToSection(statsRef)} className="nav-link-btn">Market Ticker</button>
            <button onClick={() => scrollToSection(whyRef)} className="nav-link-btn">Why UperAI</button>
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
            <button onClick={() => scrollToSection(statsRef)} className="mobile-drawer-link">Market Ticker</button>
            <button onClick={() => scrollToSection(whyRef)} className="mobile-drawer-link">Why UperAI</button>
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
            Understand Earnings <br/>
            <span className="gradient-teal-text">Calls in Seconds</span>
          </h1>

          <p className="hero-description animate-fade-in">
            AI that converts complex earnings calls and financial reports into simple, actionable insights for Indian investors.
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
