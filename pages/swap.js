import React from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";

export default function Swap() {
  const account = useActiveAccount();

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Swap Tokens</h1>
          <div className="card text-center">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="text-gray mb-3">Please connect your wallet to access the swap feature</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Swap AVAX for CHAOS</h1>

        <div className="card">
          <h2 className="section-title">Uniswap Integration</h2>
          <p className="text-gray mb-3">
            Swap AVAX for CHAOS tokens using Uniswap's decentralized exchange
          </p>

          {/* Uniswap Widget iframe */}
          <div className="uniswap-container">
            <iframe
              src={`https://app.uniswap.org/#/swap?exactField=input&exactAmount=1&inputCurrency=AVAX&outputCurrency=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&chain=avalanche`}
              height="660px"
              width="100%"
              style={{
                border: "0",
                margin: "0 auto",
                display: "block",
                borderRadius: "10px",
                maxWidth: "600px",
                minWidth: "300px",
              }}
              title="Uniswap Interface"
            />
          </div>

          <div className="swap-info">
            <h3 className="section-title">Swap Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">From:</span>
                <span className="info-value">AVAX (Avalanche)</span>
              </div>
              <div className="info-item">
                <span className="info-label">To:</span>
                <span className="info-value">CHAOS Token</span>
              </div>
              <div className="info-item">
                <span className="info-label">Network:</span>
                <span className="info-value">Avalanche C-Chain</span>
              </div>
              <div className="info-item">
                <span className="info-label">DEX:</span>
                <span className="info-value">Uniswap V3</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}