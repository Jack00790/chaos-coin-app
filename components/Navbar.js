import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client, isClientValid } from "../lib/client";
import Navigation from "./Navigation";

/**
 * Top navigation bar with mobile-friendly navigation.
 */
export default function Navbar() {
  if (!client || !isClientValid()) {
    return (
      <>
        <nav className="navbar">
          <div className="navbar__button">
            <span className="error-msg" style={{color: '#ef4444', fontSize: '0.9rem'}}>
              Configuration Error
            </span>
          </div>
        </nav>
        <Navigation />
      </>
    );
  }

  try {
    return (
      <>
        <nav className="navbar">
          <div className="navbar__button">
            <ConnectButton client={client} className="connect-btn" />
          </div>
        </nav>
        <Navigation />
      </>
    );
  } catch (error) {
    console.error("Error rendering Navbar:", error);
    return (
      <>
        <nav className="navbar">
          <div className="navbar__button">
            <span className="error-msg" style={{color: '#ef4444', fontSize: '0.9rem'}}>
              Connection Error
            </span>
          </div>
        </nav>
        <Navigation />
      </>
    );
  }
}