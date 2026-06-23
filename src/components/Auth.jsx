import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

// Predefined mock Google accounts for simulated login in development
const MOCK_GOOGLE_ACCOUNTS = [
  {
    name: 'Avi Pro (Admin)',
    email: 'AviPro1122@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Arjun'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Priya'
  }
];

export default function Auth({ onLoginSuccess }) {
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Authenticate with the server using the credential token (real or mock)
  const authenticateWithServer = async (credentialToken) => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: credentialToken })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please try again.');
      }

      setGoogleLoading(false);
      setShowGoogleModal(false);
      onLoginSuccess(data.user);
    } catch (err) {
      console.error("Authentication error:", err);
      setGoogleLoading(false);
      setError(err.message);
    }
  };

  const handleCredentialResponse = (response) => {
    const credential = response.credential;
    if (credential) {
      authenticateWithServer(credential);
    } else {
      setError("Failed to obtain credential from Google.");
    }
  };

  // Google OAuth button initialization
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

  // Google Simulated Sign-In Handler
  const handleGoogleAccountSelect = (account) => {
    // Generate a mock base64 token which the backend will recognize
    const mockPayload = {
      googleId: `mock_${account.email.replace(/[@.]/g, '_')}`,
      email: account.email,
      name: account.name,
      picture: account.avatar
    };
    const mockToken = 'mock_google_credential_' + window.btoa(JSON.stringify(mockPayload));
    authenticateWithServer(mockToken);
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
        <div className="auth-card" style={{ padding: '40px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Sign in with your Google account to access the terminal.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="auth-error-box" style={{ marginBottom: '20px' }}>
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google Login Native Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div id="google-login-btn-container" style={{ width: '100%', minHeight: '40px' }}></div>
            
            <div className="auth-divider" style={{ width: '100%', margin: '10px 0' }}>
              <span>or</span>
            </div>

            {/* Sandbox login link */}
            <button 
              type="button" 
              className="auth-submit-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                cursor: 'pointer',
                borderRadius: '8px',
                padding: '12px'
              }}
              onClick={() => setShowGoogleModal(true)}
            >
              <Sparkles size={15} style={{ color: '#00E5C4' }} />
              <span>Use Simulated Sandbox Profiles</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="auth-footer-notes" style={{ color: 'var(--text-muted)' }}>
          Secured with Google OAuth 2.0. Unauthorized access is prohibited.
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
                          placeholder="e.g. Avi Pro" 
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
                          placeholder="e.g. AviPro1122@gmail.com" 
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
