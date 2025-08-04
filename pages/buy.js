
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { PayEmbed } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { avalanche } from "thirdweb/chains";
import Navbar from "../components/Navbar";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});

export default function Buy() {
  const account = useActiveAccount();
  const [tokenPrice, setTokenPrice] = useState(0.000001);
  const [priceLastUpdated, setPriceLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateEstimatedTokens();
  }, [amount, tokenPrice]);

  const fetchTokenPrice = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          const avalanchePair = data.pairs.find(pair => 
            pair.chainId === 'avalanche' || 
            pair.baseToken?.address?.toLowerCase() === process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS?.toLowerCase()
          );
          
          const pair = avalanchePair || data.pairs[0];
          const price = parseFloat(pair.priceUsd || "0.000001");
          setTokenPrice(price > 0 ? price : 0.000001);
          setPriceLastUpdated(new Date());
          console.log(`Fetched CHAOS price from ${pair.dexId || 'DEX'}: $${price}`);
        } else {
          throw new Error("No trading pairs found");
        }
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.warn("Price fetch failed, using fallback:", error);
      setTokenPrice(0.000001);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedTokens = () => {
    if (!amount || !tokenPrice) {
      setEstimatedTokens('0');
      return;
    }
    
    const usdAmount = parseFloat(amount);
    if (isNaN(usdAmount) || usdAmount <= 0) {
      setEstimatedTokens('0');
      return;
    }
    
    const tokens = usdAmount / tokenPrice;
    
    let formattedTokens;
    if (tokens >= 1000000) {
      formattedTokens = (tokens / 1000000).toFixed(2) + 'M';
    } else if (tokens >= 1000) {
      formattedTokens = (tokens / 1000).toFixed(2) + 'K';
    } else if (tokens >= 1) {
      formattedTokens = tokens.toLocaleString(undefined, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    } else {
      formattedTokens = tokens.toFixed(8);
    }
    
    setEstimatedTokens(formattedTokens);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setAmount(value);
      setShowPayment(false);
    }
  };

  const setQuickAmount = (value) => {
    setAmount(value.toString());
    setShowPayment(false);
  };

  const handleProceedToPayment = () => {
    if (amount && parseFloat(amount) > 0 && account) {
      setShowPayment(true);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <div className="card">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner"></div>
              <h2>Loading Purchase Interface...</h2>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        
        {/* Page Header */}
        <div className="card page-header">
          <div className="page-header-content">
            <img 
              src="/chaos-coin-logo.png" 
              alt="CHAOS Coin" 
              className="page-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="page-text">
              <h1 className="page-title buy-chaos-title">Buy CHAOS Tokens</h1>
              <p className="page-description">
                Purchase CHAOS tokens securely using crypto or fiat currency. 
                Powered by ThirdWeb Pay with support for 150+ payment methods.
              </p>
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="card price-info-card">
          <div className="price-header">
            <h2 className="section-title">💰 Current Price</h2>
            <div className="price-refresh">
              <button onClick={fetchTokenPrice} className="refresh-btn" disabled={isLoading}>
                <span className="refresh-icon">🔄</span>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="price-display">
            <div className="current-price">
              <span className="price-label">CHAOS/USD</span>
              <span className="price-value">${tokenPrice.toFixed(8)}</span>
            </div>
            {priceLastUpdated && (
              <div className="price-updated">
                Last updated: {priceLastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="price-stats">
            <div className="price-stat">
              <span className="stat-label">Network</span>
              <span className="stat-value">Avalanche C-Chain</span>
            </div>
            <div className="price-stat">
              <span className="stat-label">Contract</span>
              <span className="stat-value">
                {process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS?.substring(0, 6)}...
                {process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS?.substring(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Interface */}
        <div className="purchase-section">
          
          {/* Amount Input */}
          <div className="card amount-input-card">
            <h3 className="section-title">💵 Purchase Amount</h3>
            
            <div className="amount-input-section">
              <div className="input-group">
                <label htmlFor="amount" className="input-label">Amount (USD)</label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="amount-input"
                  min="1"
                  step="0.01"
                />
                <span className="input-suffix">USD</span>
              </div>
              
              <div className="estimated-tokens">
                <span className="estimation-label">You will receive approximately:</span>
                <span className="estimation-value">{estimatedTokens} CHAOS</span>
              </div>
            </div>

            <div className="quick-amounts">
              <span className="quick-amounts-label">Quick amounts:</span>
              <div className="quick-amount-buttons">
                {[10, 25, 50, 100, 250, 500].map(value => (
                  <button
                    key={value}
                    onClick={() => setQuickAmount(value)}
                    className="quick-amount-btn"
                  >
                    ${value}
                  </button>
                ))}
              </div>
            </div>

            {!account && (
              <div className="connect-wallet-prompt">
                <div className="prompt-icon">🔗</div>
                <h4>Connect Your Wallet</h4>
                <p>Please connect your wallet to continue with the purchase.</p>
              </div>
            )}

            {account && amount && parseFloat(amount) >= 1 && !showPayment && (
              <button 
                onClick={handleProceedToPayment}
                className="proceed-payment-btn"
              >
                Proceed to Payment
              </button>
            )}
          </div>

          {/* ThirdWeb Pay Integration */}
          {showPayment && account && amount && parseFloat(amount) >= 1 && (
            <div className="card payment-widget-card">
              <h3 className="section-title">🔐 Secure Payment</h3>
              
              <div className="payment-widget-container">
                <PayEmbed
                  client={client}
                  payOptions={{
                    mode: "direct_payment",
                    paymentInfo: {
                      amount: amount,
                      chain: avalanche,
                      token: process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS,
                      sellerAddress: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
                    },
                    metadata: {
                      name: "CHAOS Token Purchase",
                      description: `Purchase ${estimatedTokens} CHAOS tokens`,
                      image: "/chaos-coin-logo.png",
                      buyerAddress: account.address,
                      tokenAmount: estimatedTokens,
                    },
                    webhookUrl: `${window.location.origin}/api/webhook/payment-success`,
                  }}
                  onPaymentSuccess={(result) => {
                    console.log("Payment successful:", result);
                    alert(`Payment successful! Your ${estimatedTokens} CHAOS tokens will be delivered to your wallet shortly. Transaction hash: ${result.transactionHash}`);
                    setShowPayment(false);
                    setAmount('');
                  }}
                  onError={(error) => {
                    console.error("Payment error:", error);
                    alert("Payment failed. Please try again.");
                  }}
                  theme="dark"
                  className="thirdweb-pay-embed"
                />
              </div>

              <button 
                onClick={() => setShowPayment(false)}
                className="back-to-amount-btn"
              >
                ← Back to Amount Selection
              </button>
            </div>
          )}
        </div>

        {/* Security Features */}
        <div className="card security-features-card">
          <h3 className="section-title">🛡️ Security Features</h3>
          <div className="security-grid">
            <div className="security-feature">
              <div className="feature-icon">🔒</div>
              <div className="feature-content">
                <h4>End-to-End Encryption</h4>
                <p>All transactions are secured with bank-grade encryption</p>
              </div>
            </div>
            <div className="security-feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h4>Instant Delivery</h4>
                <p>Tokens delivered directly to your wallet upon confirmation</p>
              </div>
            </div>
            <div className="security-feature">
              <div className="feature-icon">🌐</div>
              <div className="feature-content">
                <h4>150+ Payment Methods</h4>
                <p>Support for major cryptocurrencies and fiat payment methods</p>
              </div>
            </div>
            <div className="security-feature">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>Price Protection</h4>
                <p>Anti-manipulation safeguards and fair pricing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Disclaimer */}
        <div className="card disclaimer-card">
          <h3 className="section-title">⚠️ Important Information</h3>
          <div className="disclaimer-content">
            <ul className="disclaimer-list">
              <li>Cryptocurrency investments carry inherent risks</li>
              <li>Token prices can be volatile and may fluctuate significantly</li>
              <li>Only invest what you can afford to lose</li>
              <li>Ensure you understand the tokenomics before purchasing</li>
              <li>Keep your wallet secure and never share private keys</li>
            </ul>
            <div className="disclaimer-footer">
              <p><strong>By proceeding, you acknowledge that you have read and understood these risks.</strong></p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
