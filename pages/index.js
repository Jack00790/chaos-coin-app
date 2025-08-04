
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useActiveAccount, useReadContract, useWatchContractEvents } from "thirdweb/react";
import { balanceOf, totalSupply, name, symbol, decimals } from "thirdweb/extensions/erc20";
import Navbar from "../components/Navbar";
import { chaosCoinContract } from "../lib/contract";

export default function Home() {
  const account = useActiveAccount();
  
  // Enhanced state management
  const [marketData, setMarketData] = useState({
    price: 0.000001,
    marketCap: "Loading...",
    volume24h: "Loading...",
    priceChange24h: 0,
    lastUpdated: null,
    source: 'cached'
  });
  
  const [cryptoMovers, setCryptoMovers] = useState({
    gainers: [],
    losers: [],
    lastUpdated: null
  });
  
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState({});

  // Enhanced contract reads with error handling
  const { data: balance, error: balanceError, isLoading: balanceLoading, refetch: refetchBalance } = useReadContract({
    contract: chaosCoinContract,
    method: balanceOf,
    params: account?.address ? [account.address] : undefined,
  });

  const { data: tokenTotalSupply } = useReadContract({
    contract: chaosCoinContract,
    method: totalSupply,
    params: [],
  });

  const { data: tokenName } = useReadContract({
    contract: chaosCoinContract,
    method: name,
    params: [],
  });

  const { data: tokenSymbol } = useReadContract({
    contract: chaosCoinContract,
    method: symbol,
    params: [],
  });

  const { data: tokenDecimals } = useReadContract({
    contract: chaosCoinContract,
    method: decimals,
    params: [],
  });

  // Listen for contract events
  useWatchContractEvents({
    contract: chaosCoinContract,
    onEvents: (events) => {
      console.log("🔄 Contract events detected:", events);
      // Refresh balance when events occur
      if (account?.address) {
        refetchBalance();
      }
    },
  });

  // Memoized calculations
  const tokenInfo = useMemo(() => ({
    name: tokenName || "Chaos Coin",
    symbol: tokenSymbol || "CHAOS",
    decimals: tokenDecimals || 18,
    totalSupply: tokenTotalSupply ? formatTokenAmount(tokenTotalSupply, tokenDecimals || 18) : "Loading..."
  }), [tokenName, tokenSymbol, tokenDecimals, tokenTotalSupply]);

  // Enhanced initialization with retry logic
  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    setErrors({});
    
    const dataPromises = [
      fetchMarketDataWithRetry(),
      fetchCryptoMoversWithRetry(),
      fetchCryptoNewsWithRetry()
    ];

    try {
      const results = await Promise.allSettled(dataPromises);
      
      results.forEach((result, index) => {
        const functionNames = ['marketData', 'cryptoMovers', 'cryptoNews'];
        if (result.status === 'rejected') {
          console.warn(`${functionNames[index]} failed:`, result.reason);
          setErrors(prev => ({ 
            ...prev, 
            [functionNames[index]]: {
              message: result.reason.message,
              timestamp: new Date().toISOString(),
              retryable: true
            }
          }));
        }
      });
    } catch (error) {
      console.error("Critical error initializing app:", error);
      setErrors(prev => ({ 
        ...prev, 
        critical: {
          message: "Failed to initialize application",
          timestamp: new Date().toISOString(),
          retryable: true
        }
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced market data fetching with better error handling
  const fetchMarketDataWithRetry = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      setRefreshing(prev => ({ ...prev, marketData: true }));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Try multiple API endpoints for better reliability
      const apiEndpoints = [
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`,
        `https://api.coingecko.com/api/v3/simple/token_price/avalanche?contract_addresses=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      ];

      let data = null;
      let lastError = null;

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(endpoint, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'ChaosCoin-DApp/1.0'
            }
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
          }

          data = await response.json();
          break; // Success, exit loop
        } catch (error) {
          lastError = error;
          console.warn(`Failed to fetch from ${endpoint}:`, error.message);
        }
      }

      if (!data) {
        throw lastError || new Error("All API endpoints failed");
      }

      // Process DexScreener data
      if (data?.pairs?.length > 0) {
        const pair = data.pairs[0];
        setMarketData({
          price: parseFloat(pair.priceUsd || "0.000001"),
          marketCap: pair.marketCap ? `$${(pair.marketCap / 1000000).toFixed(2)}M` : "N/A",
          volume24h: pair.volume?.h24 ? `$${(pair.volume.h24 / 1000000).toFixed(2)}M` : "N/A",
          priceChange24h: parseFloat(pair.priceChange?.h24 || "0"),
          lastUpdated: new Date().toISOString(),
          source: 'dexscreener'
        });
      } else if (data[process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS?.toLowerCase()]) {
        // Process CoinGecko data
        const tokenData = data[process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS.toLowerCase()];
        setMarketData({
          price: tokenData.usd || 0.000001,
          marketCap: tokenData.usd_market_cap ? `$${(tokenData.usd_market_cap / 1000000).toFixed(2)}M` : "N/A",
          volume24h: tokenData.usd_24h_vol ? `$${(tokenData.usd_24h_vol / 1000000).toFixed(2)}M` : "N/A",
          priceChange24h: tokenData.usd_24h_change || 0,
          lastUpdated: new Date().toISOString(),
          source: 'coingecko'
        });
      } else {
        throw new Error("No valid market data found");
      }

      // Clear any previous errors
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.marketData;
        return newErrors;
      });

    } catch (error) {
      console.warn(`Market data fetch attempt ${retryCount + 1} failed:`, error.message);
      
      if (retryCount < maxRetries && error.name !== 'AbortError') {
        setTimeout(() => fetchMarketDataWithRetry(retryCount + 1), retryDelay);
        return;
      }

      // Fallback data with enhanced info
      setMarketData({
        price: 0.000001,
        marketCap: "N/A",
        volume24h: "N/A",
        priceChange24h: 0,
        lastUpdated: new Date().toISOString(),
        source: 'fallback'
      });

      setErrors(prev => ({ 
        ...prev, 
        marketData: {
          message: `Failed to fetch market data after ${maxRetries + 1} attempts`,
          timestamp: new Date().toISOString(),
          retryable: true
        }
      }));
    } finally {
      setRefreshing(prev => ({ ...prev, marketData: false }));
    }
  }, []);

  // Enhanced crypto movers with better data processing
  const fetchCryptoMoversWithRetry = useCallback(async (retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      setRefreshing(prev => ({ ...prev, cryptoMovers: true }));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
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
        // Filter out stablecoins and sort properly
        const filteredData = data.filter(coin => 
          coin.price_change_percentage_24h !== null &&
          !['tether', 'usd-coin', 'binance-usd', 'dai', 'terrausd'].includes(coin.id)
        );

        const gainers = filteredData
          .filter(coin => coin.price_change_percentage_24h > 0)
          .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
          .slice(0, 3)
          .map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image,
            marketCap: coin.market_cap
          }));

        const losers = filteredData
          .filter(coin => coin.price_change_percentage_24h < 0)
          .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
          .slice(0, 3)
          .map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change: coin.price_change_percentage_24h,
            icon: coin.image,
            marketCap: coin.market_cap
          }));

        setCryptoMovers({ 
          gainers, 
          losers, 
          lastUpdated: new Date().toISOString() 
        });

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.cryptoMovers;
          return newErrors;
        });
      } else {
        throw new Error("Invalid market data received");
      }
    } catch (error) {
      if (retryCount < maxRetries && error.name !== 'AbortError') {
        setTimeout(() => fetchCryptoMoversWithRetry(retryCount + 1), 2000);
        return;
      }

      // Enhanced fallback data
      setCryptoMovers({
        gainers: [
          { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 45000, change: 5.2, icon: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png", marketCap: 900000000000 },
          { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3000, change: 3.8, icon: "https://assets.coingecko.com/coins/images/279/large/ethereum.png", marketCap: 360000000000 },
          { id: "solana", symbol: "SOL", name: "Solana", price: 100, change: 7.1, icon: "https://assets.coingecko.com/coins/images/4128/large/solana.png", marketCap: 45000000000 }
        ],
        losers: [
          { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.5, change: -2.1, icon: "https://assets.coingecko.com/coins/images/975/large/cardano.png", marketCap: 17000000000 },
          { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 7, change: -3.5, icon: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png", marketCap: 8500000000 },
          { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 15, change: -1.8, icon: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png", marketCap: 8500000000 }
        ],
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setRefreshing(prev => ({ ...prev, cryptoMovers: false }));
    }
  }, []);

  // Enhanced news fetching with multiple sources
  const fetchCryptoNewsWithRetry = useCallback(async () => {
    try {
      setRefreshing(prev => ({ ...prev, news: true }));
      
      // Multiple RSS sources for better coverage
      const newsSources = [
        'https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss&count=4',
        'https://api.rss2json.com/v1/api.json?rss_url=https://decrypt.co/feed&count=3'
      ];

      const newsPromises = newsSources.map(async (source) => {
        try {
          const response = await fetch(source, {
            headers: { 'Accept': 'application/json' }
          });
          return response.ok ? await response.json() : null;
        } catch {
          return null;
        }
      });

      const results = await Promise.allSettled(newsPromises);
      let allArticles = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.status === 'ok') {
          const articles = result.value.items.map(item => ({
            title: item.title || "Crypto Market Update",
            excerpt: (item.description || item.content || "Latest cryptocurrency news and market analysis...")
              .replace(/<[^>]*>/g, '')
              .substring(0, 140) + '...',
            timestamp: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : "Recent",
            image: item.thumbnail || item.enclosure?.link || 'https://cryptonews.com/favicon.ico',
            url: item.link || "#",
            source: item.author || "Crypto News",
            sourceImage: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png",
            id: item.guid || Math.random().toString(36)
          }));
          allArticles = [...allArticles, ...articles];
        }
      });

      if (allArticles.length > 0) {
        // Remove duplicates and limit to 7 articles
        const uniqueArticles = allArticles
          .filter((article, index, self) => 
            index === self.findIndex(a => a.title === article.title)
          )
          .slice(0, 7);
        setNews(uniqueArticles);
      } else {
        throw new Error("No news sources available");
      }

    } catch (error) {
      // Enhanced fallback news with more variety
      setNews([
        {
          title: "CHAOS Token Achieves New Milestone",
          excerpt: "The CHAOS token continues to build momentum with new DeFi integrations and community-driven initiatives across the Avalanche network...",
          timestamp: "2 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "CHAOS News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          id: "chaos1"
        },
        {
          title: "Avalanche Network Performance Surge",
          excerpt: "Avalanche sees continued adoption as developers build innovative DeFi solutions with fast transaction speeds and low fees...",
          timestamp: "4 hours ago",
          image: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
          url: "#",
          source: "Avalanche News",
          sourceImage: "https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png",
          id: "avax1"
        },
        {
          title: "DeFi Market Shows Bullish Momentum",
          excerpt: "Decentralized finance protocols show strong fundamentals as total value locked increases and user adoption grows steadily...",
          timestamp: "6 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "DeFi Pulse",
          sourceImage: "https://cryptonews.com/favicon.ico",
          id: "defi1"
        },
        {
          title: "Institutional Crypto Investment Boom",
          excerpt: "Market analysis shows positive sentiment as institutional interest continues to drive adoption of digital assets worldwide...",
          timestamp: "8 hours ago",
          image: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b33b32294.png",
          url: "#",
          source: "CoinTelegraph",
          sourceImage: "https://s3.cointelegraph.com/storage/uploads/view/9b8b7e22de62a6af6e30a25b32294.png",
          id: "inst1"
        },
        {
          title: "Web3 Gaming Revolution Continues",
          excerpt: "Gaming tokens and NFTs show resilience as blockchain gaming platforms introduce innovative play-to-earn mechanics...",
          timestamp: "10 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "Gaming News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          id: "gaming1"
        },
        {
          title: "Smart Contract Security Enhancement",
          excerpt: "New audit protocols and security frameworks emerge to protect DeFi users from potential vulnerabilities and exploits...",
          timestamp: "12 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "Security News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          id: "security1"
        },
        {
          title: "Cross-Chain Interoperability Breakthrough",
          excerpt: "Major developments in blockchain bridges and cross-chain protocols enable seamless asset transfers between networks...",
          timestamp: "14 hours ago",
          image: "https://cryptonews.com/favicon.ico",
          url: "#",
          source: "Tech News",
          sourceImage: "https://cryptonews.com/favicon.ico",
          id: "tech1"
        }
      ]);
    } finally {
      setRefreshing(prev => ({ ...prev, news: false }));
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    initializeApp();
    
    // Set up auto-refresh intervals
    const marketDataInterval = setInterval(() => {
      if (!refreshing.marketData) {
        fetchMarketDataWithRetry();
      }
    }, 30000); // Every 30 seconds

    const cryptoMoversInterval = setInterval(() => {
      if (!refreshing.cryptoMovers) {
        fetchCryptoMoversWithRetry();
      }
    }, 60000); // Every minute

    const newsInterval = setInterval(() => {
      if (!refreshing.news) {
        fetchCryptoNewsWithRetry();
      }
    }, 300000); // Every 5 minutes

    return () => {
      clearInterval(marketDataInterval);
      clearInterval(cryptoMoversInterval);
      clearInterval(newsInterval);
    };
  }, [initializeApp, fetchMarketDataWithRetry, fetchCryptoMoversWithRetry, fetchCryptoNewsWithRetry, refreshing]);

  // Utility functions
  const formatTokenAmount = useCallback((amount, decimals = 18) => {
    if (!amount) return "0.00";
    try {
      const tokens = parseFloat(amount.toString()) / Math.pow(10, decimals);
      return isNaN(tokens) ? "0.00" : tokens.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
      });
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return "0.00";
    }
  }, []);

  const formatBalance = useCallback((balance) => {
    return formatTokenAmount(balance, tokenInfo.decimals);
  }, [formatTokenAmount, tokenInfo.decimals]);

  const calculatePortfolioValue = useCallback(() => {
    if (!balance || !marketData.price) return "0.00";
    try {
      const tokens = parseFloat(balance.toString()) / Math.pow(10, tokenInfo.decimals);
      const value = tokens * marketData.price;
      return isNaN(value) ? "0.00" : value.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    } catch (error) {
      console.error("Error calculating portfolio value:", error);
      return "0.00";
    }
  }, [balance, marketData.price, tokenInfo.decimals]);

  const handleRefresh = useCallback(async (section) => {
    switch (section) {
      case 'marketData':
        await fetchMarketDataWithRetry();
        break;
      case 'cryptoMovers':
        await fetchCryptoMoversWithRetry();
        break;
      case 'news':
        await fetchCryptoNewsWithRetry();
        break;
      case 'all':
        await initializeApp();
        break;
      default:
        break;
    }
  }, [fetchMarketDataWithRetry, fetchCryptoMoversWithRetry, fetchCryptoNewsWithRetry, initializeApp]);

  if (isLoading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card loading-card">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="loading-spinner"></div>
              <h2 style={{ margin: '1rem 0', color: '#10b981' }}>Loading CHAOS Dashboard</h2>
              <p className="text-gray">Fetching your portfolio and market data...</p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                {Object.keys(errors).length > 0 && (
                  <p>Some services may be using cached data</p>
                )}
              </div>
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
        
        {/* Enhanced Portfolio Overview Section */}
        <div className="portfolio-section">
          <div className="card balance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="section-title">Portfolio Overview</h2>
              <button 
                onClick={() => handleRefresh('all')} 
                className="refresh-btn"
                disabled={Object.values(refreshing).some(Boolean)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {Object.values(refreshing).some(Boolean) ? (
                  <>🔄 Refreshing...</>
                ) : (
                  <>🔄 Refresh</>
                )}
              </button>
            </div>
            <div className="balance-display">
              <div className="balance-amount">${calculatePortfolioValue()}</div>
              <div className="balance-tokens">
                {formatBalance(balance)} {tokenInfo.symbol}
              </div>
              <div className={`balance-change ${marketData.priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}% (24h)
              </div>
              {marketData.lastUpdated && (
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Last updated: {new Date(marketData.lastUpdated).toLocaleTimeString()}
                  {marketData.source !== 'fallback' && (
                    <span style={{ color: '#10b981' }}> • Live</span>
                  )}
                </div>
              )}
            </div>
            {balanceError && (
              <div className="error-message">
                <span>⚠️ Balance fetch error. Please refresh or check wallet connection.</span>
              </div>
            )}
          </div>

          <div className="card market-overview-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="section-title">{tokenInfo.name} Market Data</h3>
              <button 
                onClick={() => handleRefresh('marketData')} 
                className="refresh-btn"
                disabled={refreshing.marketData}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {refreshing.marketData ? '🔄' : '🔄'}
              </button>
            </div>
            <div className="market-data-grid">
              <div className="market-stat">
                <div className="market-stat-label">Current Price</div>
                <div className="market-stat-value">
                  ${marketData.price.toFixed(8)}
                  {marketData.source === 'fallback' && (
                    <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '0.5rem' }}>
                      (Cached)
                    </span>
                  )}
                </div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">Market Cap</div>
                <div className="market-stat-value">{marketData.marketCap}</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">24h Volume</div>
                <div className="market-stat-value">{marketData.volume24h}</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">Total Supply</div>
                <div className="market-stat-value">{tokenInfo.totalSupply}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Social Media Links */}
        <div className="card social-section">
          <h2 className="section-title">🌐 Join the CHAOS Community</h2>
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

        {/* Enhanced Market Movers */}
        <div className="card movers-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title">📈 Today's Market Movers</h2>
            <button 
              onClick={() => handleRefresh('cryptoMovers')} 
              className="refresh-btn"
              disabled={refreshing.cryptoMovers}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              {refreshing.cryptoMovers ? '🔄' : '🔄'}
            </button>
          </div>
          <div className="movers-container">
            <div className="movers-column">
              <h3 className="movers-subtitle text-green">🚀 Top Gainers</h3>
              <div className="movers-list">
                {cryptoMovers.gainers.map((gainer, index) => (
                  <div key={`gainer-${gainer.id || index}`} className="mover-item">
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
                      <div className="mover-value">
                        ${gainer.price < 1 ? gainer.price.toFixed(6) : gainer.price.toLocaleString()}
                      </div>
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
                  <div key={`loser-${loser.id || index}`} className="mover-item">
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
                      <div className="mover-value">
                        ${loser.price < 1 ? loser.price.toFixed(6) : loser.price.toLocaleString()}
                      </div>
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

        {/* Enhanced Crypto News */}
        <div className="card news-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="section-title">📰 Latest Crypto News</h2>
            <button 
              onClick={() => handleRefresh('news')} 
              className="refresh-btn"
              disabled={refreshing.news}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              {refreshing.news ? '🔄' : '🔄'}
            </button>
          </div>
          <div className="news-feed-vertical">
            {news.map((article, index) => (
              <div key={article.id || `news-${index}`} className="news-item-twitter">
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
                      Read full article
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced System Status */}
        {Object.keys(errors).length > 0 && (
          <div className="card system-status">
            <h3 className="section-title">⚠️ System Status</h3>
            <div className="status-grid">
              {Object.entries(errors).map(([service, error]) => (
                <div key={service} className="status-item error">
                  <div>
                    <span className="status-label">{service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.2rem' }}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="status-value">Degraded</span>
                </div>
              ))}
            </div>
            <p className="text-gray" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Some services are experiencing issues. Fallback data is being used where possible.
              Data will automatically refresh when services recover.
            </p>
          </div>
        )}

        {/* Connection Status */}
        {account && (
          <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 className="section-title">🔗 Wallet Connection</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="market-stat">
                <div className="market-stat-label">Connected Address</div>
                <div className="market-stat-value" style={{ fontSize: '0.8rem' }}>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">Network</div>
                <div className="market-stat-value">Avalanche</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-label">Balance Status</div>
                <div className="market-stat-value">
                  {balanceLoading ? 'Loading...' : balanceError ? 'Error' : 'Updated'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
