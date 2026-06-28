import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Compass, BookOpen, Users, Cpu, RefreshCw, Check, ArrowRight, Sparkles, MessageSquare, LogOut, ChevronDown, Activity, ChevronUp } from 'lucide-react';
import ConcallTerminal from './ConcallTerminal';

export default function DiscoveryPage({ user, onNavigateToView, onRequireLogin, onLogout }) {
  const router = useRouter();
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStock, setActiveStock] = useState(null);
  const [sortBy, setSortBy] = useState('ticker'); // 'ticker', 'price', 'change', 'marketCap', 'roe'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/stocks');
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setStocks(data.stocks || []);
        } else {
          throw new Error(data.error || 'Failed to load stocks.');
        }
      } catch (err) {
        console.error("Error fetching stocks list:", err);
        setError(err.message || 'Failed to load stock list.');
      } finally {
        setLoading(false);
      }
    };
    fetchStocks();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending for numbers/change
    }
  };

  // Helper to parse numeric values for sorting
  const parseVal = (val, type) => {
    if (val === undefined || val === null || val === 'N/A') return -999999;
    if (type === 'percent') {
      return parseFloat(String(val).replace(/%/g, '').replace(/\+/g, '')) || 0;
    }
    if (type === 'marketCap') {
      const clean = String(val).toLowerCase();
      let num = parseFloat(clean.replace(/[cr,₹\s]/g, '').replace(/lakh/g, '')) || 0;
      if (clean.includes('lakh')) num *= 100000;
      return num;
    }
    return parseFloat(val) || 0;
  };

  // Filter & Sort stocks
  const filteredStocks = stocks.filter(stock => 
    stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'ticker') {
      valA = a.ticker;
      valB = b.ticker;
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'name') {
      valA = a.name;
      valB = b.name;
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else if (sortBy === 'price') {
      valA = Number(a.price) || 0;
      valB = Number(b.price) || 0;
    } else if (sortBy === 'change') {
      valA = parseVal(a.change, 'percent');
      valB = parseVal(b.change, 'percent');
    } else if (sortBy === 'marketCap') {
      valA = parseVal(a.marketCap, 'marketCap');
      valB = parseVal(b.marketCap, 'marketCap');
    } else if (sortBy === 'roe') {
      valA = parseVal(a.roe, 'percent');
      valB = parseVal(b.roe, 'percent');
    } else {
      valA = a[sortBy] || '';
      valB = b[sortBy] || '';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRowClick = (stock) => {
    router.push(`/discovery/${stock.ticker}`);
  };

  return (
    <div className="landing-scroll-container">
      {/* Sticky Header */}
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
                    transition: 'all 0.2s ease'
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
      <main style={{ padding: '120px 24px 60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 350px)' }}>
        <div className="section-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <span className="section-subtitle">Discovery Terminal</span>
          <h2 className="section-title">Different Stocks List</h2>
          <p className="section-desc" style={{ maxWidth: '600px', margin: '12px auto 0 auto' }}>
            Browse and monitor metrics across domestic equities. Select any ticker to launch the interactive corporate concall analyzer.
          </p>
        </div>

        {/* Search & Filter bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by company name or ticker symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.92rem',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '60px 0' }}>
            <div className="admin-spinner"></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading equity database...</p>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p style={{ color: 'var(--color-error)', fontWeight: 600 }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '16px' }}>Retry Load</button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--border-subtle)' }}>
            <table className="comparison-table" style={{ margin: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <th onClick={() => handleSort('ticker')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Ticker {sortBy === 'ticker' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Company Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Price {sortBy === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('change')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Change {sortBy === 'change' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('marketCap')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Market Cap {sortBy === 'marketCap' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('peRatio')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    P/E Ratio {sortBy === 'peRatio' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('divYield')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    Div Yield {sortBy === 'divYield' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th onClick={() => handleSort('roe')} style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}>
                    ROE {sortBy === 'roe' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No companies found matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  sortedStocks.map((stock) => {
                    const changeVal = parseFloat(stock.change) || 0;
                    const changeClass = stock.change.startsWith('+') || changeVal > 0 ? 'change-positive' : changeVal < 0 ? 'change-negative' : '';
                    
                    return (
                      <tr 
                        key={stock.id} 
                        style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        className="hover-row"
                        onClick={() => handleRowClick(stock)}
                      >
                        <td><strong style={{ color: 'var(--accent-color)' }}>{stock.ticker}</strong></td>
                        <td>{stock.name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{Number(stock.price).toFixed(2)}</td>
                        <td className={changeClass} style={{ textAlign: 'right', fontWeight: 600 }}>
                          {stock.change}
                        </td>
                        <td style={{ textAlign: 'right' }}>{stock.marketCap}</td>
                        <td style={{ textAlign: 'right' }}>{stock.peRatio}</td>
                        <td style={{ textAlign: 'right' }}>{stock.divYield}</td>
                        <td style={{ textAlign: 'right' }}>{stock.roe}</td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRowClick(stock)}
                          >
                            Analyze <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="landing-footer">
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

      {/* Modal Overlay */}
      {activeStock && (
        <div className="modal-overlay" onClick={() => setActiveStock(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ConcallTerminal 
              user={user} 
              onRequireLogin={onRequireLogin}
              initialStock={{
                'nse-code': activeStock.ticker,
                name: activeStock.name,
                'bse-code': ''
              }}
              onClose={() => setActiveStock(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
