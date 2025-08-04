import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import Navigation from "./Navigation";

/**
 * Top navigation bar with mobile-friendly navigation.
 */
export default function Navbar() {
  if (!client) {
    console.error("ThirdWeb client not initialized");
    return (
      <>
        <nav className="navbar">
          <div className="navbar__button">
            <span className="error-msg">Wallet connection unavailable</span>
          </div>
        </nav>
        <Navigation />
      </>
    );
  }

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
}