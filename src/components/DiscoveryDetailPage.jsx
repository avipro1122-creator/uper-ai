import { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight, Check, AlertTriangle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { SCREENER_DATA } from '../data/screenerData';

export default function DiscoveryDetailPage({ ticker, user, onNavigateToView, onLogout, onRequireLogin }) {
  const stockTicker = String(ticker).toUpperCase();
  const stock = SCREENER_DATA[stockTicker];

  if (!stock) {
    return (
      <div className="landing-scroll-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="sticky-header">
          <div className="header-inner">
            <div className="header-logo" onClick={() => onNavigateToView('home', '/')}>
              <div className="logo-badge">
                <Activity size={18} />
              </div>
              <div>
                <span className="logo-text">UPER<span className="teal-text">AI</span></span>
                <span className="logo-sub">Equity Intelligence</span>
              </div>
            </div>
            <nav className="desktop-nav">
              <button onClick={() => onNavigateToView('home', '/')} className="nav-link-btn">Ask Pro</button>
              <button onClick={() => onNavigateToView('discovery', '/discovery')} className="nav-link-btn active">Discovery</button>
              <button onClick={() => onNavigateToView('pricing', '/pricing')} className="nav-link-btn">Pricing</button>
            </nav>
            <div className="header-actions">
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="nav-user-avatar-placeholder" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.name}</span>
                  <button onClick={onLogout} className="btn-logout-nav" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
                </div>
              ) : (
                <button onClick={onRequireLogin} className="btn-login-nav">Sign In</button>
              )}
            </div>
          </div>
        </header>

        <main style={{ padding: '140px 24px 60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', textAlign: 'center', flex: 1 }}>
          <div className="glass-card" style={{ padding: '40px', border: '1px solid var(--border-subtle)' }}>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>Stock Not Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The stock symbol "{stockTicker}" is not present in our screener database.</p>
            <button 
              onClick={() => onNavigateToView('discovery', '/discovery')} 
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <ChevronLeft size={16} /> Back to Discovery
            </button>
          </div>
        </main>
      </div>
    );
  }

  const changeVal = parseFloat(stock.change) || 0;
  const changeClass = stock.change.startsWith('+') || changeVal > 0 ? 'change-positive' : changeVal < 0 ? 'change-negative' : '';

  return (
    <div className="landing-scroll-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="sticky-header">
        <div className="header-inner">
          <div className="header-logo" onClick={() => onNavigateToView('home', '/')}>
            <div className="logo-badge">
              <Activity size={18} />
            </div>
            <div>
              <span className="logo-text">UPER<span className="teal-text">AI</span></span>
              <span className="logo-sub">Equity Intelligence</span>
            </div>
          </div>

          <nav className="desktop-nav">
            <button onClick={() => onNavigateToView('home', '/')} className="nav-link-btn">Ask Pro</button>
            <button onClick={() => onNavigateToView('discovery', '/discovery')} className="nav-link-btn active">Discovery</button>
            <button onClick={() => onNavigateToView('pricing', '/pricing')} className="nav-link-btn">Pricing</button>
          </nav>

          <div className="header-actions">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} 
                  alt={user.name} 
                  className="nav-user-avatar" 
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
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
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={onRequireLogin} className="btn-login-nav">Sign In</button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ padding: '120px 24px 60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
        
        {/* Navigation Action */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => onNavigateToView('discovery', '/discovery')} 
            className="nav-link-btn"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '6px 12px', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '6px', 
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <ChevronLeft size={16} /> Back to Discovery List
          </button>
        </div>

        {/* Header Section card */}
        <div className="glass-card" style={{ padding: '24px 32px', marginBottom: '24px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="logo-text" style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stock.name}</span>
              <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-color)', border: '1px solid rgba(0, 201, 167, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                {stockTicker}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>NSE Listed Equity • Live Market Analytics</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{stock.price}</div>
            <div className={changeClass} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
              {changeVal >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {stock.change}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ marginBottom: '32px' }}>
          <h3 className="section-subtitle" style={{ marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>Key Financial Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Market Cap', value: stock.marketCap },
              { label: 'P/E Ratio', value: stock.pe },
              { label: 'ROE', value: stock.roe },
              { label: 'ROCE', value: stock.roce },
              { label: 'Book Value', value: stock.bookValue },
              { label: 'Dividend Yield', value: stock.divYield }
            ].map((metric, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border-subtle)', textAlign: 'center', transition: 'transform 0.2s ease, border-color 0.2s ease' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{metric.label}</span>
                <span style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pros & Cons Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Pros */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.01)' }}>
            <h4 style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '8px' }}>
              <Check size={18} style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', padding: '2px' }} />
              Strengths & Pros
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stock.pros.map((pro, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  <span style={{ color: '#10B981', fontWeight: 'bold', marginTop: '2px' }}>•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.01)' }}>
            <h4 style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid rgba(239, 68, 68, 0.1)', paddingBottom: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              Risks & Cons
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stock.cons.map((con, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  <span style={{ color: '#EF4444', fontWeight: 'bold', marginTop: '2px' }}>•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quarterly Results Table */}
        <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>Quarterly Performance Summary</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="comparison-table" style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ textAlign: 'left' }}>Financial Metric</th>
                  {stock.quarterlyResults.map((r, i) => (
                    <th key={i} style={{ textAlign: 'right' }}>{r.quarter}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Sales / Revenue</td>
                  {stock.quarterlyResults.map((r, i) => (
                    <td key={i} style={{ textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>{r.sales}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Operating Profit</td>
                  {stock.quarterlyResults.map((r, i) => (
                    <td key={i} style={{ textAlign: 'right', fontWeight: 500, color: 'var(--text-primary)' }}>{r.operatingProfit}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Net Profit (PAT)</td>
                  {stock.quarterlyResults.map((r, i) => (
                    <td key={i} style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-color)' }}>{r.netProfit}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="landing-footer" style={{ marginTop: 'auto' }}>
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">UPER<span className="teal-text">AI</span></span>
            <p>Next-Generation Equity Intelligence Platform. Built for Retail Investors and Financial Professionals in India.</p>
            <span className="copyright-text">© 2026 UperAI. All rights reserved.</span>
          </div>

          <div className="footer-links-grid">
            <div className="footer-link-group">
              <h4>Platform</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToView('home', '/'); }}>Market Stats</a>
            </div>

            <div className="footer-link-group">
              <h4>Legal & Info</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("UperAI is an AI-powered financial translation tool. Not financial or SEBI investment advice."); }}>About Platform</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: All conversations are encrypted and cached locally."); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Platform is provided as-is."); }}>Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
