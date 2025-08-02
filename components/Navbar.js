import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";

/**
 * Top navigation bar.
 *
 * Displays the application name and a wallet connect button.  The connect button
 * uses the thirdweb client created in `lib/client.js`.  The button will
 * automatically prompt the user to connect their wallet and switch networks
 * if necessary【866568320390362†L214-L224】.
 */
export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__title">Chaos Coin</div>
      <div className="navbar__button">
        <ConnectButton client={client} className="connect-btn" />
      </div>
    </nav>
  );
}