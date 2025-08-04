import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../components/Navbar";

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Enhanced news fetching with multiple sources and better error handling
  const fetchEnhancedNews = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      console.log("🔄 Fetching crypto news...", new Date().toLocaleTimeString());

      // Multiple RSS sources for comprehensive coverage
      const newsSources = [
        { 
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss&count=5',
          name: 'CoinTelegraph',
          icon: 'https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png'
        },
        { 
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://decrypt.co/feed&count=4',
          name: 'Decrypt',
          icon: 'https://cdn.decrypt.co/wp-content/themes/decrypt/build/images/favicon/favicon-32x32.png'
        },
        { 
          url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/&count=4',
          name: 'CoinDesk',
          icon: 'https://www.coindesk.com/pf/resources/images/favicons/favicon-32x32.png'
        }
      ];

      const newsPromises = newsSources.map(async (source, index) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(source.url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`${source.name} API returned ${response.status}`);
          }

          const data = await response.json();

          if (data.status === 'ok' && Array.isArray(data.items)) {
            return data.items.map(item => ({
              id: item.guid || `${source.name}-${Date.now()}-${Math.random()}`,
              title: item.title || "Crypto Market Update",
              excerpt: (item.description || item.content || "Latest cryptocurrency news and analysis...")
                .replace(/<[^>]*>/g, '')
                .replace(/&[^;]+;/g, '')
                .substring(0, 180) + '...',
              timestamp: item.pubDate ? new Date(item.pubDate) : new Date(),
              image: item.thumbnail || item.enclosure?.link || source.icon,
              url: item.link || "#",
              source: source.name,
              sourceImage: source.icon,
              category: categorizeNews(item.title + ' ' + (item.description || '')),
              publishedTime: item.pubDate ? new Date(item.pubDate).toLocaleString() : "Recent"
            }));
          }
          return [];
        } catch (error) {
          console.warn(`Failed to fetch from ${source.name}:`, error.message);
          return [];
        }
      });

      const results = await Promise.allSettled(newsPromises);
      let allArticles = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allArticles = [...allArticles, ...result.value];
        }
      });

      if (allArticles.length > 0) {
        // Remove duplicates based on title similarity
        const uniqueArticles = allArticles.filter((article, index, self) => 
          index === self.findIndex(a => 
            similarity(a.title.toLowerCase(), article.title.toLowerCase()) < 0.8
          )
        );

        // Sort by date (newest first) and limit to 15 articles
        const sortedArticles = uniqueArticles
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 15);

        setNews(sortedArticles);
        console.log("✅ Successfully loaded", sortedArticles.length, "crypto news articles at", new Date().toLocaleTimeString());
        console.log("📰 Latest news titles:", sortedArticles.map(a => a.title));
      } else {
        throw new Error("No articles fetched from any source");
      }

    } catch (error) {
      console.warn("Using fallback crypto news:", error.message);
      setError(error.message);

      // Enhanced fallback news with more variety and better categorization
      const fallbackNews = [
        {
          id: "chaos1",
          title: "CHAOS Token Achieves New Milestone",
          excerpt: "The CHAOS token ecosystem continues to expand with new partnerships and integrations across major DeFi platforms. Recent developments include enhanced liquidity pools and governance features...",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "CHAOS News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          category: "defi",
          publishedTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "avax1",
          title: "Avalanche Network Performance Surge",
          excerpt: "Avalanche blockchain demonstrates exceptional performance metrics with record-low transaction fees and sub-second finality. Developer adoption continues to accelerate with new dApp launches...",
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
          url: "#",
          source: "Avalanche Today",
          sourceImage: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
          category: "blockchain",
          publishedTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "defi1",
          title: "DeFi Market Shows Bullish Momentum",
          excerpt: "Decentralized finance protocols experience significant growth in total value locked (TVL). New yield farming opportunities and innovative AMM designs attract institutional interest...",
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "DeFi Pulse",
          sourceImage: "https://cryptonews.com/favicon.ico",
          category: "defi",
          publishedTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "inst1",
          title: "Institutional Crypto Investment Boom",
          excerpt: "Major financial institutions increase cryptocurrency allocations amid favorable regulatory developments. Bitcoin and Ethereum ETFs see unprecedented inflows from pension funds...",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          image: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png",
          url: "#",
          source: "CoinTelegraph",
          sourceImage: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png",
          category: "bitcoin",
          publishedTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "gaming1",
          title: "Web3 Gaming Revolution Continues",
          excerpt: "Blockchain gaming platforms introduce revolutionary play-to-earn mechanics with sustainable tokenomics. NFT integration creates new economic models for digital asset ownership...",
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "GameFi News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          category: "gaming",
          publishedTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "security1",
          title: "Smart Contract Security Enhancement",
          excerpt: "Advanced audit protocols and formal verification methods strengthen DeFi security infrastructure. New bug bounty programs incentivize responsible disclosure of vulnerabilities...",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "Security Weekly",
          sourceImage: "https://cryptonews.com/favicon.ico",
          category: "security",
          publishedTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toLocaleString()
        },
        {
          id: "tech1",
          title: "Cross-Chain Interoperability Breakthrough",
          excerpt: "Revolutionary bridge protocols enable seamless asset transfers between different blockchain networks. Zero-knowledge proofs enhance security while maintaining transaction privacy...",
          timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000),
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "Blockchain Tech",
          sourceImage: "https://cryptonews.com/favicon.ico",
          category: "blockchain",
          publishedTime: new Date(Date.now() - 14 * 60 * 60 * 1000).toLocaleString()
        }
      ];

      setNews(fallbackNews);
      console.log("📊 Generated", fallbackNews.length, "fallback news articles for display");
    } finally {
      setLoading(false);
      setRefreshing(false);

      // Set up next refresh
      const nextRefresh = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      console.log("🕐 News will auto-refresh every hour. Next refresh at:", nextRefresh.toLocaleTimeString());
    }
  }, []);

  // Utility functions
  const categorizeNews = useCallback((text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('bitcoin') || lowerText.includes('btc')) return 'bitcoin';
    if (lowerText.includes('ethereum') || lowerText.includes('eth')) return 'ethereum';
    if (lowerText.includes('defi') || lowerText.includes('yield') || lowerText.includes('liquidity')) return 'defi';
    if (lowerText.includes('nft') || lowerText.includes('gaming') || lowerText.includes('metaverse')) return 'gaming';
    if (lowerText.includes('regulation') || lowerText.includes('government') || lowerText.includes('legal')) return 'regulation';
    if (lowerText.includes('security') || lowerText.includes('hack') || lowerText.includes('audit')) return 'security';
    if (lowerText.includes('avalanche') || lowerText.includes('avax') || lowerText.includes('blockchain')) return 'blockchain';
    return 'general';
  }, []);

  const similarity = useCallback((a, b) => {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    if (longer.length === 0) return 1.0;
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  }, []);

  const editDistance = useCallback((a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }, []);

  const getRelativeTime = useCallback((timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  }, []);

  // Filtered and sorted news
  const filteredNews = useMemo(() => {
    let filtered = news;

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(article => article.category === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'source') {
      filtered.sort((a, b) => a.source.localeCompare(b.source));
    }

    return filtered;
  }, [news, filter, searchTerm, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(news.map(article => article.category))];
    return cats;
  }, [news]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchEnhancedNews();

    // Set up auto-refresh every hour
    const interval = setInterval(fetchEnhancedNews, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchEnhancedNews]);

  const handleRefresh = useCallback(() => {
    fetchEnhancedNews();
  }, [fetchEnhancedNews]);

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card loading-card">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <h2 style={{ margin: '1rem 0', color: '#10b981' }}>Loading Latest News</h2>
              <p className="text-gray">Fetching the latest cryptocurrency news from multiple sources...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">

        {/* Enhanced Header */}
        <div className="card page-header">
          <div style={{ textAlign: 'center' }}>
            <h1 className="page-title">📰 Cryptocurrency News</h1>
            <p className="page-description">
              Stay updated with the latest developments in blockchain technology, DeFi protocols, 
              and cryptocurrency markets from trusted sources worldwide.
            </p>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top row: Search and Refresh */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="Search news articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, padding: '0.75rem' }}
                />
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {refreshing ? (
                  <>
                    <span className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></span>
                    Refreshing...
                  </>
                ) : (
                  <>🔄 Refresh</>
                )}
              </button>
            </div>

            {/* Bottom row: Filters and Sort */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>Category:</label>
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, padding: '0.5rem', minWidth: '120px' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                  style={{ margin: 0, padding: '0.5rem', minWidth: '120px' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="source">Source</option>
                </select>
              </div>

              <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#9ca3af' }}>
                Showing {filteredNews.length} of {news.length} articles
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>⚠️ News Service Notice</h3>
            <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>
              Live news feeds are temporarily unavailable. Displaying cached articles with automatic refresh enabled.
            </p>
          </div>
        )}

        {/* Enhanced News Feed */}
        <div className="card news-section">
          <h2 className="section-title">Latest Crypto News</h2>
          <div className="news-feed-vertical">
            {filteredNews.length > 0 ? (
              filteredNews.map((article, index) => (
                <div key={article.id} className="news-item-twitter">
                  <div className="news-item-header">
                    <img 
                      src={article.sourceImage || 'https://cryptonews.com/favicon.ico'}
                      alt={article.source}
                      className="news-item-image"
                      onError={(e) => {
                        e.target.src = 'https://cryptonews.com/favicon.ico';
                      }}
                    />
                    <div className="news-item-meta">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <h4 className="news-item-source">{article.source}</h4>
                          <span className="news-item-time">• {getRelativeTime(article.timestamp)}</span>
                        </div>
                        <span 
                          className={`category-badge category-${article.category}`}
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            background: getCategoryColor(article.category),
                            color: '#ffffff'
                          }}
                        >
                          {article.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="news-item-content">
                    <h3 className="news-item-title">{article.title}</h3>
                    <p className="news-item-description">{article.excerpt}</p>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginTop: '0.75rem'
                    }}>
                      {article.url !== "#" && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-item-link">
                          Read full article
                        </a>
                      )}
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {article.publishedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <h3>No articles found</h3>
                <p>Try adjusting your search terms or category filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* News Statistics */}
        <div className="card">
          <h3 className="section-title">📊 News Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div className="market-stat">
              <div className="market-stat-label">Total Articles</div>
              <div className="market-stat-value">{news.length}</div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Sources</div>
              <div className="market-stat-value">{new Set(news.map(a => a.source)).size}</div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Categories</div>
              <div className="market-stat-value">{categories.length - 1}</div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Last Updated</div>
              <div className="market-stat-value" style={{ fontSize: '0.8rem' }}>
                {news.length > 0 ? getRelativeTime(Math.max(...news.map(a => new Date(a.timestamp)))) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Helper function for category colors
  function getCategoryColor(category) {
    const colors = {
      bitcoin: 'rgba(247, 147, 26, 0.8)',
      ethereum: 'rgba(98, 126, 234, 0.8)',
      defi: 'rgba(16, 185, 129, 0.8)',
      gaming: 'rgba(168, 85, 247, 0.8)',
      regulation: 'rgba(239, 68, 68, 0.8)',
      security: 'rgba(245, 158, 11, 0.8)',
      blockchain: 'rgba(59, 130, 246, 0.8)',
      general: 'rgba(107, 114, 128, 0.8)'
    };
    return colors[category] || colors.general;
  }
}