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
        <div className="navbar__button">
          <ConnectButton client={client} className="connect-btn" />
        </div>
      </nav>
      <Navigation />
    </>
  );
}