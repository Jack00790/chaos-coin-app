import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import Navigation from "./Navigation";

/**
 * Top navigation bar with mobile-friendly navigation.
 */
export default function Navbar() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar__logo">
          <img 
            src="/chaos-coin-logo.png" 
            alt="Chaos Coin" 
            className="navbar__logo-img"
            onLoad={() => console.log('Logo loaded successfully')}
            onError={(e) => {
              console.error('Logo failed to load from:', e.target.src);
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxMGI5ODEiLz4KPHR4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LWZhbWlseT0iQXJpYWwiPkM8L3R4dD4KPC9zdmc+';
            }}
          />
          <span className="navbar__title">Chaos Coin</span>
        </div>
        <div className="navbar__button">
          <ConnectButton client={client} className="connect-btn" />
        </div>
      </nav>
      <Navigation />
    </>
  );
}