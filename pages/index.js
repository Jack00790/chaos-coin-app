import React, { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { balanceOf } from "thirdweb/extensions/erc20";
import Navbar from "../components/Navbar";
import { chaosCoinContract } from "../lib/contract";

export default function Home() {
  const account = useActiveAccount();
  const [marketData, setMarketData] = useState({
    marketCap: "Loading...",
    volume24h: "Loading...",
    price: 0
  });
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [news, setNews] = useState([]);
  const [portfolioChange, setPortfolioChange] = useState({ amount: 0, percentage: 0 });

  // Get user's CHAOS balance
  const { data: balance } = useReadContract({
    contract: chaosCoinContract,
    method: balanceOf,
    params: account ? [account.address] : undefined,
  });

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.allSettled([
          fetchMarketData(),
          fetchTopMovers(), 
          fetchCryptoNews()
        ]);
      } catch (error) {
        console.error("Error initializing page data:", error);
      }
    };

    initializeData();
  }, []);

  const fetchMarketData = async () => {
    try {
      // Fetch token data from DexScreener
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        setMarketData({
          marketCap: pair.marketCap ? `$${(pair.marketCap / 1000000).toFixed(2)}M` : "N/A",
          volume24h: pair.volume?.h24 ? `$${(pair.volume.h24 / 1000000).toFixed(2)}M` : "N/A",
          price: parseFloat(pair.priceUsd || "0")
        });
      } else {
        // Set fallback data if no pairs found
        setMarketData({
          marketCap: "N/A",
          volume24h: "N/A",
          price: 0.000001
        });
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      // Set fallback data on error
      setMarketData({
        marketCap: "N/A",
        volume24h: "N/A",
        price: 0.000001
      });
    }
  };

  const fetchTopMovers = async () => {
    try {
      // Fetch top 100 coins and filter for actual gainers and losers
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        // Filter and sort gainers (positive changes only)
        const gainersFiltered = data
          .filter(coin => coin.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 3);

        // Filter and sort losers (negative changes only)
        const losersFiltered = data
          .filter(coin => coin.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
          .slice(0, 3);

        if (gainersFiltered.length > 0) {
          setGainers(gainersFiltered.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image
          })));
        } else {
          setGainersToFallback();
        }

        if (losersFiltered.length > 0) {
          setLosers(losersFiltered.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image
          })));
        } else {
          setLosersToFallback();
        }
      } else {
        setFallbackMovers();
      }
    } catch (error) {
      console.error("Error fetching movers:", error);
      setFallbackMovers();
    }
  };

  const setFallbackMovers = () => {
    setGainersToFallback();
    setLosersToFallback();
  };

  const setGainersToFallback = () => {
    setGainers([
      { symbol: "BTC", name: "Bitcoin", price: 45000, change: 5.2, icon: "https://via.placeholder.com/32" },
      { symbol: "ETH", name: "Ethereum", price: 3000, change: 3.8, icon: "https://via.placeholder.com/32" },
      { symbol: "SOL", name: "Solana", price: 100, change: 7.1, icon: "https://via.placeholder.com/32" }
    ]);
  };

  const setLosersToFallback = () => {
    setLosers([
      { symbol: "ADA", name: "Cardano", price: 0.5, change: -2.1, icon: "https://via.placeholder.com/32" },
      { symbol: "DOT", name: "Polkadot", price: 7, change: -3.5, icon: "https://via.placeholder.com/32" },
      { symbol: "LINK", name: "Chainlink", price: 15, change: -1.8, icon: "https://via.placeholder.com/32" }
    ]);
  };

  const fetchCryptoNews = async () => {
    try {
      // Using RSS2JSON service for CoinTelegraph news
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss&count=6'
      );
      
      if (!response.ok) {
        throw new Error(`News API error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.status === 'ok' && data.items && data.items.length > 0) {
        const articles = data.items.map(item => ({
          title: item.title || "Crypto News Update",
          excerpt: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : "Latest cryptocurrency news and market updates...",
          timestamp: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Recent",
          image: item.thumbnail || item.enclosure?.link || 'https://via.placeholder.com/300x200?text=Crypto+News',
          url: item.link || "#"
        }));
        setNews(articles);
      } else {
        setFallbackNews();
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setFallbackNews();
    }
  };

  const setFallbackNews = () => {
    const fallbackNews = [
      {
        title: "Bitcoin Market Analysis",
        excerpt: "Technical analysis shows strong support levels as institutional interest continues to grow across major markets...",
        timestamp: "1 hour ago",
        image: "https://via.placeholder.com/300x200?text=Bitcoin+Analysis",
        url: "#"
      },
      {
        title: "Ethereum Development Updates",
        excerpt: "Latest developments in Ethereum ecosystem show promising improvements in scalability and user experience...",
        timestamp: "3 hours ago",
        image: "https://via.placeholder.com/300x200?text=Ethereum+Updates",
        url: "#"
      },
      {
        title: "DeFi Market Growth",
        excerpt: "Decentralized finance protocols continue to see increased activity as total value locked reaches new heights...",
        timestamp: "5 hours ago",
        image: "https://via.placeholder.com/300x200?text=DeFi+Growth",
        url: "#"
      },
      {
        title: "Altcoin Market Trends",
        excerpt: "Market experts analyze current altcoin trends and discuss potential opportunities in the evolving crypto landscape...",
        timestamp: "7 hours ago",
        image: "https://via.placeholder.com/300x200?text=Altcoin+Trends",
        url: "#"
      }
    ];
    setNews(fallbackNews);
  };

  const formatBalance = (balance) => {
    try {
      if (!balance) return "0.00";
      const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
      if (isNaN(tokens)) return "0.00";
      return tokens.toFixed(2);
    } catch (error) {
      console.error("Error formatting balance:", error);
      return "0.00";
    }
  };

  const calculatePortfolioValue = () => {
    try {
      if (!balance || !marketData.price || marketData.price === 0) return "0.00";
      const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
      if (isNaN(tokens)) return "0.00";
      const value = tokens * marketData.price;
      if (isNaN(value)) return "0.00";
      return value.toFixed(2);
    } catch (error) {
      console.error("Error calculating portfolio value:", error);
      return "0.00";
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">

        {/* Portfolio Overview */}
        <div className="portfolio-section">
          <div className="card balance-card">
            <h2 className="section-title">Portfolio Value</h2>
            <div className="balance-amount">${calculatePortfolioValue()}</div>
            <div className={`balance-change ${portfolioChange.amount >= 0 ? 'positive' : 'negative'}`}>
              {portfolioChange.amount >= 0 ? '+' : ''}${Math.abs(portfolioChange.amount).toFixed(2)} 
              ({portfolioChange.percentage >= 0 ? '+' : ''}{portfolioChange.percentage.toFixed(2)}%)
            </div>
            <p className="text-gray">Today's Change</p>
          </div>

          <div className="card">
            <h3 className="section-title">Price Chart</h3>
            <div className="chart-container">
              <p className="text-gray">Live Chart Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Market Statistics */}
        <div className="card">
          <h2 className="section-title">Market Statistics</h2>
          <div className="market-data">
            <div className="market-stat">
              <div className="market-stat-label">Current Price</div>
              <div className="market-stat-value">${marketData.price.toFixed(6)}</div>
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

        {/* Social Links */}
        <div className="card social-section">
          <h2 className="section-title">Follow Chaos Coin</h2>
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

        {/* Top Movers */}
        <div className="card movers-section">
          <h2 className="section-title">Today's Top Movers</h2>
          <div className="movers-container">
            {/* Top Gainers */}
            <div className="movers-column">
              <h3 className="movers-subtitle text-green">🚀 Top Gainers</h3>
              <div className="movers-list">
                {gainers.map((gainer, index) => (
                  <div key={index} className="mover-item">
                    <div className="mover-info">
                      <img src={gainer.icon} alt={gainer.symbol} className="mover-icon" />
                      <div>
                        <div className="mover-symbol">{gainer.symbol}</div>
                        <div className="mover-name">{gainer.name}</div>
                      </div>
                    </div>
                    <div className="mover-price">
                      <div className="mover-value">${gainer.price.toFixed(4)}</div>
                      <div className="mover-change positive">
                        +{gainer.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers */}
            <div className="movers-column">
              <h3 className="movers-subtitle text-red">📉 Top Losers</h3>
              <div className="movers-list">
                {losers.map((loser, index) => (
                  <div key={index} className="mover-item">
                    <div className="mover-info">
                      <img src={loser.icon} alt={loser.symbol} className="mover-icon" />
                      <div>
                        <div className="mover-symbol">{loser.symbol}</div>
                        <div className="mover-name">{loser.name}</div>
                      </div>
                    </div>
                    <div className="mover-price">
                      <div className="mover-value">${loser.price.toFixed(4)}</div>
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

        {/* Crypto News */}
        <div className="card news-section">
          <h2 className="section-title">Latest Crypto News</h2>
          <div className="news-twitter-style">
            {news.map((article, index) => (
              <div key={index} className="news-card-twitter">
                <div className="news-image-twitter">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="news-thumb"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/120x120?text=News';
                    }}
                  />
                </div>
                <div className="news-content-twitter">
                  <h3 className="news-title-twitter">{article.title}</h3>
                  <p className="news-excerpt-twitter">{article.excerpt}</p>
                  <span className="news-timestamp-twitter">{article.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}