import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, ExternalLink, Calendar, Tag, Star, Activity, Clock, Heart, MessageCircle, Repeat2, Bookmark } from 'lucide-react';
import './AITrendsMonitor.css';

const CATEGORIES = [
  'Frontend (Client-Side)',
  'Backend (Server-Side)',
  'Database Layer',
  'DevOps / Deployment',
  'API & Integration Layer',
  'Security & Compliance',
  'Testing & Quality Assurance',
  'Analytics & Observability',
  'Automation / Tooling',
  'Architecture & Design Systems'
];

const AITrendsMonitor = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:8000/ai-trends');
        
        if (!response.ok) {
          throw new Error('Failed to fetch AI trends');
        }
        
        const data = await response.json();
        setProducts(data.products);
        setLastUpdated(new Date(data.last_updated));
        
      } catch (err) {
        console.error('Error fetching AI trends:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
    
    // Refresh data every 2 hours (matches backend cache)
    const interval = setInterval(fetchTrends, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.company_or_creator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedDate) {
      filtered = filtered.filter(p => {
        const pDate = new Date(p.launch_date);
        pDate.setHours(0, 0, 0, 0);
        return pDate.getTime() === selectedDate.getTime();
      });
    }

    if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } else if (sortBy === 'relevance') {
      filtered = [...filtered].sort((a, b) => 
        b.relevance_score - a.relevance_score
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, sortBy, products, selectedDate]);

  const getCategoryColor = (category) => {
    const colors = {
      'Frontend (Client-Side)': 'category-frontend',
      'Backend (Server-Side)': 'category-backend',
      'Database Layer': 'category-database',
      'DevOps / Deployment': 'category-devops',
      'API & Integration Layer': 'category-api',
      'Security & Compliance': 'category-security',
      'Testing & Quality Assurance': 'category-testing',
      'Analytics & Observability': 'category-analytics',
      'Automation / Tooling': 'category-automation',
      'Architecture & Design Systems': 'category-architecture'
    };
    return colors[category] || 'category-architecture';
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const categoryStats = CATEGORIES.map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length
  }));

  const getWeekData = () => {
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = products.filter(p => {
        const pDate = new Date(p.launch_date);
        return pDate >= date && pDate < nextDate;
      }).length;
      
      weekData.push({ date, count });
    }
    return weekData;
  };

  if (loading && products.length === 0) {
    return (
      <div className="ai-trends-container">
        <div className="ai-trends-header">
          <div className="ai-trends-header-content">
            <div className="ai-trends-header-flex">
              <div className="ai-trends-header-left">
                <div className="ai-trends-icon-box">
                  <TrendingUp className="ai-trends-icon" />
                </div>
                <div>
                  <h1 className="ai-trends-title">AI Launch Feed</h1>
                  <p className="ai-trends-subtitle">Loading live AI product updates...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ai-trends-main">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Activity className="ai-trends-pulse" style={{ width: '3rem', height: '3rem', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Fetching latest AI trends from X/Twitter...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-trends-container">
      {/* Header */}
      <div className="ai-trends-header">
        <div className="ai-trends-header-content">
          <div className="ai-trends-header-flex">
            <div className="ai-trends-header-left">
              <div className="ai-trends-icon-box">
                <TrendingUp className="ai-trends-icon" />
              </div>
              <div>
                <h1 className="ai-trends-title">AI Launch Feed</h1>
                <p className="ai-trends-subtitle">Real-time AI product monitoring from X/Twitter</p>
              </div>
            </div>
            <div className="ai-trends-live-badge">
              <Activity className="ai-trends-pulse" />
              <span className="ai-trends-live-text">LIVE</span>
              <span className="ai-trends-live-count">
                {products.length} tracked {lastUpdated && `• Updated ${getTimeAgo(lastUpdated.toISOString())}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="ai-trends-main">
        <div className="ai-trends-grid">
          {/* Left Sidebar */}
          <div className="ai-trends-sidebar">
            {/* Live Stats */}
            <div className="ai-trends-card">
              <div className="ai-trends-card-header">
                <div className="ai-trends-card-icon">
                  <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h3 className="ai-trends-card-title">Live Stats</h3>
              </div>
              
              <div className="ai-trends-stats">
                <div className="ai-trends-stat-item">
                  <div className="ai-trends-stat-header">
                    <span className="ai-trends-stat-label">Total Tracked</span>
                    <span className="ai-trends-stat-value" style={{ color: '#2563eb' }}>{products.length}</span>
                  </div>
                  <div className="ai-trends-stat-bar">
                    <div className="ai-trends-stat-fill" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="ai-trends-stat-item">
                  <div className="ai-trends-stat-header">
                    <span className="ai-trends-stat-label">Active Categories</span>
                    <span className="ai-trends-stat-value" style={{ color: '#9333ea' }}>
                      {categoryStats.filter(c => c.count > 0).length}
                    </span>
                  </div>
                  <div className="ai-trends-stat-bar">
                    <div className="ai-trends-stat-fill" 
                      style={{ width: `${(categoryStats.filter(c => c.count > 0).length / CATEGORIES.length) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#991b1b' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Weekly Chart */}
              <div className="ai-trends-chart">
                <div className="ai-trends-chart-header">
                  <div className="ai-trends-chart-label">Last 7 Days Activity</div>
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="ai-trends-chart-clear">
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="ai-trends-chart-bars">
                  {getWeekData().map((data, idx) => {
                    const maxCount = Math.max(...getWeekData().map(d => d.count), 1);
                    const isSelected = selectedDate && data.date.getTime() === selectedDate.getTime();
                    return (
                      <div 
                        key={idx} 
                        className="ai-trends-chart-bar-wrapper"
                        onClick={() => data.count > 0 && setSelectedDate(data.date)}
                      >
                        <div 
                          className={`ai-trends-chart-bar ${isSelected ? 'selected' : ''} ${data.count === 0 ? 'empty' : ''}`}
                          style={{ height: `${Math.max((data.count / maxCount) * 96, 4)}px` }}
                        />
                        <div className="ai-trends-chart-tooltip">
                          {data.count > 0 ? `${data.count} launch${data.count !== 1 ? 'es' : ''} - Click to filter` : 'No launches'}
                        </div>
                        <div className={`ai-trends-chart-day ${isSelected ? 'selected' : ''}`}>
                          {data.date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="ai-trends-chart-dates">
                  <span>{new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="ai-trends-card">
              <div className="ai-trends-search">
                <Search className="ai-trends-search-icon" />
                <input
                  type="text"
                  placeholder="Search products, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ai-trends-search-input"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="ai-trends-card">
              <div className="ai-trends-card-header">
                <div className="ai-trends-card-icon" style={{ background: 'linear-gradient(to bottom right, #9333ea, #ec4899)' }}>
                  <Filter style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h3 className="ai-trends-card-title">Filters</h3>
              </div>
              <div className="ai-trends-filters">
                <div className="ai-trends-filter-group">
                  <label className="ai-trends-filter-label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="ai-trends-filter-select"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="ai-trends-filter-group">
                  <label className="ai-trends-filter-label">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="ai-trends-filter-select"
                  >
                    <option value="date">Most Recent</option>
                    <option value="relevance">Relevance Score</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="ai-trends-card">
              <div className="ai-trends-card-header">
                <div className="ai-trends-card-icon" style={{ background: 'linear-gradient(to bottom right, #f97316, #dc2626)' }}>
                  <Tag style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h3 className="ai-trends-card-title">Category Distribution</h3>
              </div>
              <div className="ai-trends-categories">
                {categoryStats
                  .sort((a, b) => b.count - a.count)
                  .filter(stat => stat.count > 0)
                  .map(stat => (
                    <div key={stat.name} className="ai-trends-category-item">
                      <div className="ai-trends-category-header">
                        <span className="ai-trends-category-name">{stat.name}</span>
                        <span className="ai-trends-category-count">{stat.count}</span>
                      </div>
                      <div className="ai-trends-category-bar">
                        <div 
                          className="ai-trends-category-fill"
                          style={{ width: `${(stat.count / products.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
              <div className="ai-trends-category-total">
                Total: {products.length} products tracked
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="ai-trends-feed">
            {selectedDate && (
              <div className="ai-trends-filter-badge">
                <div className="ai-trends-filter-badge-content">
                  <Calendar className="ai-trends-filter-badge-icon" />
                  <span className="ai-trends-filter-badge-text">
                    Showing launches from {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </div>
                <button onClick={() => setSelectedDate(null)} className="ai-trends-filter-badge-clear">
                  Show all
                </button>
              </div>
            )}

            {filteredProducts.map((product) => (
              <div key={product.id} className="ai-trends-product">
                <div className="ai-trends-product-header">
                  <div className="ai-trends-product-user">
                    <img 
                      src={product.avatar} 
                      alt={product.company_or_creator}
                      className="ai-trends-product-avatar"
                    />
                    <div className="ai-trends-product-user-info">
                      <div className="ai-trends-product-user-meta">
                        <span className="ai-trends-product-company">{product.company_or_creator}</span>
                        <span className="ai-trends-product-handle">@{product.twitter_handle}</span>
                        <span className="ai-trends-product-separator">·</span>
                        <span className="ai-trends-product-time">
                          <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                          {getTimeAgo(product.timestamp)}
                        </span>
                      </div>
                      <div className="ai-trends-product-badges">
                        <span className={`ai-trends-category-badge ${getCategoryColor(product.category)}`}>
                          {product.category}
                        </span>
                        <div className="ai-trends-score">
                          <Star style={{ width: '0.75rem', height: '0.75rem' }} />
                          <span className="ai-trends-score-value">{product.relevance_score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ai-trends-product-content">
                  <h3 className="ai-trends-product-title">🚀 Launching {product.product_name}</h3>
                  <p className="ai-trends-product-description">{product.description}</p>
                  
                  <div className="ai-trends-product-tags">
                    {product.trend_tags.map((tag, i) => (
                      <span key={i} className="ai-trends-product-tag">
                        #{tag.replace(/\s/g, '')}
                      </span>
                    ))}
                  </div>

                  {product.website && (
                    <a
                      href={product.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-trends-product-link"
                    >
                      <div className="ai-trends-product-link-header">
                        <ExternalLink className="ai-trends-product-link-icon" />
                        <span className="ai-trends-product-link-url">
                          {product.website.replace('https://', '')}
                        </span>
                      </div>
                      <div className="ai-trends-product-link-date">
                        Launch Date: {new Date(product.launch_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </div>
                    </a>
                  )}
                </div>

                <div className="ai-trends-product-engagement">
                  <div className="ai-trends-engagement-actions">
                    <button className="ai-trends-engagement-button heart">
                      <Heart />
                      <span className="ai-trends-engagement-count">{product.engagement.likes}</span>
                    </button>
                    <button className="ai-trends-engagement-button">
                      <MessageCircle />
                      <span className="ai-trends-engagement-count">{product.engagement.comments}</span>
                    </button>
                    <button className="ai-trends-engagement-button">
                      <Repeat2 />
                      <span className="ai-trends-engagement-count">{product.engagement.retweets}</span>
                    </button>
                    <button className="ai-trends-engagement-button">
                      <Bookmark />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="ai-trends-empty">
                <Search style={{ width: '3rem', height: '3rem', color: '#9ca3af', margin: '0 auto 0.75rem' }} />
                <p className="ai-trends-empty-text">No products found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITrendsMonitor;