import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Users, TrendingUp, Newspaper, MessageSquare, 
  History, Trash2, Pencil, Plus, X, RefreshCw, ShieldAlert,
  ArrowLeft, Search, Check, AlertCircle, ShieldCheck
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({ user, onBackToTerminal }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data States
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [stocksList, setStocksList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [logsList, setLogsList] = useState([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Forms
  const [showStockModal, setShowStockModal] = useState(false);
  const [currentStock, setCurrentStock] = useState(null); // null for new, stock object for edit
  const [stockForm, setStockForm] = useState({
    ticker: '', name: '', price: '', change: '+0.00%', 
    marketCap: '', peRatio: '', divYield: '', roe: ''
  });

  const [showNewsModal, setShowNewsModal] = useState(false);
  const [currentNews, setCurrentNews] = useState(null); // null for new, news object for edit
  const [newsForm, setNewsForm] = useState({
    title: '', content: '', author: 'UperAI News Desk'
  });

  // Fetch helper
  const fetchData = async (tabName) => {
    setLoading(true);
    setError('');
    try {
      let url = '';
      if (tabName === 'overview') url = '/api/admin/overview';
      else if (tabName === 'users') url = '/api/admin/users';
      else if (tabName === 'stocks') url = '/api/admin/stocks';
      else if (tabName === 'news') url = '/api/admin/news';
      else if (tabName === 'feedback') url = '/api/admin/feedback';
      else if (tabName === 'logs') url = '/api/admin/logs';

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch data for ${tabName}`);
      }

      if (tabName === 'overview') setStats(data.stats);
      else if (tabName === 'users') setUsersList(data.users || []);
      else if (tabName === 'stocks') setStocksList(data.stocks || []);
      else if (tabName === 'news') setNewsList(data.news || []);
      else if (tabName === 'feedback') setFeedbackList(data.feedback || []);
      else if (tabName === 'logs') setLogsList(data.logs || []);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
    setSearchQuery('');
  }, [activeTab]);

  const handleRefresh = () => {
    fetchData(activeTab);
  };

  // User Actions
  const handleToggleRole = async (targetUser) => {
    setError('');
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    
    // Prevent self-demotion to avoid lockout
    if (targetUser.email.toLowerCase() === user.email.toLowerCase() && newRole === 'USER') {
      setError("For security, you cannot demote your own account.");
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsersList(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Stock CRUD Actions
  const handleOpenStockModal = (stock = null) => {
    if (stock) {
      setCurrentStock(stock);
      setStockForm({
        ticker: stock.ticker,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        marketCap: stock.marketCap,
        peRatio: stock.peRatio,
        divYield: stock.divYield,
        roe: stock.roe
      });
    } else {
      setCurrentStock(null);
      setStockForm({
        ticker: '', name: '', price: '', change: '+0.00%', 
        marketCap: '', peRatio: '', divYield: '', roe: ''
      });
    }
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!stockForm.ticker || !stockForm.name || stockForm.price === '') {
      setError("Please fill in Ticker, Name, and Price.");
      return;
    }

    try {
      const isEdit = !!currentStock;
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload = isEdit ? { id: currentStock.id, ...stockForm } : stockForm;

      const res = await fetch('/api/admin/stocks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} stock.`);

      setShowStockModal(false);
      fetchData('stocks');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm("Are you sure you want to delete this stock?")) return;
    setError('');
    try {
      const res = await fetch('/api/admin/stocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete stock");

      setStocksList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // News CRUD Actions
  const handleOpenNewsModal = (news = null) => {
    if (news) {
      setCurrentNews(news);
      setNewsForm({
        title: news.title,
        content: news.content,
        author: news.author
      });
    } else {
      setCurrentNews(null);
      setNewsForm({
        title: '', content: '', author: user.name || 'UperAI News Desk'
      });
    }
    setShowNewsModal(true);
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newsForm.title || !newsForm.content) {
      setError("Please fill in Title and Content.");
      return;
    }

    try {
      const isEdit = !!currentNews;
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload = isEdit ? { id: currentNews.id, ...newsForm } : newsForm;

      const res = await fetch('/api/admin/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'publish'} news.`);

      setShowNewsModal(false);
      fetchData('news');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteNews = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news article?")) return;
    setError('');
    try {
      const res = await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete news article");

      setNewsList(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Feedback actions
  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to delete this feedback item?")) return;
    setError('');
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete feedback");

      setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter lists based on search query
  const filteredUsers = usersList.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStocks = stocksList.filter(s => 
    s.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = newsList.filter(n => 
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeedback = feedbackList.filter(f => 
    f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logsList.filter(l => 
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* Admin Sidebar Section */}
      <aside className="admin-sidebar">
        <button className="admin-tab-btn" onClick={onBackToTerminal} style={{ marginBottom: '10px' }}>
          <ArrowLeft size={16} />
          <span>Back to Terminal</span>
        </button>

        <span className="admin-sidebar-title">Admin Panels</span>
        
        <button 
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          <span>Overview</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>User Directory</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'stocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('stocks')}
        >
          <TrendingUp size={16} />
          <span>Manage Stocks</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <Newspaper size={16} />
          <span>Publish News</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <MessageSquare size={16} />
          <span>User Feedback</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <History size={16} />
          <span>Audit Logs</span>
        </button>
      </aside>

      {/* Main Admin Content Pane */}
      <main className="admin-content">
        
        {/* Tab-specific headers */}
        <header className="admin-section-header">
          <div>
            <span style={{ fontSize: '0.78rem', color: '#00E5C4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Management Console
            </span>
            <h1 className="admin-section-title">
              {activeTab === 'overview' && 'System Analytics'}
              {activeTab === 'users' && 'User Directory & RBAC'}
              {activeTab === 'stocks' && 'Equity Database Editor'}
              {activeTab === 'news' && 'Corporate Feed Publisher'}
              {activeTab === 'feedback' && 'Inbound Bug Reports & Feedback'}
              {activeTab === 'logs' && 'Security Audit Logs'}
            </h1>
            <p className="admin-section-subtitle">
              {activeTab === 'overview' && 'Real-time telemetry, user base statistics, and database sizes.'}
              {activeTab === 'users' && 'Elevate roles, audit access privileges, or terminate user records.'}
              {activeTab === 'stocks' && 'Alter prices, tickers, and performance metrics for the terminal engine.'}
              {activeTab === 'news' && 'Publish insights, research documents, and news items directly.'}
              {activeTab === 'feedback' && 'Review bug submissions, custom feedbacks, and rating reports.'}
              {activeTab === 'logs' && 'Immutable system audit logs detailing role updates and administrative actions.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTab !== 'overview' && (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search indices..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '6px 12px 6px 32px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '180px'
                  }}
                />
              </div>
            )}

            <button className="action-btn" onClick={handleRefresh} title="Sync database stats">
              <RefreshCw size={15} />
            </button>

            {activeTab === 'stocks' && (
              <button className="btn-primary" onClick={() => handleOpenStockModal()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}>
                <Plus size={14} />
                <span>Add Stock</span>
              </button>
            )}

            {activeTab === 'news' && (
              <button className="btn-primary" onClick={() => handleOpenNewsModal()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}>
                <Plus size={14} />
                <span>Publish News</span>
              </button>
            )}
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="auth-error-box" style={{ margin: 0, padding: '12px 16px', background: 'rgba(255, 90, 90, 0.1)', border: '1px solid rgba(255, 90, 90, 0.2)' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING SPINNER */}
        {loading ? (
          <div className="spinner-container">
            <div className="admin-spinner"></div>
          </div>
        ) : (
          <>
            {/* VIEW OVERVIEW */}
            {activeTab === 'overview' && stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><Users size={20} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.totalUsers}</span>
                      <span className="stat-label">Total Users</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><TrendingUp size={20} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.totalStocks}</span>
                      <span className="stat-label">Monitored Stocks</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><Newspaper size={20} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.totalNews}</span>
                      <span className="stat-label">News Articles</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><MessageSquare size={20} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.totalFeedback}</span>
                      <span className="stat-label">Feedbacks</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon-wrapper"><History size={20} /></div>
                    <div className="stat-info">
                      <span className="stat-value">{stats.totalLogs}</span>
                      <span className="stat-label">Security Logs</span>
                    </div>
                  </div>
                </div>

                {/* System Telemetry details */}
                <div className="admin-card">
                  <h3 className="admin-card-title"><ShieldCheck size={18} style={{ color: '#00E5C4' }} /> System Security Configuration</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span>Google OAuth Client Configured</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span>Session Cookie Flag: HttpOnly</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Enabled (Secure)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <span>SameSite Enforcement Policy</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Strict</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Default Database Adapter</span>
                      <span style={{ color: 'var(--text-primary)' }}>Ephesian SQLite Engine (database.json)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW USERS */}
            {activeTab === 'users' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Account Role</th>
                      <th>Registered</th>
                      <th>Last Login</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No users found matching query
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(targetUser => (
                        <tr key={targetUser.id}>
                          <td>
                            <div className="user-info-cell">
                              <img src={targetUser.profileImage} alt="" className="user-avatar" />
                              <div>
                                <div className="user-name-text">{targetUser.name}</div>
                                <div className="user-email-text">{targetUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${targetUser.role.toLowerCase()}`}>
                              {targetUser.role}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(targetUser.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {targetUser.lastLogin ? new Date(targetUser.lastLogin).toLocaleString() : 'Never'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="action-btn"
                                onClick={() => handleToggleRole(targetUser)}
                                title={`Change role to ${targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN'}`}
                                disabled={targetUser.email.toLowerCase() === 'avipro1122@gmail.com'}
                                style={{ opacity: targetUser.email.toLowerCase() === 'avipro1122@gmail.com' ? 0.3 : 1 }}
                              >
                                {targetUser.role === 'ADMIN' ? 'Demote' : 'Promote'}
                              </button>
                              
                              <button 
                                className="action-btn danger"
                                onClick={() => handleDeleteUser(targetUser.id)}
                                title="Delete user"
                                disabled={targetUser.email.toLowerCase() === 'avipro1122@gmail.com'}
                                style={{ opacity: targetUser.email.toLowerCase() === 'avipro1122@gmail.com' ? 0.3 : 1 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW STOCKS */}
            {activeTab === 'stocks' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Company Name</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Market Cap</th>
                      <th>P/E</th>
                      <th>Div. Yield</th>
                      <th>ROE</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No stocks found matching query
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map(stock => (
                        <tr key={stock.id}>
                          <td style={{ fontWeight: 700, color: '#00E5C4' }}>{stock.ticker}</td>
                          <td>{stock.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>₹{Number(stock.price).toFixed(2)}</td>
                          <td style={{ 
                            color: stock.change.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)',
                            fontWeight: 600
                          }}>
                            {stock.change}
                          </td>
                          <td>{stock.marketCap}</td>
                          <td>{stock.peRatio}</td>
                          <td>{stock.divYield}</td>
                          <td>{stock.roe}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="action-btn edit" onClick={() => handleOpenStockModal(stock)} title="Edit stock Details">
                                <Pencil size={14} />
                              </button>
                              <button className="action-btn danger" onClick={() => handleDeleteStock(stock.id)} title="Delete stock">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW NEWS */}
            {activeTab === 'news' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Published Date</th>
                      <th style={{ width: '40%' }}>Summary Content</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNews.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No news items published
                        </td>
                      </tr>
                    ) : (
                      filteredNews.map(news => (
                        <tr key={news.id}>
                          <td style={{ fontWeight: 600 }}>{news.title}</td>
                          <td>{news.author}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(news.date).toLocaleDateString()}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', maxTransform: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {news.content.substring(0, 80)}...
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="action-btn edit" onClick={() => handleOpenNewsModal(news)} title="Edit news Article">
                                <Pencil size={14} />
                              </button>
                              <button className="action-btn danger" onClick={() => handleDeleteNews(news.id)} title="Delete article">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW FEEDBACK */}
            {activeTab === 'feedback' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Issue Type</th>
                      <th>Message</th>
                      <th>Received At</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No feedback reports received
                        </td>
                      </tr>
                    ) : (
                      filteredFeedback.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.email}</div>
                          </td>
                          <td>
                            <span className={`feedback-type-badge ${item.type === 'bug' ? 'bug' : 'feedback'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-primary)', maxWidth: '300px', wordBreak: 'break-word' }}>
                            {item.message}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {new Date(item.date).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="action-btn danger" onClick={() => handleDeleteFeedback(item.id)} title="Delete Feedback">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW LOGS */}
            {activeTab === 'logs' && (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time Signature</th>
                      <th>Email Account</th>
                      <th>Action Triggered</th>
                      <th>Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id}>
                          <td className="log-row-time">{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 500 }}>{log.email}</td>
                          <td className="log-row-action">{log.action}</td>
                          <td className="log-row-details">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* STOCK CRUD MODAL */}
      {showStockModal && (
        <div className="admin-form-modal">
          <form className="admin-form-card" onSubmit={handleStockSubmit}>
            <div className="form-title-row">
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {currentStock ? `Edit Stock Details: ${currentStock.ticker}` : 'Add New Equity Record'}
              </h2>
              <button type="button" className="action-btn" onClick={() => setShowStockModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="form-grid">
              <div className="admin-field">
                <label>Ticker Symbol (NSE)*</label>
                <input 
                  type="text" 
                  placeholder="e.g. INFOSYS" 
                  value={stockForm.ticker}
                  onChange={(e) => setStockForm({...stockForm, ticker: e.target.value.toUpperCase()})}
                  required
                  disabled={!!currentStock}
                />
              </div>

              <div className="admin-field">
                <label>Company Name*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Infosys Ltd." 
                  value={stockForm.name}
                  onChange={(e) => setStockForm({...stockForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="admin-field">
                <label>Price (₹)*</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 1420.50" 
                  value={stockForm.price}
                  onChange={(e) => setStockForm({...stockForm, price: e.target.value})}
                  required
                />
              </div>

              <div className="admin-field">
                <label>24h Performance Change</label>
                <input 
                  type="text" 
                  placeholder="e.g. +1.24% or -0.80%" 
                  value={stockForm.change}
                  onChange={(e) => setStockForm({...stockForm, change: e.target.value})}
                />
              </div>

              <div className="admin-field">
                <label>Market Capitalization</label>
                <input 
                  type="text" 
                  placeholder="e.g. ₹5.89 Lakh Cr" 
                  value={stockForm.marketCap}
                  onChange={(e) => setStockForm({...stockForm, marketCap: e.target.value})}
                />
              </div>

              <div className="admin-field">
                <label>P/E Ratio</label>
                <input 
                  type="text" 
                  placeholder="e.g. 24.3" 
                  value={stockForm.peRatio}
                  onChange={(e) => setStockForm({...stockForm, peRatio: e.target.value})}
                />
              </div>

              <div className="admin-field">
                <label>Dividend Yield</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1.84%" 
                  value={stockForm.divYield}
                  onChange={(e) => setStockForm({...stockForm, divYield: e.target.value})}
                />
              </div>

              <div className="admin-field">
                <label>Return On Equity (ROE)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 31.4%" 
                  value={stockForm.roe}
                  onChange={(e) => setStockForm({...stockForm, roe: e.target.value})}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowStockModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {currentStock ? 'Save Changes' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEWS CRUD MODAL */}
      {showNewsModal && (
        <div className="admin-form-modal">
          <form className="admin-form-card" onSubmit={handleNewsSubmit} style={{ maxWidth: '640px' }}>
            <div className="form-title-row">
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                {currentNews ? 'Edit Corporate Insights' : 'Publish New Corporate Update'}
              </h2>
              <button type="button" className="action-btn" onClick={() => setShowNewsModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-field">
                <label>Article Title*</label>
                <input 
                  type="text" 
                  placeholder="e.g. Reserve Bank of India holds Repo Rate at 6.5%" 
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="admin-field">
                <label>Author / Desk Attribution</label>
                <input 
                  type="text" 
                  placeholder="e.g. UperAI News Desk" 
                  value={newsForm.author}
                  onChange={(e) => setNewsForm({...newsForm, author: e.target.value})}
                />
              </div>

              <div className="admin-field">
                <label>Content Body (Markdown Supported)*</label>
                <textarea 
                  placeholder="Type the news details here..." 
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowNewsModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {currentNews ? 'Update Post' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
