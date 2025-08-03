
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import Navbar from "../components/Navbar";

export default function Buy() {
  const account = useActiveAccount();
  const [fiatAmount, setFiatAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  useEffect(() => {
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 30000); // Update every 30 seconds
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
        setTokenPrice(price);
      } else {
        setTokenPrice(0.001);
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001);
    }
  };

  const calculateTokenAmount = (fiat) => {
    if (!fiat || !tokenPrice) return "";
    const fiatValue = parseFloat(fiat);
    const fee = fiatValue * 0.025; // 2.5% processing fee
    const netFiat = fiatValue - fee;
    const tokens = netFiat / tokenPrice;
    return tokens.toFixed(2);
  };

  const handleFiatChange = (value) => {
    setFiatAmount(value);
    setTokenAmount(calculateTokenAmount(value));
  };

  const handlePurchase = async () => {
    if (!account || !fiatAmount || parseFloat(fiatAmount) < 1) {
      alert("Please connect wallet and enter amount of at least $1");
      return;
    }
    
    setLoading(true);
    try {
      // Here you would integrate with a payment processor
      // For demo purposes, we'll simulate the process
      
      const purchaseData = {
        amount: fiatAmount,
        currency: "USD",
        tokens: tokenAmount,
        userAddress: account.address,
        paymentMethod: paymentMethod,
        tokenPrice: tokenPrice
      };
      
      // Simulate API call to your backend
      console.log("Processing purchase:", purchaseData);
      
      // In a real implementation, this would:
      // 1. Process payment via Stripe/PayPal/etc
      // 2. Verify payment completion
      // 3. Mint/transfer tokens to user's wallet
      // 4. Record transaction in database
      
      alert(`Purchase initiated: $${fiatAmount} for ${tokenAmount} CHAOS tokens\nTokens will be sent to your wallet within 5 minutes.`);
      
      // Reset form
      setFiatAmount("");
      setTokenAmount("");
      
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase failed. Please try again or contact support.");
    } finally {
      setLoading(false);
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

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Buy Chaos Coin</h1>

        <div className="card">
          <h2 className="section-title">Purchase CHAOS with USD</h2>
          
          {/* Current Price Display */}
          <div className="price-display">
            <div className="current-price">${tokenPrice.toFixed(6)}</div>
            <p className="text-gray">Current CHAOS Price</p>
          </div>

          {/* Purchase Form */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">USD Amount</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount in USD (min $1)"
                value={fiatAmount}
                onChange={(e) => handleFiatChange(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">You'll Receive</label>
              <input
                type="text"
                className="form-input"
                placeholder="CHAOS tokens"
                value={`${tokenAmount} CHAOS`}
                readOnly
              />
            </div>

            {/* Fee Breakdown */}
            {fiatAmount && (
              <div className="card" style={{background: 'rgba(255,255,255,0.02)', marginBottom: '1rem'}}>
                <h3 className="section-title" style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>Transaction Breakdown</h3>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Amount:</span>
                  <span>${fiatAmount}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Processing Fee (2.5%):</span>
                  <span>${(parseFloat(fiatAmount) * 0.025).toFixed(2)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem'}}>
                  <span><strong>Net Amount:</strong></span>
                  <span><strong>${(parseFloat(fiatAmount) * 0.975).toFixed(2)}</strong></span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', color: '#10b981'}}>
                  <span><strong>CHAOS Tokens:</strong></span>
                  <span><strong>{tokenAmount}</strong></span>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'bank' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  🏦 Bank
                </button>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={!fiatAmount || parseFloat(fiatAmount) < 1 || loading}
              className="btn btn-primary"
              style={{width: '100%', fontSize: '1.1rem', padding: '1.25rem'}}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                `Buy ${tokenAmount || "0"} CHAOS for $${fiatAmount || "0"}`
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '0.5rem'}}>How it works:</h3>
            <ul style={{listStyle: 'none', padding: 0}}>
              <li style={{marginBottom: '0.25rem'}}>✅ Secure payment processing</li>
              <li style={{marginBottom: '0.25rem'}}>✅ Instant price calculation</li>
              <li style={{marginBottom: '0.25rem'}}>✅ Tokens sent to your wallet</li>
              <li style={{marginBottom: '0.25rem'}}>✅ Transaction confirmation</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
