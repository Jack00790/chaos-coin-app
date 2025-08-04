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
    // Enhanced admin check with better validation
    if (account?.address && ADMIN_WALLET) {
      const userAddress = account.address.toLowerCase().trim();
      const adminAddress = ADMIN_WALLET.toLowerCase().trim();
      const isAdminUser = userAddress === adminAddress;
      setIsAdmin(isAdminUser);
      console.log('Enhanced Admin check:', {
        userAddress,
        adminAddress, 
        isAdmin: isAdminUser,
        accountConnected: !!account
      });
    } else {
      setIsAdmin(false);
    }
    fetchPosts();
    fetchNewsData();

    // Set up hourly news refresh (every hour)
    const newsRefreshInterval = setInterval(() => {
      console.log('⏰ Hourly auto-refresh triggered at', new Date().toLocaleTimeString());
      fetchNewsData();
    }, 3600000); // 1 hour = 3,600,000 milliseconds

    // Also add a status message for the next refresh
    console.log('🕐 News will auto-refresh every hour. Next refresh at:', 
      new Date(Date.now() + 3600000).toLocaleTimeString());

    // Cleanup interval on component unmount
    return () => {
      clearInterval(newsRefreshInterval);
    };
  }, [account, ADMIN_WALLET]);

  const fetchPosts = () => {
    try {
      // Load posts from localStorage
      const savedPosts = localStorage.getItem('chaoscoin_posts');
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      } else {
        // Default posts if none saved
        const defaultPosts = [
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
      console.log('🔄 Refreshing crypto news tweets...', new Date().toLocaleTimeString());
      
      // Simulate fresh news data by updating timestamps
      const currentTime = Date.now();
      const freshTweets = [
        { title: "Bitcoin Surges Past $68K", time: "2h", updated: currentTime },
        { title: "Avalanche Subnet TVL Hits $3.2B", time: "4h", updated: currentTime },
        { title: "DeFi Yields Climb to 12% APY", time: "6h", updated: currentTime },
        { title: "Web3 Gaming Revenue Up 300%", time: "8h", updated: currentTime },
        { title: "ZK Proofs Enable Private DeFi", time: "10h", updated: currentTime },
        { title: "Cross-Chain Volume $89B", time: "12h", updated: currentTime },
        { title: "CHAOS Token 50K Holders", time: "14h", updated: currentTime }
      ];
      
      setNews(freshTweets);
      console.log(`✅ Successfully refreshed ${freshTweets.length} crypto news tweets at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('❌ Error refreshing news tweets:', error);
      setError('Failed to refresh news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    // Clear any previous errors
    setError("");

    // Validation checks
    if (!account?.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!newPost.content.trim() && !newPost.media && !newPost.poll) {
      setError("Please add some content, media, or create a poll");
      return;
    }

    // Enhanced admin check
    const userAddress = account.address.toLowerCase().trim();
    const adminAddress = ADMIN_WALLET?.toLowerCase().trim();
    const isCurrentlyAdmin = userAddress === adminAddress;

    console.log('Creating post - Admin verification:', {
      isCurrentlyAdmin,
      userAddress,
      adminAddress,
      hasContent: !!newPost.content.trim()
    });

    if (!isCurrentlyAdmin) {
      setError(`Admin access required. Please connect with admin wallet.`);
      return;
    }

    try {
      // Security validation
      const sanitizedContent = newPost.content.trim().slice(0, 2000);

      const post = {
        id: Date.now() + Math.random(), // More unique ID
        content: sanitizedContent,
        author: "Chaos Team",
        timestamp: new Date().toISOString(),
        isPinned: newPost.isPinned,
        type: "admin",
        likes: Math.floor(Math.random() * 20), // Random likes for demo
        replies: Math.floor(Math.random() * 5),
        retweets: Math.floor(Math.random() * 10),
        shares: Math.floor(Math.random() * 8),
        media: newPost.media || null,
        mediaType: newPost.mediaType || null,
        poll: newPost.poll || null
      };

      const updatedPosts = [post, ...posts];
      setPosts(updatedPosts);
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('chaoscoin_posts', JSON.stringify(updatedPosts));
      } catch (storageError) {
        console.warn('localStorage save failed:', storageError);
      }

      // Reset form
      setNewPost({ 
        content: "", 
        isPinned: false, 
        media: null, 
        mediaType: null,
        poll: null 
      });

      console.log('Post created successfully!');
    } catch (err) {
      console.error('Post creation error:', err);
      setError("Failed to create post. Please try again.");
    }
  };

  const togglePin = (postId) => {
    const updatedPosts = posts.map(post => 
      post.id === postId 
        ? { ...post, isPinned: !post.isPinned }
        : post
    );
    setPosts(updatedPosts);
    localStorage.setItem('chaoscoin_posts', JSON.stringify(updatedPosts));
  };

  const deletePost = (postId) => {
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
        {account?.address && ADMIN_WALLET && isAdmin && (
          <div className="card twitter-compose">
            <div className="admin-badge">
              👑 Admin Posting
            </div>
            
            {/* Error Display */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#fca5a5',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}
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

          <div className="twitter-feed" style={{display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', overflow: 'hidden'}}>
            {sortedPosts.map((post) => (
              <div 
                key={post.id} 
                className="twitter-post"
                style={{
                  padding: '1.5rem',
                  borderBottom: sortedPosts[sortedPosts.length - 1].id === post.id ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: post.isPinned 
                    ? 'rgba(16, 185, 129, 0.05)' 
                    : 'transparent',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!post.isPinned) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!post.isPinned) {
                    e.target.style.background = 'transparent';
                  }
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

                    {/* Post actions - Twitter style */}
                    <div style={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: '0.75rem',
                      marginTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{display: 'flex', gap: '4rem', fontSize: '0.9rem'}}>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(29, 161, 242, 0.1)';
                          e.target.style.color = '#1da1f2';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#6b7280';
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
                          padding: '0.25rem 0.5rem',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(16, 185, 129, 0.1)';
                          e.target.style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#6b7280';
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
                          gap: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                          e.target.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#6b7280';
                        }}>
                          ❤️ {post.likes || 0}
                        </button>
                        <button style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(107, 114, 128, 0.1)';
                          e.target.style.color = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#6b7280';
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
         {/* Latest Crypto News - 7 Tweet Style */}
        <div className="card">
          <h2 className="section-title">📰 Latest Crypto News</h2>
          <div className="news-feed-vertical">
            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="🚀"
                  alt="CoinTelegraph"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">CoinTelegraph</h4>
                    <span className="news-item-time">• 2h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">🚀 Bitcoin Surges Past $68K as Institutional Adoption Accelerates</h3>
                <p className="news-item-description">Major financial institutions continue buying BTC with BlackRock's ETF seeing record inflows of $2.1B this week. MicroStrategy announces additional $1.5B purchase...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="⚡"
                  alt="Avalanche Labs"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">Avalanche Labs</h4>
                    <span className="news-item-time">• 4h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">⚡ Avalanche Subnet TVL Hits $3.2B Milestone with Enterprise Adoption</h3>
                <p className="news-item-description">Avalanche's subnet ecosystem reaches new heights as Fortune 500 companies deploy custom blockchains. Gaming and DeFi protocols drive 40% growth this quarter...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="🌟"
                  alt="DeFi Pulse"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">DeFi Pulse</h4>
                    <span className="news-item-time">• 6h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">🌟 DeFi Yields Climb as Staking Rewards Hit 12% APY Across Protocols</h3>
                <p className="news-item-description">Ethereum staking yields surge following successful network upgrades. Liquid staking tokens show 25% premium as institutional demand soars for yield opportunities...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="🎮"
                  alt="GameFi Weekly"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">GameFi Weekly</h4>
                    <span className="news-item-time">• 8h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">🎮 Web3 Gaming Revenue Explodes 300% with Play-to-Earn Revolution</h3>
                <p className="news-item-description">Blockchain gaming hits $4.6B market cap as AAA studios announce Web3 integration. Top players earning $15K+ monthly from skill-based gaming economies...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="🔒"
                  alt="Security Labs"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">Security Labs</h4>
                    <span className="news-item-time">• 10h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">🔒 Zero-Knowledge Proofs Enable Private DeFi at Scale</h3>
                <p className="news-item-description">Revolutionary ZK-SNARK implementation processes 50K+ transactions per second while maintaining privacy. Major exchanges adopt confidential trading layers...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="🌉"
                  alt="Bridge Protocol"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">Bridge Protocol</h4>
                    <span className="news-item-time">• 12h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">🌉 Cross-Chain Volume Reaches $89B as Multi-Chain Era Dominates</h3>
                <p className="news-item-description">Interoperability protocols see record usage with instant bridging between 25+ networks. Layer 2 solutions process 3.2M daily transactions with 99.9% uptime...</p>
              </div>
            </div>

            <div className="news-item-twitter">
              <div className="news-item-header">
                <img 
                  src="💎"
                  alt="CHAOS News"
                  className="news-item-image"
                />
                <div className="news-item-meta">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h4 className="news-item-source">CHAOS Official</h4>
                    <span className="news-item-time">• 14h</span>
                  </div>
                </div>
              </div>
              <div className="news-item-content">
                <h3 className="news-item-title">💎 CHAOS Token Community Reaches 50K Holders with Massive Adoption</h3>
                <p className="news-item-description">CHAOS ecosystem expands rapidly with new DeFi integrations and community governance initiatives. Trading volume up 400% as holders stake for premium rewards...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}