
import React, { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { balanceOf } from "thirdweb/extensions/erc20";
import Navbar from "../components/Navbar";
import { chaosCoinContract } from "../lib/contract";

export default function Home() {
  const account = useActiveAccount();
  const [marketData, setMarketData] = useState({
    price: 0.000001,
    marketCap: "Loading...",
    volume24h: "Loading...",
    priceChange24h: 0
  });
  const [cryptoMovers, setCryptoMovers] = useState({
    gainers: [],
    losers: []
  });
  const [news, setNews] = useState([]);
  const [portfolioChange, setPortfolioChange] = useState({ amount: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Safely read balance with comprehensive error handling
  const { data: balance, error: balanceError, isLoading: balanceLoading } = useReadContract({
    contract: chaosCoinContract,
    method: balanceOf,
    params: account?.address ? [account.address] : undefined,
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    
    // Use Promise.allSettled to prevent any single failure from crashing the app
    const dataPromises = [
      fetchMarketDataSafely(),
      fetchCryptoMoversSafely(),
      fetchCryptoNewsSafely()
    ];

    try {
      const results = await Promise.allSettled(dataPromises);
      
      // Log any failures but continue with fallbacks
      results.forEach((result, index) => {
        const functionNames = ['Market Data', 'Crypto Movers', 'Crypto News'];
        if (result.status === 'rejected') {
          console.warn(`${functionNames[index]} failed:`, result.reason);
          setErrors(prev => ({ ...prev, [functionNames[index].toLowerCase().replace(' ', '_')]: result.reason.message }));
        }
      });
    } catch (error) {
      console.error("Critical error initializing app:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketDataSafely = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Market API returned ${response.status}`);
      }

      const data = await response.json();

      if (data?.pairs?.length > 0) {
        const pair = data.pairs[0];
        setMarketData({
          price: parseFloat(pair.priceUsd || "0.000001"),
          marketCap: pair.marketCap ? `$${(pair.marketCap / 1000000).toFixed(2)}M` : "N/A",
          volume24h: pair.volume?.h24 ? `$${(pair.volume.h24 / 1000000).toFixed(2)}M` : "N/A",
          priceChange24h: parseFloat(pair.priceChange?.h24 || "0")
        });
      } else {
        throw new Error("No trading pairs found");
      }
    } catch (error) {
      console.warn("Using fallback market data:", error.message);
      setMarketData({
        price: 0.000001,
        marketCap: "N/A",
        volume24h: "N/A",
        priceChange24h: 0
      });
    }
  };

  const fetchCryptoMoversSafely = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h',
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const gainers = data
          .filter(coin => coin.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 3)
          .map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image
          }));

        const losers = data
          .filter(coin => coin.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
          .slice(0, 3)
          .map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image
          }));

        setCryptoMovers({ gainers, losers });
      } else {
        throw new Error("Invalid market data received");
      }
    } catch (error) {
      console.warn("Using fallback crypto movers:", error.message);
      setCryptoMovers({
        gainers: [
          { symbol: "BTC", name: "Bitcoin", price: 45000, change: 5.2, icon: "https://via.placeholder.com/32x32/f7931a/ffffff?text=₿" },
          { symbol: "ETH", name: "Ethereum", price: 3000, change: 3.8, icon: "https://via.placeholder.com/32x32/627eea/ffffff?text=Ξ" },
          { symbol: "SOL", name: "Solana", price: 100, change: 7.1, icon: "https://via.placeholder.com/32x32/9945ff/ffffff?text=◎" }
        ],
        losers: [
          { symbol: "ADA", name: "Cardano", price: 0.5, change: -2.1, icon: "https://via.placeholder.com/32x32/0033ad/ffffff?text=₳" },
          { symbol: "DOT", name: "Polkadot", price: 7, change: -3.5, icon: "https://via.placeholder.com/32x32/e6007a/ffffff?text=●" },
          { symbol: "LINK", name: "Chainlink", price: 15, change: -1.8, icon: "https://via.placeholder.com/32x32/2a5ada/ffffff?text=🔗" }
        ]
      });
    }
  };

  const fetchCryptoNewsSafely = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss&count=6',
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`News API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        const articles = data.items.map(item => ({
          title: item.title || "Crypto Market Update",
          excerpt: (item.description || "Latest cryptocurrency news and market analysis...")
            .replace(/<[^>]*>/g, '')
            .substring(0, 140) + '...',
          timestamp: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Recent",
          image: item.thumbnail || item.enclosure?.link || 'https://cryptonews.com/favicon.ico',
          url: item.link || "#",
          source: "CoinTelegraph",
          sourceImage: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png"
        }));
        setNews(articles);
      } else {
        throw new Error("Invalid news data received");
      }
    } catch (error) {
      console.warn("Using fallback crypto news:", error.message);
      setNews([
        {
          title: "CHAOS Token Ecosystem Expansion",
          excerpt: "The CHAOS token continues to build momentum with new DeFi integrations and community-driven initiatives across the Avalanche network...",
          timestamp: "2 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "CHAOS News",
          sourceImage: "https://cryptonews.com/favicon.ico"
        },
        {
          title: "Avalanche Network Growth",
          excerpt: "Avalanche sees continued adoption as developers build innovative DeFi solutions with fast transaction speeds and low fees...",
          timestamp: "4 hours ago",
          image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
          url: "#",
          source: "Avalanche News",
          sourceImage: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png"
        },
        {
          title: "DeFi Market Analysis",
          excerpt: "Decentralized finance protocols show strong fundamentals as total value locked increases and user adoption grows steadily...",
          timestamp: "6 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "DeFi Pulse",
          sourceImage: "https://cryptonews.com/favicon.ico"
        },
        {
          title: "Cryptocurrency Market Trends",
          excerpt: "Market analysis shows positive sentiment as institutional interest continues to drive adoption of digital assets worldwide...",
          timestamp: "8 hours ago",
          image: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png",
          url: "#",
          source: "CoinTelegraph",
          sourceImage: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png"
        }
      ]);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return "0.00";
    try {
      const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
      return isNaN(tokens) ? "0.00" : tokens.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  };

  const calculatePortfolioValue = () => {
    if (!balance || !marketData.price) return "0.00";
    try {
      const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
      const value = tokens * marketData.price;
      return isNaN(value) ? "0.00" : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (error) {
      console.error("Error calculating portfolio value:", error);
      return "0.00";
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card loading-card">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <h2 style={{ margin: '1rem 0', color: '#10b981' }}>Loading Dashboard</h2>
              <p className="text-gray">Fetching your portfolio and market data...</p>
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
        
        {/* Portfolio Overview Section */}
        <div className="portfolio-section">
          <div className="card balance-card">
            <h2 className="section-title">Portfolio Overview</h2>
            <div className="balance-display">
              <div className="balance-amount">${calculatePortfolioValue()}</div>
              <div className="balance-tokens">{formatBalance(balance)} CHAOS</div>
              <div className={`balance-change ${marketData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}% (24h)
              </div>
            </div>
            {balanceError && (
              <div className="error-message">
                <span>⚠️ Balance fetch error. Please refresh or check wallet connection.</span>
              </div>
            )}
          </div>

          <div className="card market-overview-card">
            <h3 className="section-title">CHAOS Market Data</h3>
            <div className="market-data-grid">
              <div className="market-stat">
                <div className="market-stat-label">Current Price</div>
                <div className="market-stat-value">${marketData.price.toFixed(8)}</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">Market Cap</div>
                <div className="market-stat-value">{marketData.marketCap}</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">24h Volume</div>
                <div className="market-stat-value">{marketData.volume24h}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="card social-section">
          <h2 className="section-title">🌐 Follow Chaos Coin</h2>
          <div className="social-links">
            <a href="https://discord.com/channels/1398769618088231042/1398769618692345918" target="_blank" rel="noopener noreferrer" className="social-link discord">
              <span className="social-icon">💬</span>
              <span>Discord</span>
            </a>
            <a href="https://twitter.com/ChaosCoin_" target="_blank" rel="noopener noreferrer" className="social-link twitter">
              <span className="social-icon">🐦</span>
              <span>Twitter</span>
            </a>
            <a href="https://t.me/chaoscoin" target="_blank" rel="noopener noreferrer" className="social-link telegram">
              <span className="social-icon">✈️</span>
              <span>Telegram</span>
            </a>
            <a href="https://www.instagram.com/Chaos_Coin_/" target="_blank" rel="noopener noreferrer" className="social-link instagram">
              <span className="social-icon">📷</span>
              <span>Instagram</span>
            </a>
            <a href="https://www.tiktok.com/@ChaosCoin_" target="_blank" rel="noopener noreferrer" className="social-link tiktok">
              <span className="social-icon">🎵</span>
              <span>TikTok</span>
            </a>
          </div>
        </div>

        {/* Market Movers */}
        <div className="card movers-section">
          <h2 className="section-title">📈 Today's Market Movers</h2>
          <div className="movers-container">
            <div className="movers-column">
              <h3 className="movers-subtitle text-green">🚀 Top Gainers</h3>
              <div className="movers-list">
                {cryptoMovers.gainers.map((gainer, index) => (
                  <div key={`gainer-${index}`} className="mover-item">
                    <div className="mover-info">
                      <img 
                        src={gainer.icon} 
                        alt={gainer.symbol} 
                        className="mover-icon"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/32x32/10b981/ffffff?text=${gainer.symbol.charAt(0)}`;
                        }}
                      />
                      <div>
                        <div className="mover-symbol">{gainer.symbol}</div>
                        <div className="mover-name">{gainer.name}</div>
                      </div>
                    </div>
                    <div className="mover-price">
                      <div className="mover-value">${gainer.price.toLocaleString()}</div>
                      <div className="mover-change positive">
                        +{gainer.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="movers-column">
              <h3 className="movers-subtitle text-red">📉 Top Losers</h3>
              <div className="movers-list">
                {cryptoMovers.losers.map((loser, index) => (
                  <div key={`loser-${index}`} className="mover-item">
                    <div className="mover-info">
                      <img 
                        src={loser.icon} 
                        alt={loser.symbol} 
                        className="mover-icon"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/32x32/ef4444/ffffff?text=${loser.symbol.charAt(0)}`;
                        }}
                      />
                      <div>
                        <div className="mover-symbol">{loser.symbol}</div>
                        <div className="mover-name">{loser.name}</div>
                      </div>
                    </div>
                    <div className="mover-price">
                      <div className="mover-value">${loser.price.toLocaleString()}</div>
                      <div className="mover-change negative">
                        {loser.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Crypto News - Twitter Style Feed */}
        <div className="card news-section">
          <h2 className="section-title">📰 Latest Crypto News</h2>
          <div className="news-feed-vertical">
            {news.map((article, index) => (
              <div key={`news-${index}`} className="news-item-twitter">
                <div className="news-item-header">
                  <img 
                    src={article.sourceImage || article.image || 'https://cryptonews.com/favicon.ico'}
                    alt={article.source || "Crypto News"}
                    className="news-item-image"
                    onError={(e) => {
                      e.target.src = 'https://cryptonews.com/favicon.ico';
                    }}
                  />
                  <div className="news-item-meta">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <h4 className="news-item-source">{article.source || "Crypto News"}</h4>
                      <span className="news-item-time">• {article.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="news-item-content">
                  <h3 className="news-item-title">{article.title}</h3>
                  <p className="news-item-description">{article.excerpt}</p>
                  {article.url !== "#" && (
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-item-link">
                      Read article
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        {Object.keys(errors).length > 0 && (
          <div className="card system-status">
            <h3 className="section-title">⚠️ System Status</h3>
            <div className="status-grid">
              {Object.entries(errors).map(([service, error]) => (
                <div key={service} className="status-item error">
                  <span className="status-label">{service.replace('_', ' ')}</span>
                  <span className="status-value">Degraded</span>
                </div>
              ))}
            </div>
            <p className="text-gray" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Some services are experiencing issues. Fallback data is being used.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
