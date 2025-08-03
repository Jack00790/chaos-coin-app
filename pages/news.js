import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";
import { getAllCryptoNews } from "../lib/newsApi";

export default function News() {
  const account = useActiveAccount();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: "", isPinned: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin wallet address - replace with your actual admin wallet
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

  useEffect(() => {
    if (account) {
      setIsAdmin(account.address.toLowerCase() === ADMIN_WALLET?.toLowerCase());
    }
    fetchPosts();
    fetchNewsData();
  }, [account]);

  const fetchPosts = () => {
    // In a real app, fetch from your backend/database
    const samplePosts = [
      {
        id: 1,
        content: "🚀 Chaos Coin launch is live! Welcome to the future of DeFi!",
        author: "Chaos Team",
        timestamp: new Date().toISOString(),
        isPinned: true,
        type: "admin",
        likes: 42,
        shares: 15
      }
    ];
    setPosts(samplePosts);
  };

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const cryptoNews = await getAllCryptoNews();
      setNews(cryptoNews);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;

    const post = {
      id: Date.now(),
      content: newPost.content,
      author: "Chaos Team",
      timestamp: new Date().toISOString(),
      isPinned: newPost.isPinned,
      type: "admin",
      likes: 0,
      shares: 0
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ content: "", isPinned: false });
    setShowAdminPanel(false);
  };

  const togglePin = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, isPinned: !post.isPinned }
        : post
    ));
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Now";
  };

  // Sort posts: pinned first, then by timestamp
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">News & Updates</h1>

        {/* Admin Panel */}
        {isAdmin && (
          <div className="card admin-panel">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h2 className="section-title">Admin Panel</h2>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
              >
                {showAdminPanel ? 'Hide' : 'Create Post'}
              </button>
            </div>

            {showAdminPanel && (
              <div className="post-creator">
                <textarea
                  className="post-textarea"
                  placeholder="What's happening with Chaos Coin? Share updates, announcements, or thoughts..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                />

                <div className="post-actions">
                  <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <input
                      type="checkbox"
                      checked={newPost.isPinned}
                      onChange={(e) => setNewPost({...newPost, isPinned: e.target.checked})}
                    />
                    📌 Pin this post
                  </label>

                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setShowAdminPanel(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleCreatePost}
                      disabled={!newPost.content.trim()}
                    >
                      Post Update
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* News Feed */}
        <div className="card">
          <h2 className="section-title">Latest Updates</h2>

          <div style={{display: 'grid', gap: '1rem'}}>
            {sortedPosts.map((post) => (
              <div 
                key={post.id} 
                style={{
                  padding: '1.5rem',
                  background: post.isPinned 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${post.isPinned 
                    ? 'rgba(16, 185, 129, 0.3)' 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '12px',
                  position: 'relative'
                }}
              >
                {/* Pin indicator */}
                {post.isPinned && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#10b981',
                    color: '#000',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    📌 PINNED
                  </div>
                )}

                {/* Post header */}
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: post.type === 'admin' 
                      ? 'linear-gradient(45deg, #10b981, #34d399)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {post.type === 'admin' ? '👑' : '📰'}
                  </div>
                  <div>
                    <div style={{fontWeight: 'bold'}}>{post.author}</div>
                    <div style={{fontSize: '0.9rem', color: '#9ca3af'}}>
                      {formatTime(post.timestamp)}
                      {post.source && ` • ${post.source}`}
                    </div>
                  </div>
                </div>

                {/* Post content */}
                <div style={{marginBottom: '1rem', lineHeight: '1.6'}}>
                  {post.content}
                </div>

                {/* Post actions */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div style={{display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#9ca3af'}}>
                    {post.likes !== undefined && (
                      <span>❤️ {post.likes}</span>
                    )}
                    {post.shares !== undefined && (
                      <span>🔄 {post.shares}</span>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && post.type === 'admin' && (
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button
                        onClick={() => togglePin(post.id)}
                        className="btn btn-secondary"
                        style={{padding: '0.25rem 0.5rem', fontSize: '0.8rem'}}
                      >
                        {post.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="btn"
                        style={{
                          padding: '0.25rem 0.5rem', 
                          fontSize: '0.8rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
         {/* Crypto News Feed */}
        <div className="card">
          <h2 className="section-title">Latest Crypto News</h2>
          {loading ? (
            <div className="text-center">
              <span className="spinner"></span>
              <p className="text-gray">Loading news...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-gray">{error}</p>
              <button onClick={fetchNewsData} className="btn btn-primary" style={{marginTop: '1rem'}}>
                Retry
              </button>
            </div>
          ) : (
            <div className="news-grid">
              {news.map((article, index) => (
                <div key={index} className="news-item">
                  {article.image && (
                    <img 
                      src={article.image} 
                      alt={article.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  <h3 className="news-title">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{color: 'inherit', textDecoration: 'none'}}
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="news-excerpt">{article.description}</p>
                  <div className="news-meta">
                    <span>{article.source}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}