import { useState } from 'react';
import { Check, Activity } from 'lucide-react';

export default function PricingPage({ user, onNavigateToView, onRequireLogin, onLogout }) {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

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
            <button onClick={() => onNavigateToView('discovery', '/discovery')} className="nav-link-btn">Discovery</button>
            <button onClick={() => onNavigateToView('pricing', '/pricing')} className="nav-link-btn active">Pricing</button>
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

      {/* Main Pricing Section */}
      <main style={{ padding: '120px 24px 60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <section className="pricing-landing-section" style={{ padding: 0 }}>
          <div className="section-header" style={{ marginBottom: '40px' }}>
            <span className="section-subtitle">Flexible Plans</span>
            <h2 className="section-title">Get the AI Advantage,<br/><span className="gradient-teal-text">Become a Pro Investor</span></h2>
            
            <div className="pricing-billing-toggle">
              <button 
                className={`toggle-tab ${billingPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`toggle-tab ${billingPeriod === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly <span className="discount-badge">Save 40%</span>
              </button>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Card 1: Free Plan */}
            <div className="pricing-card glass-card">
              <div className="card-header">
                <span className="plan-name">Free Plan</span>
                <div className="plan-price">
                  <span className="currency">₹</span>
                  <span className="amount">0</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <p className="plan-desc">Get started with basic equity analysis tools and summaries.</p>
              <ul className="plan-features">
                <li><Check size={14} className="feature-check" /> <strong>Free for 10 queries</strong></li>
                <li><Check size={14} className="feature-check" /> Standard SLM Analysis</li>
                <li><Check size={14} className="feature-check" /> Corporate Disclosures & News</li>
                <li><Check size={14} className="feature-check" /> Community Support</li>
              </ul>
              <button className="btn-plan-select" onClick={onRequireLogin}>Get Started</button>
            </div>

            {/* Card 2: Premium Plan (Best Seller) */}
            <div className="pricing-card glass-card best-seller">
              <div className="best-seller-badge">Featured</div>
              <div className="card-header">
                <span className="plan-name">Premium Plan</span>
                <div className="plan-price">
                  <span className="currency">₹</span>
                  <span className="amount">{billingPeriod === 'yearly' ? '299' : '499'}</span>
                  <span className="period">/mo</span>
                </div>
                {billingPeriod === 'yearly' && <span className="billing-annually-note">Billed annually</span>}
              </div>
              <p className="plan-desc">Unlimited access and deep corporate research capabilities for active investors.</p>
              <ul className="plan-features">
                <li><Check size={14} className="feature-check" /> <strong>Unlimited AI Research Queries</strong></li>
                <li><Check size={14} className="feature-check" /> <strong>Export PDF Reports</strong></li>
                <li><Check size={14} className="feature-check" /> <strong>Deep Historical Concall Scans</strong></li>
                <li><Check size={14} className="feature-check" /> Advanced Valuation Models</li>
                <li><Check size={14} className="feature-check" /> Priority AI Inference Speed</li>
              </ul>
              <button className="btn-plan-select btn-featured" onClick={onRequireLogin}>Become a Pro</button>
            </div>

            {/* Card 3: Enterprise */}
            <div className="pricing-card glass-card">
              <div className="card-header">
                <span className="plan-name">Enterprise</span>
                <div className="plan-price">
                  <span className="amount">Custom</span>
                </div>
                <span className="billing-annually-note">Tailored solutions</span>
              </div>
              <p className="plan-desc">Ideal for research teams and institutions requiring custom data, API integrations, and higher limits.</p>
              <ul className="plan-features">
                <li><Check size={14} className="feature-check" /> Custom Data Integrations</li>
                <li><Check size={14} className="feature-check" /> Dedicated API Endpoints</li>
                <li><Check size={14} className="feature-check" /> Higher Concurrency & Limits</li>
                <li><Check size={14} className="feature-check" /> Custom SLM Fine-tuning</li>
                <li><Check size={14} className="feature-check" /> 24/7 Account Manager</li>
              </ul>
              <button className="btn-plan-select" onClick={() => alert("Contact sales at sales@uperai.in")}>Contact Sales</button>
            </div>
          </div>
        </section>
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
    </div>
  );
}
