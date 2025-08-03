
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
    fetchMarketData();
    fetchTopMovers();
    fetchCryptoNews();
  }, []);

  const fetchMarketData = async () => {
    try {
      // Fetch token data from DexScreener
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
      );
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0];
        setMarketData({
          marketCap: pair.marketCap ? `$${(pair.marketCap / 1000000).toFixed(2)}M` : "N/A",
          volume24h: pair.volume?.h24 ? `$${(pair.volume.h24 / 1000000).toFixed(2)}M` : "N/A",
          price: parseFloat(pair.priceUsd || "0")
        });
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
    }
  };

  const fetchTopMovers = async () => {
    try {
      // Fetch top gainers
      const gainersResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=3&page=1&sparkline=false'
      );
      const gainersData = await gainersResponse.json();
      
      // Fetch top losers
      const losersResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_asc&per_page=3&page=1&sparkline=false'
      );
      const losersData = await losersResponse.json();
      
      setGainers(gainersData.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_percentage_24h,
        icon: coin.image
      })));
      
      setLosers(losersData.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change: coin.price_change_percentage_24h,
        icon: coin.image
      })));
    } catch (error) {
      console.error("Error fetching movers:", error);
    }
  };

  const fetchCryptoNews = async () => {
    try {
      // Using RSS2JSON service for CoinTelegraph news
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss&count=6'
      );
      const data = await response.json();
      
      if (data.status === 'ok' && data.items) {
        const articles = data.items.map(item => ({
          title: item.title,
          excerpt: item.description?.replace(/<[^>]*>/g, '').substring(0, 120) + '...',
          timestamp: new Date(item.pubDate).toLocaleDateString(),
          image: item.thumbnail || item.enclosure?.link || 'https://via.placeholder.com/300x200?text=Crypto+News',
          url: item.link
        }));
        setNews(articles);
      } else {
        // Fallback news with placeholder images
        const fallbackNews = [
          {
            title: "Bitcoin Reaches New All-Time High",
            excerpt: "Bitcoin price surges past previous records amid institutional adoption and growing mainstream acceptance...",
            timestamp: "2 hours ago",
            image: "https://via.placeholder.com/300x200?text=Bitcoin+ATH",
            url: "#"
          },
          {
            title: "Ethereum 2.0 Update Shows Promise",
            excerpt: "Latest developments in Ethereum's proof-of-stake transition show significant improvements in scalability...",
            timestamp: "4 hours ago",
            image: "https://via.placeholder.com/300x200?text=Ethereum+2.0",
            url: "#"
          },
          {
            title: "DeFi Market Continues Growth",
            excerpt: "Decentralized finance protocols see increased activity as total value locked reaches new milestones...",
            timestamp: "6 hours ago",
            image: "https://via.placeholder.com/300x200?text=DeFi+Growth",
            url: "#"
          }
        ];
        setNews(fallbackNews);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Set fallback news on error
      const fallbackNews = [
        {
          title: "Bitcoin Market Analysis",
          excerpt: "Technical analysis shows strong support levels as institutional interest continues to grow...",
          timestamp: "1 hour ago",
          image: "https://via.placeholder.com/300x200?text=Bitcoin+Analysis",
          url: "#"
        },
        {
          title: "Altcoin Season Predictions",
          excerpt: "Market experts discuss the potential for altcoin momentum in the current market cycle...",
          timestamp: "3 hours ago",
          image: "https://via.placeholder.com/300x200?text=Altcoin+Season",
          url: "#"
        }
      ];
      setNews(fallbackNews);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return "0.00";
    const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
    return tokens.toFixed(2);
  };

  const calculatePortfolioValue = () => {
    if (!balance || !marketData.price) return "0.00";
    const tokens = parseFloat(balance.toString()) / Math.pow(10, 18);
    return (tokens * marketData.price).toFixed(2);
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Chaos Coin Dashboard</h1>

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
            <a href="https://twitter.com/chaoscoin" className="social-link" target="_blank" rel="noopener noreferrer">
              <span>🐦</span> Twitter
            </a>
            <a href="https://t.me/chaoscoinofficial" className="social-link" target="_blank" rel="noopener noreferrer">
              <span>📱</span> Telegram
            </a>
            <a href="https://discord.gg/chaoscoinofficial" className="social-link" target="_blank" rel="noopener noreferrer">
              <span>💬</span> Discord
            </a>
            <a href="https://instagram.com/chaoscoin" className="social-link" target="_blank" rel="noopener noreferrer">
              <span>📷</span> Instagram
            </a>
            <a href="https://tiktok.com/@chaoscoin" className="social-link" target="_blank" rel="noopener noreferrer">
              <span>🎵</span> TikTok
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
          <div className="news-grid-robinhood">
            {news.map((article, index) => (
              <div key={index} className="news-card">
                <div className="news-image-container">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="news-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Crypto+News';
                    }}
                  />
                </div>
                <div className="news-content">
                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-excerpt">{article.excerpt}</p>
                  <div className="news-meta">
                    <span className="news-timestamp">{article.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
