import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";

export default function Buy() {
  const account = useActiveAccount();
  const [tokenPrice, setTokenPrice] = useState(0);

  useEffect(() => {
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
      );
      const data = await response.json();

      if (data.pairs && data.pairs.length > 0) {
        const price = parseFloat(data.pairs[0].priceUsd || "0");
        setTokenPrice(price > 0 ? price : 0.001);
      } else {
        setTokenPrice(0.001); // Fallback price
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001);
    }
  };

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Buy Chaos Coin</h1>
          <div className="card text-center">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="text-gray mb-3">Please connect your wallet to purchase CHAOS tokens</p>
          </div>
        </main>
      </div>
    );
  }

  // Create Uniswap URL with prefilled token
  const uniswapUrl = `https://app.uniswap.org/#/swap?outputCurrency=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&chain=ethereum`;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Buy Chaos Coin</h1>

        <div className="card">
          <h2 className="section-title">Purchase CHAOS Tokens</h2>

          {/* Current Price Display */}
          <div className="price-display" style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#10b981'}}>
              ${tokenPrice.toFixed(6)}
            </div>
            <p className="text-gray">Current CHAOS Price</p>
          </div>

          {/* Uniswap Embedded Interface */}
          <div style={{marginBottom: '2rem'}}>
            <iframe
              src={uniswapUrl}
              height="660px"
              width="100%"
              style={{
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '12px',
                background: '#fff'
              }}
              title="Uniswap Interface"
            />
          </div>

          {/* Instructions */}
          <div style={{padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '1rem'}}>🚀 How to Buy CHAOS:</h3>
            <ol style={{paddingLeft: '1.5rem', lineHeight: '1.6'}}>
              <li>Connect your wallet to Uniswap (if not already connected)</li>
              <li>Select the token you want to swap from (ETH, USDC, etc.)</li>
              <li>CHAOS token is already selected as the output</li>
              <li>Enter the amount you want to buy</li>
              <li>Review the transaction and confirm</li>
              <li>Your CHAOS tokens will appear in your wallet</li>
            </ol>
          </div>

          {/* Token Information */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'}}>
            <h3 style={{marginBottom: '1rem'}}>Token Information:</h3>
            <div style={{display: 'grid', gap: '0.5rem', fontSize: '0.9rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Contract Address:</span>
                <span style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>
                  {process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Symbol:</span>
                <span>CHAOS</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Network:</span>
                <span>Ethereum</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}