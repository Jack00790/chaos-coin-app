
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS; // Your admin wallet

export default function Admin() {
  const account = useActiveAccount();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    text: "",
    media: null,
    mediaType: "",
    pinned: false
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (account?.address) {
      setIsAdmin(account.address.toLowerCase() === ADMIN_ADDRESS.toLowerCase());
    }
  }, [account]);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewPost(prev => ({
          ...prev,
          media: reader.result,
          mediaType: file.type.startsWith('image') ? 'image' : 'video'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const createPost = () => {
    if (!newPost.text.trim()) return;
    
    const post = {
      id: Date.now(),
      text: newPost.text,
      media: newPost.media,
      mediaType: newPost.mediaType,
      pinned: newPost.pinned,
      timestamp: new Date().toISOString(),
      author: "Chaos Coin Official"
    };

    setPosts(prev => [post, ...prev]);
    setNewPost({ text: "", media: null, mediaType: "", pinned: false });
  };

  const togglePin = (postId) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, pinned: !post.pinned } : post
    ));
  };

  const deletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card">
            <h2>Admin Access Required</h2>
            <p>Please connect your wallet to access the admin interface.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card">
            <h2>Access Denied</h2>
            <p>You don't have admin privileges to access this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="title">Admin News Management</h1>
        
        {/* Create Post Section */}
        <div className="card admin-post-creator">
          <h2 className="section-title">Create New Post</h2>
          <div className="post-form">
            <textarea
              className="post-textarea"
              placeholder="What's happening with Chaos Coin?"
              value={newPost.text}
              onChange={(e) => setNewPost(prev => ({ ...prev, text: e.target.value }))}
              rows={4}
            />
            
            <div className="media-upload">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="media-input"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="media-label">
                📎 Add Photo/Video
              </label>
            </div>

            {newPost.media && (
              <div className="media-preview">
                {newPost.mediaType === 'image' ? (
                  <img src={newPost.media} alt="Preview" className="preview-image" />
                ) : (
                  <video src={newPost.media} controls className="preview-video" />
                )}
                <button 
                  onClick={() => setNewPost(prev => ({ ...prev, media: null, mediaType: "" }))}
                  className="remove-media"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="post-options">
              <label className="pin-option">
                <input
                  type="checkbox"
                  checked={newPost.pinned}
                  onChange={(e) => setNewPost(prev => ({ ...prev, pinned: e.target.checked }))}
                />
                Pin this post
              </label>
              
              <button onClick={createPost} className="action-btn post-btn">
                Post
              </button>
            </div>
          </div>
        </div>

        {/* Posts Management */}
        <div className="card">
          <h2 className="section-title">Manage Posts</h2>
          <div className="posts-container">
            {posts.length === 0 ? (
              <p className="no-posts">No posts yet. Create your first post above!</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className={`post-item ${post.pinned ? 'pinned' : ''}`}>
                  <div className="post-header">
                    <div className="post-author">
                      <strong>{post.author}</strong>
                      {post.pinned && <span className="pin-badge">📌 Pinned</span>}
                    </div>
                    <div className="post-actions">
                      <button 
                        onClick={() => togglePin(post.id)}
                        className="pin-btn"
                      >
                        {post.pinned ? '📌 Unpin' : '📌 Pin'}
                      </button>
                      <button 
                        onClick={() => deletePost(post.id)}
                        className="delete-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="post-content">
                    <p>{post.text}</p>
                    
                    {post.media && (
                      <div className="post-media">
                        {post.mediaType === 'image' ? (
                          <img src={post.media} alt="Post media" className="post-image" />
                        ) : (
                          <video src={post.media} controls className="post-video" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="post-timestamp">
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
