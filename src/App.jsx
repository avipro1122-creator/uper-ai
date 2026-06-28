import { useState, useEffect } from 'react';
import { ShieldAlert, Compass, FileText, Database, Activity } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SLMVision from './components/SLMVision';
import ConcallTerminal from './components/ConcallTerminal';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import DiscoveryPage from './components/DiscoveryPage';
import DiscoveryDetailPage from './components/DiscoveryDetailPage';
import PricingPage from './components/PricingPage';
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('home'); // 'home', 'chat', 'roadmap', 'admin', 'forbidden', 'discovery', 'pricing', 'concall'
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [landingSearchQuery, setLandingSearchQuery] = useState('');

  const handleStartSearch = (query) => {
    // Check limit rules first for guest users
    if (!user) {
      const currentCount = parseInt(localStorage.getItem('uperai_query_count') || '0', 10);
      if (currentCount >= 2) {
        navigate('auth', '/login?limit=2');
        return;
      }
    }
    setLandingSearchQuery(query);
    navigate('chat', '/chat');
  };

  // Sync state with URL path
  const syncViewWithURL = (currentUser) => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      if (currentUser) {
        if (currentUser.email?.toLowerCase() === 'avipro1122@gmail.com') {
          setActiveView('admin');
        } else {
          setActiveView('forbidden');
        }
      } else {
        setActiveView('auth');
      }
    } else if (path === '/login') {
      setActiveView('auth');
    } else if (path === '/roadmap') {
      if (currentUser) {
        setActiveView('roadmap');
      } else {
        setActiveView('auth');
      }
    } else if (path === '/concall') {
      setActiveView('concall');
    } else if (path === '/chat') {
      setActiveView('chat');
    } else if (path === '/discovery') {
      setActiveView('discovery');
    } else if (path.startsWith('/discovery/')) {
      setActiveView('discovery-detail');
    } else if (path === '/pricing') {
      setActiveView('pricing');
    } else {
      setActiveView('home');
    }
  };

  // Check user session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.authenticated) {
          setUser(data.user);
          syncViewWithURL(data.user);
        } else {
          setUser(null);
          try {
            localStorage.removeItem('uperai_query_count');
            localStorage.removeItem('uperai_chat_messages');
          } catch (e) {
            console.error("Failed to clear guest session from localStorage:", e);
          }
          syncViewWithURL(null);
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        try {
          localStorage.removeItem('uperai_query_count');
          localStorage.removeItem('uperai_chat_messages');
        } catch (e) {
          console.error("Failed to clear guest session from localStorage:", e);
        }
        syncViewWithURL(null);
      } finally {
        setLoadingSession(false);
      }
    };
    verifySession();
  }, []);

  // Listen to popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      syncViewWithURL(user);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const navigate = (viewName, path) => {
    window.history.pushState({}, '', path);
    setActiveView(viewName);
    setSidebarOpen(false);
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    syncViewWithURL(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout request failed:", e);
    }
    setUser(null);
    try {
      localStorage.removeItem('uperai_chat_messages');
      localStorage.removeItem('uperai_query_count');
    } catch (err) {
      console.error("Failed to clear localStorage on logout:", err);
    }
    navigate('home', '/');
  };

  // Loading Splash Screen
  if (loadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 20px auto' }}></div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  // Show Landing Page
  if (activeView === 'home') {
    return (
      <LandingPage 
        user={user} 
        onStartSearch={handleStartSearch} 
        onNavigateToView={(view, path) => navigate(view, path || (view === 'chat' ? '/chat' : '/'))}
        onRequireLogin={() => navigate('auth', '/login?limit=2')}
        onLogout={handleLogout}
      />
    );
  }

  // Show Discovery Page
  if (activeView === 'discovery') {
    return (
      <DiscoveryPage
        user={user}
        onNavigateToView={(view, path) => navigate(view, path)}
        onRequireLogin={() => navigate('auth', '/login')}
        onLogout={handleLogout}
      />
    );
  }

  // Show Discovery Detail Page
  if (activeView === 'discovery-detail') {
    const ticker = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] || '' : '';
    return (
      <DiscoveryDetailPage
        ticker={ticker}
        user={user}
        onNavigateToView={(view, path) => navigate(view, path)}
        onLogout={handleLogout}
        onRequireLogin={() => navigate('auth', '/login')}
      />
    );
  }

  // Show Pricing Page
  if (activeView === 'pricing') {
    return (
      <PricingPage
        user={user}
        onNavigateToView={(view, path) => navigate(view, path)}
        onRequireLogin={() => navigate('auth', '/login')}
        onLogout={handleLogout}
      />
    );
  }

  // Show Auth screen if requested
  if (activeView === 'auth') {
    return <Auth onLoginSuccess={handleLoginSuccess} onBack={() => navigate('home', '/')} />;
  }

  // 403 Forbidden Screen
  if (activeView === 'forbidden') {
    return (
      <div className="forbidden-container">
        <div className="forbidden-icon-glow">
          <ShieldAlert size={64} />
        </div>
        <h1 className="forbidden-title">403 - Access Denied</h1>
        <p className="forbidden-desc">
          Your account (<strong>{user.email}</strong>) does not have Administrator privileges. 
          All administrative requests are strictly audited.
        </p>
        <button className="btn-primary" onClick={() => navigate('chat', '/')} style={{ cursor: 'pointer' }}>
          Return to Research Terminal
        </button>
      </div>
    );
  }

  // Full-page Admin Dashboard (isolated layout to prevent double sidebar issues)
  if (activeView === 'admin') {
    return (
      <AdminDashboard user={user} onBackToTerminal={() => navigate('chat', '/')} />
    );
  }

  // Dashboard / Workspace Views
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      {/* Background radial glow behind center area */}
      <div className="hero-glow-bg" />

      {/* Sidebar Navigation */}
      <aside className={`sidebar-nav ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo Brand area */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: 'var(--accent-glow)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0, 201, 167, 0.2)' }}>
                <Activity size={18} style={{ color: 'var(--accent-color)' }} />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px', margin: 0 }}>
                  UPER<span style={{ color: 'var(--accent-color)' }}>AI</span>
                </h1>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Equity Intelligence
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => navigate('chat', '/')}
              style={{ cursor: 'pointer' }}
            >
              <Compass size={16} />
              <span>Research Terminal</span>
            </button>
            <button 
              className={`nav-item ${activeView === 'roadmap' ? 'active' : ''}`}
              onClick={() => navigate('roadmap', '/roadmap')}
              style={{ cursor: 'pointer' }}
            >
              <FileText size={16} />
              <span>SLM Roadmap</span>
            </button>
            <button 
              className={`nav-item ${activeView === 'concall' ? 'active' : ''}`}
              onClick={() => navigate('concall', '/concall')}
              style={{ cursor: 'pointer' }}
            >
              <Activity size={16} style={{ color: activeView === 'concall' ? 'var(--accent-color)' : 'inherit' }} />
              <span>Concall AI</span>
            </button>
            <button 
              className={`nav-item ${(activeView === 'discovery' || activeView === 'discovery-detail') ? 'active' : ''}`}
              onClick={() => navigate('discovery', '/discovery')}
              style={{ cursor: 'pointer' }}
            >
              <Compass size={16} style={{ color: (activeView === 'discovery' || activeView === 'discovery-detail') ? 'var(--accent-color)' : 'inherit' }} />
              <span>Discovery</span>
            </button>
            <button 
              className={`nav-item ${activeView === 'pricing' ? 'active' : ''}`}
              onClick={() => navigate('pricing', '/pricing')}
              style={{ cursor: 'pointer' }}
            >
              <FileText size={16} style={{ color: activeView === 'pricing' ? 'var(--accent-color)' : 'inherit' }} />
              <span>Pricing</span>
            </button>
            
            {user?.email?.toLowerCase() === 'avipro1122@gmail.com' && (
              <button 
                className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => navigate('admin', '/admin')}
                style={{ cursor: 'pointer' }}
              >
                <Database size={16} />
                <span>Admin Terminal</span>
              </button>
            )}
          </nav>

          {/* Bottom user status/profile or Sign In button */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    color: '#EF4444',
                    padding: '6px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => navigate('auth', '/login')}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, var(--accent-color), #00E5C0)',
                  border: 'none',
                  color: '#050B14',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0, 201, 167, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In to Platform
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden' }}>
        {/* Workspace views */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeView === 'chat' ? (
            <ChatInterface 
              user={user} 
              onRequireLogin={() => navigate('auth', '/login?limit=2')} 
              initialQuery={landingSearchQuery}
              onClearInitialQuery={() => setLandingSearchQuery('')}
              onNavigate={navigate}
              onLogout={handleLogout}
            />
          ) : activeView === 'concall' ? (
            <ConcallTerminal 
              user={user} 
              onRequireLogin={() => navigate('auth', '/login')} 
            />
          ) : (
            <SLMVision />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
