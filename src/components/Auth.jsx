import React, { useState, useEffect } from 'react';
import { Lock, Mail, User, ShieldAlert, ArrowRight } from 'lucide-react';

// Predefined mock Google accounts for simulated login
const MOCK_GOOGLE_ACCOUNTS = [
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces'
  }
];

export default function Auth({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  // Simulated Google Auth state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT decode error:", e);
      return null;
    }
  };

  const handleCredentialResponse = (response) => {
    const credential = response.credential;
    const profile = decodeJWT(credential);
    if (profile) {
      const sessionUser = {
        name: profile.name,
        email: profile.email,
        avatar: profile.picture
      };
      localStorage.setItem('uperai_user', JSON.stringify(sessionUser));
      onLoginSuccess(sessionUser);
    } else {
      setError("Failed to authenticate with Google. Please try again.");
    }
  };

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "68415005948-vcoko4ampiq35q696j2n1tc7d5vl7b68.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById("google-login-btn-container"),
          { theme: "outline", size: "large", width: "100%", text: "signin_with" }
        );
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogle();
          clearInterval(checkInterval);
        }
      }, 500);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Load existing users or initialize empty array
  const getRegisteredUsers = () => {
    try {
      const data = localStorage.getItem('uperai_registered_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    const users = getRegisteredUsers();
    const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (matchedUser) {
      const sessionUser = {
        name: matchedUser.name,
        email: matchedUser.email,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(matchedUser.name)}`
      };
      localStorage.setItem('uperai_user', JSON.stringify(sessionUser));
      onLoginSuccess(sessionUser);
    } else {
      // Allow fallback default developer bypass or throw error
      if (email === 'dev@uper.ai' && password === 'admin') {
        const devUser = {
          name: 'Developer Sandbox',
          email: 'dev@uper.ai',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=UperAI'
        };
        localStorage.setItem('uperai_user', JSON.stringify(devUser));
        onLoginSuccess(devUser);
      } else {
        setError('Invalid email or password. Use dev@uper.ai / admin for sandbox bypass.');
      }
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please provide name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const users = getRegisteredUsers();
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (userExists) {
      setError('An account with this email already exists.');
      return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('uperai_registered_users', JSON.stringify(users));

    // Sign in automatically
    const sessionUser = {
      name: newUser.name,
      email: newUser.email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newUser.name)}`
    };
    localStorage.setItem('uperai_user', JSON.stringify(sessionUser));
    onLoginSuccess(sessionUser);
  };

  // Google Simulated Sign-In Handler
  const handleGoogleAccountSelect = (account) => {
    setGoogleLoading(true);
    setTimeout(() => {
      setGoogleLoading(false);
      setShowGoogleModal(false);
      
      const sessionUser = {
        name: account.name,
        email: account.email,
        avatar: account.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(account.name)}`
      };
      localStorage.setItem('uperai_user', JSON.stringify(sessionUser));
      onLoginSuccess(sessionUser);
    }, 1200);
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleName || !customGoogleEmail) return;

    handleGoogleAccountSelect({
      name: customGoogleName,
      email: customGoogleEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customGoogleName)}`
    });
  };

  return (
    <div className="auth-screen">
      {/* Background glowing decorations */}
      <div className="auth-glow auth-glow-1"></div>
      <div className="auth-glow auth-glow-2"></div>

      <div className="auth-card-container">
        {/* Logo Banner */}
        <div className="auth-brand-logo">
          <div className="auth-logo-icon">U</div>
          <h1>UperAI</h1>
          <p>Indian Equities Investment Terminal</p>
        </div>

        {/* Auth Main Card */}
        <div className="auth-card">
          {/* Tab Selector */}
          <div className="auth-tabs">
            <button 
              className={`auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => { setActiveTab('signup'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="auth-error-box">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Authentication Forms */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignIn} className="auth-form">
              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label>Password</label>
                  <span className="auth-forgot-link">Forgot?</span>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Sign In to Terminal</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="auth-input-group">
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-input-icon" />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input 
                    type="password" 
                    placeholder="Min. 6 characters" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Create Sandbox Account</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Social Sign In Divider */}
          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          {/* Real Google Login Native Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div id="google-login-btn-container" style={{ width: '100%', minHeight: '40px' }}></div>
            
            {/* Fallback button to launch simulated modal */}
            <button 
              type="button" 
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px',
                marginTop: '4px'
              }}
              onClick={() => setShowGoogleModal(true)}
            >
              Use simulated sandbox profiles
            </button>
          </div>
        </div>

        <div className="auth-footer-notes">
          Use email <code>dev@uper.ai</code> & password <code>admin</code> to bypass or register a local sandboxed credential.
        </div>
      </div>

      {/* Simulated Google Authentication Modal */}
      {showGoogleModal && (
        <div className="google-modal-overlay">
          <div className="google-modal-card">
            {googleLoading ? (
              <div className="google-modal-loading">
                <div className="google-spinner"></div>
                <h3>Signing you in...</h3>
                <p>Establishing secure handshake with Google API</p>
              </div>
            ) : (
              <>
                <div className="google-modal-header">
                  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '8px' }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <h2>Sign in with Google</h2>
                  <p>Choose an account to continue to <strong>UperAI</strong></p>
                </div>

                <div className="google-modal-body">
                  {!showCustomGoogleInput ? (
                    <div className="google-accounts-list">
                      {MOCK_GOOGLE_ACCOUNTS.map((acc, index) => (
                        <button 
                          key={index} 
                          className="google-account-row"
                          onClick={() => handleGoogleAccountSelect(acc)}
                        >
                          <img src={acc.avatar} alt={acc.name} className="google-account-avatar" />
                          <div className="google-account-info">
                            <span className="google-account-name">{acc.name}</span>
                            <span className="google-account-email">{acc.email}</span>
                          </div>
                        </button>
                      ))}

                      <button 
                        className="google-account-row google-add-account-row"
                        onClick={() => setShowCustomGoogleInput(true)}
                      >
                        <div className="google-add-icon">+</div>
                        <span className="google-account-name">Use another Google account</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCustomGoogleSubmit} className="google-custom-form">
                      <div className="auth-input-group">
                        <label>Google Account Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Arjun Dev" 
                          value={customGoogleName}
                          onChange={(e) => setCustomGoogleName(e.target.value)}
                          required
                          className="google-custom-input"
                        />
                      </div>
                      
                      <div className="auth-input-group">
                        <label>Google Gmail Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. arjun@gmail.com" 
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          required
                          className="google-custom-input"
                        />
                      </div>

                      <div className="google-form-actions">
                        <button 
                          type="button" 
                          className="google-cancel-btn"
                          onClick={() => setShowCustomGoogleInput(false)}
                        >
                          Back
                        </button>
                        <button type="submit" className="google-submit-btn">
                          Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="google-modal-footer">
                  <button 
                    className="google-close-modal-btn"
                    onClick={() => setShowGoogleModal(false)}
                  >
                    Cancel Authentication
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
