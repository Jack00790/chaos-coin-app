import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";
import { getAllCryptoNews } from "../lib/newsApi";

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
    if (!newPost.content.trim() && !newPost.media && !newPost.poll) return;

    // Security validation
    const sanitizedContent = newPost.content.trim().slice(0, 2000); // Limit length

    if (!isAdmin) {
      setError("Unauthorized: Admin access required");
      return;
    }

    const post = {
      id: Date.now(),
      content: sanitizedContent,
      author: "Chaos Team",
      timestamp: new Date().toISOString(),
      isPinned: newPost.isPinned,
      type: "admin",
      likes: 0,
      shares: 0,
      retweets: 0,
      media: newPost.media || null,
      mediaType: newPost.mediaType || null,
      poll: newPost.poll || null
    };

    try {
      setPosts(prev => [post, ...prev]);
      setNewPost({ 
        content: "", 
        isPinned: false, 
        media: null, 
        mediaType: null,
        poll: null 
      });
      setShowAdminPanel(false);
      setError("");
    } catch (err) {
      setError("Failed to create post. Please try again.");
    }
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

  const addPollOption = () => {
    if (!newPost.poll) {
      setNewPost({
        ...newPost,
        poll: {
          question: "",
          options: ["", ""],
          duration: 24, // hours
          votes: {}
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
    const newOptions = [...newPost.poll.options];
    newOptions[index] = value;
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

        {/* Twitter-Style Admin Posting */}
        {isAdmin && (
          <div className="card twitter-compose">
            <div style={{display: 'flex', gap: '1rem'}}>
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
              
              <div style={{flex: 1}}>
                <textarea
                  className="twitter-compose-textarea"
                  placeholder="What's happening with Chaos Coin?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  maxLength={2000}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#e5e7eb',
                    fontSize: '1.2rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    fontFamily: 'inherit'
                  }}
                />

                {/* Media Preview */}
                {newPost.media && (
                  <div style={{marginTop: '1rem', position: 'relative', borderRadius: '16px', overflow: 'hidden'}}>
                    {newPost.mediaType === 'video' ? (
                      <video 
                        src={newPost.media} 
                        controls
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <img 
                        src={newPost.media} 
                        alt="Post media"
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'cover'
                        }}
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
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Poll Preview */}
                {newPost.poll && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <input
                      type="text"
                      placeholder="Ask a question..."
                      value={newPost.poll.question}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        poll: {...newPost.poll, question: e.target.value}
                      })}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#e5e7eb',
                        fontSize: '1rem',
                        marginBottom: '1rem',
                        fontWeight: '600'
                      }}
                    />
                    {newPost.poll.options.map((option, index) => (
                      <div key={index} style={{display: 'flex', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#e5e7eb',
                            outline: 'none'
                          }}
                        />
                        {newPost.poll.options.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            style={{
                              background: 'rgba(239,68,68,0.2)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#fca5a5',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                      <div style={{display: 'flex', gap: '1rem'}}>
                        {newPost.poll.options.length < 4 && (
                          <button
                            onClick={addPollOption}
                            style={{
                              background: 'transparent',
                              border: '1px solid #10b981',
                              borderRadius: '6px',
                              color: '#10b981',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
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
                            borderRadius: '6px',
                            color: '#e5e7eb',
                            padding: '0.25rem',
                            fontSize: '0.8rem'
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
                          background: 'rgba(239,68,68,0.2)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fca5a5',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Remove poll
                      </button>
                    </div>
                  </div>
                )}

                {/* Compose Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    {/* Media Upload */}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => setNewPost({
                            ...newPost, 
                            media: e.target.result,
                            mediaType: file.type.startsWith('video') ? 'video' : 'image'
                          });
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{display: 'none'}}
                      id="media-upload"
                    />
                    <label htmlFor="media-upload" style={{cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7}}>
                      🖼️
                    </label>

                    {/* Poll Button */}
                    <button
                      onClick={addPollOption}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        opacity: 0.7
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
                        fontSize: '1.2rem',
                        opacity: newPost.isPinned ? 1 : 0.7,
                        color: newPost.isPinned ? '#10b981' : 'inherit'
                      }}
                    >
                      📌
                    </button>

                    <span style={{color: '#6b7280', fontSize: '0.9rem', marginLeft: 'auto'}}>
                      {newPost.content.length}/2000
                    </span>
                  </div>

                  <button 
                    className="btn btn-primary"
                    onClick={handleCreatePost}
                    disabled={(!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000}
                    style={{
                      padding: '0.5rem 1.5rem',
                      borderRadius: '20px',
                      background: ((!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000) 
                        ? 'rgba(107, 114, 128, 0.3)' 
                        : '#10b981',
                      opacity: ((!newPost.content.trim() && !newPost.media && !newPost.poll) || newPost.content.length > 2000) ? 0.5 : 1,
                      fontWeight: '600'
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Twitter-Style Posts Feed */}
        <div className="card">
          <h2 className="section-title">Latest Updates</h2>

          <div className="twitter-feed" style={{display: 'flex', flexDirection: 'column', gap: '0'}}>
            {sortedPosts.map((post) => (
              <div 
                key={post.id} 
                className="twitter-post"
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  background: post.isPinned 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'transparent',
                  position: 'relative'
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
                    fontSize: '0.9rem'
                  }}>
                    📌 <span>Pinned</span>
                  </div>
                )}

                {/* Post header */}
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '1rem'}}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: post.type === 'admin' 
                      ? 'linear-gradient(45deg, #10b981, #34d399)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    {post.type === 'admin' ? '👑' : '📰'}
                  </div>
                  
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                      <span style={{fontWeight: 'bold', color: '#e5e7eb'}}>{post.author}</span>
                      <span style={{color: '#6b7280'}}>@chaoscoin</span>
                      <span style={{color: '#6b7280'}}>•</span>
                      <span style={{color: '#6b7280', fontSize: '0.9rem'}}>
                        {formatTime(post.timestamp)}
                      </span>
                    </div>

                    {/* Post content */}
                    {post.content && (
                      <div style={{
                        marginBottom: '1rem', 
                        lineHeight: '1.6',
                        fontSize: '1rem',
                        color: '#e5e7eb'
                      }}>
                        {post.content}
                      </div>
                    )}

                    {/* Media */}
                    {post.media && (
                      <div style={{marginBottom: '1rem', borderRadius: '16px', overflow: 'hidden'}}>
                        {post.mediaType === 'video' ? (
                          <video 
                            src={post.media} 
                            controls
                            style={{
                              width: '100%',
                              maxHeight: '400px',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <img 
                            src={post.media} 
                            alt="Post media"
                            style={{
                              width: '100%',
                              maxHeight: '400px',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Poll */}
                    {post.poll && (
                      <div style={{
                        marginBottom: '1rem',
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{fontWeight: '600', marginBottom: '1rem', color: '#e5e7eb'}}>
                          {post.poll.question}
                        </div>
                        {post.poll.options.map((option, index) => (
                          <div key={index} style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            marginBottom: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}>
                            {option}
                          </div>
                        ))}
                        <div style={{fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem'}}>
                          {post.poll.duration} hours remaining
                        </div>
                      </div>
                    )}

                    {/* Post actions */}
                    <div style={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '0.5rem'
                    }}>
                      <div style={{display: 'flex', gap: '3rem', fontSize: '0.9rem', color: '#6b7280'}}>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
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
                          gap: '0.5rem'
                        }}>
                          🔄 {post.retweets || 0}
                        </button>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          ❤️ {post.likes || 0}
                        </button>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer'
                        }}>
                          📤
                        </button>
                      </div>

                      {/* Admin actions */}
                      {isAdmin && post.type === 'admin' && (
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button
                            onClick={() => togglePin(post.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #10b981',
                              borderRadius: '16px',
                              color: '#10b981',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            {post.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #ef4444',
                              borderRadius: '16px',
                              color: '#ef4444',
                              padding: '0.25rem 0.75rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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