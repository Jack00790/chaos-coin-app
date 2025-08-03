
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function News() {
  const [posts, setPosts] = useState([]);
  const [cryptoNews, setCryptoNews] = useState([]);

  useEffect(() => {
    // In a real app, you'd fetch posts from your backend/database
    // For now, using localStorage to persist admin posts
    const savedPosts = localStorage.getItem('chaosCoinPosts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    }

    // Fetch crypto news (you can replace with actual news API)
    fetchCryptoNews();
  }, []);

  const fetchCryptoNews = async () => {
    // Mock crypto news - replace with actual API
    const mockNews = [
      {
        id: 1,
        title: "Bitcoin Reaches New Heights",
        summary: "Bitcoin continues its bullish trend...",
        timestamp: new Date().toISOString(),
        source: "CoinDesk"
      },
      {
        id: 2,
        title: "DeFi Market Update",
        summary: "Decentralized finance shows strong growth...",
        timestamp: new Date().toISOString(),
        source: "CoinTelegraph"
      }
    ];
    setCryptoNews(mockNews);
  };

  // Separate pinned and regular posts
  const pinnedPosts = posts.filter(post => post.pinned);
  const regularPosts = posts.filter(post => !post.pinned);

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="title">Chaos Coin News & Updates</h1>
        
        {/* Pinned Posts */}
        {pinnedPosts.length > 0 && (
          <div className="card">
            <h2 className="section-title">📌 Pinned Announcements</h2>
            <div className="news-feed">
              {pinnedPosts.map(post => (
                <div key={post.id} className="news-item pinned-post">
                  <div className="news-header">
                    <strong>{post.author}</strong>
                    <span className="pin-badge">📌 Pinned</span>
                  </div>
                  <div className="news-content">
                    <p>{post.text}</p>
                    {post.media && (
                      <div className="news-media">
                        {post.mediaType === 'image' ? (
                          <img src={post.media} alt="Post media" className="news-image" />
                        ) : (
                          <video src={post.media} controls className="news-video" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="news-timestamp">
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Updates */}
        {regularPosts.length > 0 && (
          <div className="card">
            <h2 className="section-title">Official Updates</h2>
            <div className="news-feed">
              {regularPosts.map(post => (
                <div key={post.id} className="news-item">
                  <div className="news-header">
                    <strong>{post.author}</strong>
                  </div>
                  <div className="news-content">
                    <p>{post.text}</p>
                    {post.media && (
                      <div className="news-media">
                        {post.mediaType === 'image' ? (
                          <img src={post.media} alt="Post media" className="news-image" />
                        ) : (
                          <video src={post.media} controls className="news-video" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="news-timestamp">
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crypto News */}
        <div className="card">
          <h2 className="section-title">Crypto Market News</h2>
          <div className="news-feed">
            {cryptoNews.map(article => (
              <div key={article.id} className="news-item crypto-news">
                <div className="news-header">
                  <strong>{article.source}</strong>
                </div>
                <div className="news-content">
                  <h3>{article.title}</h3>
                  <p>{article.summary}</p>
                </div>
                <div className="news-timestamp">
                  {new Date(article.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
