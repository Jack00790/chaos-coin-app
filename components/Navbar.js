
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../lib/client";

export default function Navbar() {
  const router = useRouter();
  const account = useActiveAccount();

  const isActive = (path) => router.pathname === path;

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/swap", label: "Swap", icon: "🔄" },
    { href: "/news", label: "News", icon: "📰" },
    { href: "/wallet", label: "Wallet", icon: "👛" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img 
                src="/chaos-coin-logo.png" 
                alt="Chaos Coin" 
                style={{ 
                  height: '45px', 
                  width: '45px', 
                  borderRadius: '50%',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <h1 style={{ 
                color: '#10b981', 
                fontSize: '1.5rem', 
                fontWeight: '700',
                margin: 0,
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                CHAOS COIN
              </h1>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Items */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          '@media (max-width: 768px)': { display: 'none' }
        }}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <div className={`navigation__item ${isActive(item.href) ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  color: isActive(item.href) ? '#10b981' : '#e5e7eb',
                  background: isActive(item.href) 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isActive(item.href)
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid transparent',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Wallet Connection with Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {account && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                background: '#10b981', 
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ 
                color: '#10b981', 
                fontSize: '0.8rem', 
                fontWeight: '600',
                display: window.innerWidth > 640 ? 'block' : 'none'
              }}>
                Connected
              </span>
            </div>
          )}
          
          <ConnectButton 
            client={client}
            theme="dark"
            connectButton={{
              style: {
                background: 'linear-gradient(45deg, #10b981, #34d399)',
                color: '#000000',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                minWidth: '120px'
              }
            }}
            detailsButton={{
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem'
              }
            }}
          />
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav" style={{ 
        display: 'none',
        '@media (max-width: 768px)': { display: 'block' }
      }}>
        <div className="nav-container">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="nav-icon" style={{ fontSize: '1.3rem' }}>
                {item.icon}
              </div>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 1rem !important;
          }
          
          .navbar > div:nth-child(2) {
            display: none !important;
          }
          
          .bottom-nav {
            display: block !important;
          }

          .main-content {
            margin-bottom: 100px !important;
          }
        }

        .navigation__item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
      `}</style>
    </>
  );
}
