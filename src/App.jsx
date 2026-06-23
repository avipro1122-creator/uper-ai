import React, { useState } from 'react';
import { MessageSquare, Cpu, LogOut, User, LogIn } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import SLMVision from './components/SLMVision';
import Auth from './components/Auth';
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
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'roadmap'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('uperai_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('uperai_user');
    setUser(null);
  };

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
            onClick={() => setActiveView('chat')}
          >
            <MessageSquare size={16} />
            <span>Research Terminal</span>
          </button>

          <button 
            className={`nav-item ${activeView === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveView('roadmap')}
          >
            <Cpu size={16} />
            <span>Uper SLM Vision</span>
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* User Profile Card */}
            {user ? (
              <div className="sidebar-profile-card">
                <img src={user.avatar} alt={user.name} className="profile-avatar" />
                <div className="profile-details">
                  <span className="profile-name">{user.name}</span>
                  <span className="profile-email">{user.email}</span>
                </div>
              </div>
            ) : (
              <div className="sidebar-profile-card guest-profile" onClick={() => setShowAuthModal(true)} style={{ cursor: 'pointer' }}>
                <div className="profile-avatar guest-avatar-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.2)' }}>
                  <User size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="profile-details">
                  <span className="profile-name">Guest Workspace</span>
                  <span className="profile-email" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Sign in for research</span>
                </div>
              </div>
            )}

            {user ? (
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="logout-btn login-btn-sidebar" style={{ border: '1px solid rgba(0, 229, 196, 0.3)', color: 'var(--accent-color)' }}>
                <LogIn size={14} />
                <span>Sign In / Register</span>
              </button>
            )}

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
            {user ? (
              <img src={user.avatar} alt={user.name} className="nav-user-avatar" title={user.name} />
            ) : (
              <button className="nav-signin-header-btn" onClick={() => setShowAuthModal(true)}>
                <span>Sign In</span>
              </button>
            )}
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

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <Auth 
              onLoginSuccess={(userData) => {
                setUser(userData);
                setShowAuthModal(false);
              }} 
              onClose={() => setShowAuthModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
