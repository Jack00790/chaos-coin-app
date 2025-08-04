
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";
import { getAllCryptoNews } from "../lib/newsApi";
import { sanitizeInput, validateAdmin } from "../lib/security";

export default function News() {
  const account = useActiveAccount();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ 
    content: "", 
    isPinned: false, 
    media: null, 
    mediaType: null,
    poll: null 
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  // Admin wallet address validation
  const ADMIN_WALLET = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;

  useEffect(() => {
    if (account && ADMIN_WALLET) {
      const isAdminUser = validateAdmin(account.address);
      setIsAdmin(isAdminUser);
      console.log('Admin check:', {
        userAddress: account.address,
        adminAddress: ADMIN_WALLET,
        isAdmin: isAdminUser
      });
    }
    fetchPosts();
    fetchNewsData();
  }, [account]);

  const fetchPosts = () => {
    try {
      const savedPosts = localStorage.getItem('chaoscoin_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      } else {
        const defaultPosts = [
          {
            id: 1,
            content: "🚀 Chaos Coin launch is live! Welcome to the future of DeFi on Avalanche!",
            author: "Chaos Team",
            timestamp: new Date().toISOString(),
            isPinned: true,
            type: "admin",
            likes: 42,
            shares: 15,
            replies: 8
          }
        ];
        setPosts(defaultPosts);
        localStorage.setItem('chaoscoin_posts', JSON.stringify(defaultPosts));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
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
    if (!newPost.content.trim() && !newPost.media && !newPost.poll) {
      setError("Please add some content, media, or create a poll");
      return;
    }

    if (!isAdmin) {
      setError(`Unauthorized: Admin access required`);
      return;
    }

    // Security validation and sanitization
    const sanitizedContent = sanitizeInput(newPost.content, 2000);

    const post = {
      id: Date.now(),
      content: sanitizedContent,
      author: "Chaos Team",
      timestamp: new Date().toISOString(),
      isPinned: newPost.isPinned,
      type: "admin",
      likes: 0,
      shares: 0,
      replies: 0,
      media: newPost.media || null,
      mediaType: newPost.mediaType || null,
      poll: newPost.poll || null
    };

    try {
      const updatedPosts = [post, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('chaoscoin_posts', JSON.stringify(updatedPosts));

      setNewPost({ 
        content: "", 
        isPinned: false, 
        media: null, 
        mediaType: null,
        poll: null 
      });
      setError("");
      setSuccess("Post created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to create post. Please try again.");
    }
  };

  const togglePin = (postId) => {
    if (!isAdmin) return;
    
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, isPinned: !post.isPinned }
        : post
    );
    setPosts(updatedPosts);
    localStorage.setItem('chaoscoin_posts', JSON.stringify(updatedPosts));
  };

  const deletePost = (postId) => {
    if (!isAdmin) return;
    
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem('chaoscoin_posts', JSON.stringify(updatedPosts));
  };

  const addPollOption = () => {
    if (!newPost.poll) {
      setNewPost({
        ...newPost,
        poll: {
          question: "",
          options: ["", ""],
          duration: 24,
          votes: {},
          endTime: null
        }
      });
    } else if (newPost.poll.options.length < 4) {
      setNewPost({
        ...newPost,
        poll: {
          ...newPost.poll,
          options: [...newPost.poll.options, ""]
        }
      });
    }
  };

  const updatePollOption = (index, value) => {
    const sanitizedValue = sanitizeInput(value, 100);
    const newOptions = [...newPost.poll.options];
    newOptions[index] = sanitizedValue;
    setNewPost({
      ...newPost,
      poll: {
        ...newPost.poll,
        options: newOptions
      }
    });
  };

  const removePollOption = (index) => {
    if (newPost.poll.options.length > 2) {
      const newOptions = newPost.poll.options.filter((_, i) => i !== index);
      setNewPost({
        ...newPost,
        poll: {
          ...newPost.poll,
          options: newOptions
        }
      });
    }
  };

  const removePoll = () => {
    setNewPost({
      ...newPost,
      poll: null
    });
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please use JPEG, PNG, GIF, WEBP, or MP4.');
        return;
      }

      if (file.size > maxSize) {
        setError('File size too large. Maximum 10MB allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setNewPost({
        ...newPost, 
        media: e.target.result,
        mediaType: file.type.startsWith('video') ? 'video' : 'image'
      });
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "now";
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
        <h1 className="page-title">📰 News & Community</h1>

        {/* Admin Posting Section - Only visible to admin */}
        {account && isAdmin && (
          <div className="card admin-post-creator">
            <div className="admin-badge">
              <span style={{ background: 'linear-gradient(45deg, #10b981, #34d399)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>
                👑 Admin Panel
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <p style={{ color: '#fca5a5', margin: 0 }}>⚠️ {error}</p>
              </div>
            )}

            {success && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                <p style={{ color: '#10b981', margin: 0 }}>✅ {success}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                👑
              </div>

              <div style={{ flex: 1 }}>
                <textarea
                  className="post-textarea"
                  placeholder="What's happening with Chaos Coin? Share updates, announcements, or ask the community..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '16px',
                    outline: 'none',
                    color: '#e5e7eb',
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    padding: '1rem'
                  }}
                />

                {/* Media Preview */}
                {newPost.media && (
                  <div style={{ marginTop: '1rem', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                    {newPost.mediaType === 'video' ? (
                      <video 
                        src={newPost.media} 
                        controls
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                      />
                    ) : (
                      <img 
                        src={newPost.media} 
                        alt="Post media"
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                      />
                    )}
                    <button
                      onClick={() => setNewPost({...newPost, media: null, mediaType: null})}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.8)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Poll Creation */}
                {newPost.poll && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1.5rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: '16px',
                    border: '2px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <h4 style={{ color: '#10b981', marginBottom: '1rem', fontSize: '1rem' }}>📊 Create Poll</h4>
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={newPost.poll.question}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        poll: {...newPost.poll, question: sanitizeInput(e.target.value, 200)}
                      })}
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        fontWeight: '600'
                      }}
                      maxLength={200}
                    />
                    
                    {newPost.poll.options.map((option, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            color: '#e5e7eb',
                            outline: 'none'
                          }}
                          maxLength={100}
                        />
                        {newPost.poll.options.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fca5a5',
                              width: '40px',
                              height: '40px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {newPost.poll.options.length < 4 && (
                          <button
                            onClick={addPollOption}
                            style={{
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid #10b981',
                              borderRadius: '8px',
                              color: '#10b981',
                              padding: '0.5rem 1rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            + Add option
                          </button>
                        )}
                        <select
                          value={newPost.poll.duration}
                          onChange={(e) => setNewPost({
                            ...newPost,
                            poll: {...newPost.poll, duration: parseInt(e.target.value)}
                          })}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#e5e7eb',
                            padding: '0.5rem',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value={1}>1 hour</option>
                          <option value={6}>6 hours</option>
                          <option value={24}>1 day</option>
                          <option value={72}>3 days</option>
                          <option value={168}>7 days</option>
                        </select>
                      </div>
                      <button
                        onClick={removePoll}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          color: '#fca5a5',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Remove poll
                      </button>
                    </div>
                  </div>
                )}

                {/* Post Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Media Upload */}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      style={{ display: 'none' }}
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" style={{ cursor: 'pointer', fontSize: '1.5rem', opacity: 0.7, transition: 'opacity 0.2s' }}>
                      🖼️
                    </label>

                    {/* Poll Button */}
                    <button
                      onClick={addPollOption}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        opacity: newPost.poll ? 1 : 0.7,
                        color: newPost.poll ? '#10b981' : 'inherit'
                      }}
                      disabled={!!newPost.poll}
                    >
                      📊
                    </button>

                    {/* Pin Toggle */}
                    <button
                      onClick={() => setNewPost({...newPost, isPinned: !newPost.isPinned})}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        opacity: newPost.isPinned ? 1 : 0.7,
                        color: newPost.isPinned ? '#10b981' : 'inherit'
                      }}
                    >
                      📌
                    </button>

                    <span style={{ color: '#6b7280', fontSize: '0.9rem', marginLeft: '1rem' }}>
                      {newPost.content.length}/2000
                    </span>
                  </div>

                  <button 
                    className="btn btn-primary"
                    onClick={handleCreatePost}
                    disabled={(!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000}
                    style={{
                      padding: '0.75rem 2rem',
                      borderRadius: '25px',
                      background: ((!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000) 
                        ? 'rgba(107, 114, 128, 0.3)' 
                        : 'linear-gradient(45deg, #10b981, #34d399)',
                      opacity: ((!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000) ? 0.5 : 1,
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}
                  >
                    Post Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Posts Feed */}
        <div className="card">
          <h2 className="section-title">🗣️ Community Updates</h2>

          <div className="news-feed-vertical">
            {sortedPosts.map((post) => (
              <div 
                key={post.id} 
                className="news-item-twitter"
                style={{
                  background: post.isPinned 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'transparent',
                  border: post.isPinned 
                    ? '1px solid rgba(16, 185, 129, 0.2)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}
              >
                {/* Pin indicator */}
                {post.isPinned && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    color: '#10b981',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    📌 <span>Pinned Post</span>
                  </div>
                )}

                <div className="news-item-header">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #10b981, #34d399)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    👑
                  </div>
                  <div className="news-item-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 className="news-item-source" style={{ fontWeight: 'bold' }}>{post.author}</h4>
                      <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>@chaoscoin</span>
                      <span style={{ color: '#6b7280' }}>•</span>
                      <span className="news-item-time">{formatTime(post.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="news-item-content">
                  {post.content && (
                    <div style={{ 
                      marginBottom: '1rem', 
                      lineHeight: '1.6',
                      fontSize: '1.1rem',
                      color: '#e5e7eb'
                    }}>
                      {post.content}
                    </div>
                  )}

                  {/* Media */}
                  {post.media && (
                    <div style={{ marginBottom: '1rem', borderRadius: '16px', overflow: 'hidden' }}>
                      {post.mediaType === 'video' ? (
                        <video 
                          src={post.media} 
                          controls
                          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                        />
                      ) : (
                        <img 
                          src={post.media} 
                          alt="Post media"
                          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  )}

                  {/* Poll Display */}
                  {post.poll && (
                    <div style={{
                      marginBottom: '1rem',
                      padding: '1.5rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '1rem', color: '#e5e7eb', fontSize: '1.1rem' }}>
                        📊 {post.poll.question}
                      </div>
                      {post.poll.options.map((option, index) => (
                        <div key={index} style={{
                          padding: '1rem',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          marginBottom: '0.75rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '1rem'
                        }}>
                          {option}
                        </div>
                      ))}
                      <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '1rem' }}>
                        Poll ends in {post.poll.duration} hours
                      </div>
                    </div>
                  )}

                  {/* Post actions */}
                  <div style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#6b7280' }}>
                      <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                      }}>
                        💬 {post.replies || 0}
                      </button>
                      <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '8px'
                      }}>
                        🔄 {post.shares || 0}
                      </button>
                      <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '8px'
                      }}>
                        ❤️ {post.likes || 0}
                      </button>
                    </div>

                    {/* Admin controls */}
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => togglePin(post.id)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            borderRadius: '20px',
                            color: '#10b981',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          {post.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '20px',
                            color: '#ef4444',
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crypto News Feed */}
        <div className="card">
          <h2 className="section-title">📈 Latest Crypto News</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
              <p className="text-gray">Loading latest news...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-gray">{error}</p>
              <button onClick={fetchNewsData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="news-feed-vertical">
              {news.map((article, index) => (
                <div key={index} className="news-item-twitter">
                  <div className="news-item-header">
                    <img 
                      src={article.image || 'https://cryptonews.com/favicon.ico'}
                      alt={article.source || "News"}
                      className="news-item-image"
                      onError={(e) => {
                        e.target.src = 'https://cryptonews.com/favicon.ico';
                      }}
                    />
                    <div className="news-item-meta">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h4 className="news-item-source">{article.source || "Crypto News"}</h4>
                        <span className="news-item-time">• {new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="news-item-content">
                    <h3 className="news-item-title">{article.title}</h3>
                    <p className="news-item-description">{article.description}</p>
                    {article.url && (
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-item-link">
                        Read full article
                      </a>
                    )}
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
