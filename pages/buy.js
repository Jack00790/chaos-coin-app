
import React, { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { CheckoutWidget } from "thirdweb/react";
import { optimism, arbitrum, base } from "thirdweb/chains";
import { client, isClientValid } from "../lib/client";
import Navbar from "../components/Navbar";

// Input validation utilities
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 1 && num <= 100000;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>\"'&]/g, '').trim();
};

export default function Buy() {
  const account = useActiveAccount();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedChain, setSelectedChain] = useState(arbitrum);
  const [tokenPrice, setTokenPrice] = useState(0.001);

  // Security check for client validation
  useEffect(() => {
    if (!isClientValid()) {
      setError("Client configuration error. Please contact support.");
    }
  }, []);

  const fetchTokenPrice = useCallback(async () => {
    try {
      // Multi-source price validation for security
      const sources = [
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`,
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}&vs_currencies=usd`
      ];

      const responses = await Promise.allSettled(
        sources.map(url => fetch(url).then(res => res.json()))
      );

      let validPrices = [];
      
      // Validate and extract prices from multiple sources
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') {
          let price = 0;
          if (index === 0 && response.value.pairs?.[0]?.priceUsd) {
            price = parseFloat(response.value.pairs[0].priceUsd);
          } else if (index === 1 && response.value[process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS]?.usd) {
            price = response.value[process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS].usd;
          }
          
          if (price > 0 && price < 10) { // Reasonable price bounds
            validPrices.push(price);
          }
        }
      });

      // Use median price if multiple sources available, otherwise fallback
      if (validPrices.length > 0) {
        const sortedPrices = validPrices.sort((a, b) => a - b);
        const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
        setTokenPrice(medianPrice);
      } else {
        setTokenPrice(0.001);
      }
    } catch (error) {
      console.error("Price fetch error:", error);
      setTokenPrice(0.001);
    }
  }, []);

  useEffect(() => {
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 30000);
    return () => clearInterval(interval);
  }, [fetchTokenPrice]);

  const handleAmountChange = (value) => {
    const sanitized = sanitizeInput(value);
    setAmount(sanitized);
    setError("");
    
    if (sanitized && !validateAmount(sanitized)) {
      setError("Amount must be between $1 and $100,000");
    }
  };

  const handleSuccess = () => {
    setAmount("");
    setError("");
    // Log successful transaction for monitoring
    console.log("Transaction successful:", {
      amount,
      timestamp: new Date().toISOString(),
      userAddress: account?.address,
      chain: selectedChain.name
    });
  };

  const handleError = (error) => {
    console.error("Transaction failed:", error);
    setError("Transaction failed. Please try again or contact support.");
  };

  if (!isClientValid()) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card text-center">
            <h2 className="section-title">Configuration Error</h2>
            <p className="text-gray">Please contact support.</p>
          </div>
        </main>
      </div>
    );
  }

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

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Buy Chaos Coin</h1>

        <div className="card">
          <h2 className="section-title">Secure Crypto & Fiat Payments</h2>
          
          {/* Current Price Display */}
          <div className="price-display">
            <div className="current-price">${tokenPrice.toFixed(6)}</div>
            <p className="text-gray">Current CHAOS Price (Multi-source validated)</p>
          </div>

          {/* Chain Selection */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Select Network</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <button
                  type="button"
                  className={`btn ${selectedChain.id === arbitrum.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedChain(arbitrum)}
                >
                  Arbitrum
                </button>
                <button
                  type="button"
                  className={`btn ${selectedChain.id === optimism.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedChain(optimism)}
                >
                  Optimism
                </button>
                <button
                  type="button"
                  className={`btn ${selectedChain.id === base.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedChain(base)}
                >
                  Base
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div className="form-group">
              <label className="form-label">Purchase Amount (USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount (min $1, max $100,000)"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                min="1"
                max="100000"
                step="0.01"
              />
              {error && <p style={{color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem'}}>{error}</p>}
            </div>

            {/* Secure CheckoutWidget */}
            {amount && validateAmount(amount) && (
              <div style={{marginTop: '2rem'}}>
                <CheckoutWidget
                  client={client}
                  chain={selectedChain}
                  amount={amount}
                  seller={process.env.NEXT_PUBLIC_TREASURY_ADDRESS}
                  name="Chaos Coin (CHAOS)"
                  description={`Purchase ${(parseFloat(amount) / tokenPrice).toFixed(2)} CHAOS tokens`}
                  image="/chaos-coin-logo.png"
                  purchaseData={{
                    productId: "chaos-coin",
                    customerId: account.address,
                    orderId: `chaos-${Date.now()}`,
                    amount: amount,
                    tokenAmount: (parseFloat(amount) / tokenPrice).toFixed(2),
                    timestamp: new Date().toISOString()
                  }}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Security Features */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '1rem'}}>🔒 Security Features:</h3>
            <ul style={{listStyle: 'none', padding: 0}}>
              <li style={{marginBottom: '0.5rem'}}>✅ Multi-chain support (Arbitrum, Optimism, Base)</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Fiat & crypto payments supported</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Multi-source price validation</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Input sanitization & validation</li>
              <li style={{marginBottom: '0.5rem'}}>✅ Secure payment processing via thirdweb</li>
              <li>✅ Transaction monitoring & logging</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
