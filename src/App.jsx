import React, { useState, useEffect } from 'react';
import { MessageSquare, Cpu, LogOut, ShieldCheck, ShieldAlert } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SLMVision from './components/SLMVision';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

// Inline GitHub SVG component
const GithubIcon = ({ size = 16, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

function App() {
  const [activeView, setActiveView] = useState('chat'); // 'chat', 'roadmap', 'admin', 'forbidden'
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Sync state with URL path
  const syncViewWithURL = (currentUser) => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      if (currentUser) {
        if (currentUser.role === 'ADMIN') {
          setActiveView('admin');
        } else {
          setActiveView('forbidden');
        }
      } else {
        // Fallback to chat or let auth load
        setActiveView('chat');
      }
    } else if (path === '/roadmap') {
      setActiveView('roadmap');
    } else {
      setActiveView('chat');
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
          // If accessing admin, force login view
          if (window.location.pathname.startsWith('/admin')) {
            window.history.pushState({}, '', '/');
          }
        }
      } catch (err) {
        console.error("Session verification failed:", err);
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
    navigate('chat', '/');
  };

  // Loading Splash Screen
  if (loadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="admin-spinner" style={{ margin: '0 auto 20px auto' }}></div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  // Not Logged In -> Show Auth screen
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
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
        <button className="btn-primary" onClick={() => navigate('chat', '/')}>
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

  return (
    <div className="app-container theme-slm">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">U</div>
          <div>
            <span className="logo-text">UperAI</span>
            <span className="logo-badge" style={{ background: 'var(--accent-gradient)', color: '#050505' }}>v2.4</span>
          </div>
        </div>

        <nav className="nav-links">
          <span className="nav-section-title">Navigation</span>
          
          <button 
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('chat', '/')}
          >
            <MessageSquare size={16} />
            <span>Research Terminal</span>
          </button>

          <button 
            className={`nav-item ${activeView === 'roadmap' ? 'active' : ''}`}
            onClick={() => navigate('roadmap', '/roadmap')}
          >
            <Cpu size={16} />
            <span>Uper SLM Vision</span>
          </button>

          {user.role === 'ADMIN' && (
            <>
              <span className="nav-section-title" style={{ marginTop: '16px' }}>Administration</span>
              <button 
                className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => navigate('admin', '/admin')}
                style={{ border: '1px solid rgba(0, 229, 196, 0.15)', background: 'rgba(0, 229, 196, 0.02)' }}
              >
                <ShieldCheck size={16} style={{ color: '#00E5C4' }} />
                <span>Admin Dashboard</span>
              </button>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* User Profile Card */}
            <div className="sidebar-profile-card">
              <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} className="profile-avatar" />
              <div className="profile-details">
                <span className="profile-name">{user.name}</span>
                <span className="profile-email">{user.email}</span>
                {user.role === 'ADMIN' && (
                  <span className="role-badge admin" style={{ fontSize: '9px', padding: '1px 4px', marginTop: '2px', display: 'inline-block', width: 'fit-content' }}>Admin</span>
                )}
              </div>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={14} />
              <span>Log Out</span>
            </button>

            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="nav-item" 
              style={{ padding: '8px 10px', fontSize: '0.82rem' }}
            >
              <GithubIcon size={14} />
              <span>GitHub Repository</span>
            </a>
            
            <div style={{ padding: '8px 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Engineered for Indian Equities. Powered by Uper Finance Engine.</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden' }}>
        {/* Main Workspace Header */}
        <div className="main-header" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(12px)', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
              {activeView === 'chat' ? 'Research Terminal' : 'Proprietary SLM Roadmap'}
            </h2>
            <span style={{ background: 'rgba(0, 229, 196, 0.08)', border: '1px solid rgba(0, 229, 196, 0.25)', color: '#00E5C4', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              v2.4
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span className="nav-status-dot"></span>
              <span>System Online</span>
            </div>
            <div style={{ height: '12px', width: '1px', background: 'var(--border-subtle)' }} />
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span>NSE/BSE Engine</span>
            </div>
            <div style={{ height: '12px', width: '1px', background: 'var(--border-subtle)' }} />
            <img src={user.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} className="nav-user-avatar" title={user.name} />
          </div>
        </div>

        {/* Workspace views */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeView === 'chat' ? (
            <ChatInterface />
          ) : (
            <SLMVision />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
