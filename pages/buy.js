import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { CheckoutWidget } from "thirdweb/react";
import Navbar from "../components/Navbar";
import { client } from "../lib/payment";
import { getActiveChain } from "../lib/contract";
import { validatePayment, checkRateLimit } from "../lib/payment";
import { sanitizeInput, validatePriceData } from "../lib/security";

export default function Buy() {
  const account = useActiveAccount();
  const [tokenPrice, setTokenPrice] = useState(0);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState([]);

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

      let newPrice = 0.001; // Fallback price

      if (data.pairs && data.pairs.length > 0) {
        const fetchedPrice = parseFloat(data.pairs[0].priceUsd || "0");

        // Validate price against manipulation
        if (tokenPrice === 0 || validatePriceData(fetchedPrice, tokenPrice)) {
          newPrice = fetchedPrice;
        } else {
          console.warn("Price change too dramatic, using fallback");
        }
      }

      setTokenPrice(newPrice);
      setLastPriceUpdate(Date.now());

      // Keep price history for analysis
      setPriceHistory(prev => [...prev.slice(-10), { price: newPrice, timestamp: Date.now() }]);

    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001);
    }
  };

  const handlePurchaseSuccess = (result) => {
    console.log("Purchase successful:", result);

    // Track successful purchase
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        event_category: 'ecommerce',
        event_label: 'CHAOS_token',
        value: result.amount
      });
    }

    alert("Purchase successful! Tokens will appear in your wallet shortly.");
  };

  const handlePurchaseError = (error) => {
    console.error("Purchase failed:", error);
    alert("Purchase failed. Please try again or contact support.");
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

  // Rate limiting check
  if (!checkRateLimit(account.address)) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Buy Chaos Coin</h1>
          <div className="card text-center">
            <h2 className="section-title">Rate Limit Exceeded</h2>
            <p className="text-gray mb-3">Too many purchase attempts. Please wait before trying again.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Buy Chaos Coin</h1>

        <div className="card">
          <h2 className="section-title">Purchase CHAOS with Crypto or Fiat</h2>

          {/* Current Price Display */}
          <div className="price-display">
            <div className="current-price">${tokenPrice.toFixed(6)}</div>
            <p className="text-gray">Current CHAOS Price</p>
            <p style={{fontSize: '0.8rem', color: '#6b7280'}}>
              Last updated: {new Date(lastPriceUpdate).toLocaleTimeString()}
            </p>
          </div>

          {/* ThirdWeb Pay Checkout */}
          <div style={{marginTop: '2rem'}}>
            <iframe
              src="https://thirdweb.com/pay/d62cbbba-24b1-4ac0-b048-7781605867e4"
              width="100%"
              height="600"
              style={{
                border: 'none',
                borderRadius: '12px',
                background: 'rgba(16,185,129,0.1)',
                minHeight: '600px'
              }}
              title="Buy CHAOS Tokens"
              allow="payment"
            />
          </div>

          {/* Security Features */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '1rem'}}>🔒 Security Features:</h3>
            <ul style={{listStyle: 'none', padding: 0}}>
              <li style={{marginBottom: '0.5rem'}}>✅ Multi-chain support (50+ networks)</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Real-time price protection</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Transaction rate limiting</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Automated fraud detection</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Secure payment processing</li>
            </ul>
          </div>

          {/* Price History Chart */}
          {priceHistory.length > 3 && (
            <div style={{marginTop: '2rem'}}>
              <h3 className="section-title">Price Trend (Last 10 Updates)</h3>
              <div style={{display: 'flex', alignItems: 'end', gap: '4px', height: '100px', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px'}}>
                {priceHistory.map((point, index) => {
                  const height = Math.max(10, (point.price / Math.max(...priceHistory.map(p => p.price))) * 80);
                  return (
                    <div
                      key={index}
                      style={{
                        width: '20px',
                        height: `${height}px`,
                        background: 'linear-gradient(to top, #10b981, #34d399)',
                        borderRadius: '2px'
                      }}
                      title={`$${point.price.toFixed(6)} at ${new Date(point.timestamp).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}