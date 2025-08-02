import React from "react";
import Navbar from "../components/Navbar";
import TokenInfo from "../components/TokenInfo";
import AccountBalance from "../components/AccountBalance";
import TokenOperations from "../components/TokenOperations";
import { useActiveAccount } from "thirdweb/react";

/**
 * The main dashboard page.  It displays navigation, token information,
 * the user's balance and buy/sell controls.  If no wallet is connected the
 * balance and trading widgets show helpful messages.
 */
export default function Home() {
  const account = useActiveAccount();
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="title">Chaos Coin Dashboard</h1>
        <div className="card">
          <TokenInfo />
          <AccountBalance />
          <TokenOperations />
        </div>
      </main>
    </div>
  );
}