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

export default function Auth({ onLoginSuccess, onBack }) {
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const isLimitRedirect = typeof window !== 'undefined' && (window.location.search.includes('limit=1') || window.location.search.includes('limit=2'));

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

      let data = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Server error: ${res.status}`);
      }
      
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
          client_id: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || "68415005948-vcoko4ampiq35q696j2n1tc7d5vl7b68.apps.googleusercontent.com",
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

          {isLimitRedirect && !error && (
            <div className="auth-limit-box" style={{
              background: 'rgba(0, 229, 196, 0.08)',
              border: '1px solid rgba(0, 229, 196, 0.25)',
              color: '#00E5C4',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <Sparkles size={18} style={{ color: '#00E5C4', flexShrink: 0 }} />
              <span>You've used your 2 free research queries. Sign in with Google to unlock unlimited access.</span>
            </div>
          )}

          {/* Real Google Login Native Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div id="google-login-btn-container" style={{ width: '100%', minHeight: '40px' }}></div>
          </div>
        </div>

        <div className="auth-footer-notes" style={{ color: 'var(--text-muted)' }}>
          Secured with Google OAuth 2.0. Unauthorized access is prohibited.
        </div>

        {onBack && (
          <button 
            onClick={onBack} 
            style={{
              background: 'none',
              border: 'none',
              color: '#00E5C4',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              gap: '6px',
              textDecoration: 'underline',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = 0.8}
          >
            ← Back to Research Terminal
          </button>
        )}
      </div>
    </div>
  );
}
