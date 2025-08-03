
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";

export default function FiatToBuy() {
  const account = useActiveAccount();
  const [fiatAmount, setFiatAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenPrice, setTokenPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTokenPrice();
  }, []);

  const fetchTokenPrice = async () => {
    try {
      // Using DEXScreener API to get Chaos Coin price
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
      );
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const price = parseFloat(data.pairs[0].priceUsd || "0");
        setTokenPrice(price);
      } else {
        // Fallback price if not found on DEXScreener
        setTokenPrice(0.001); // $0.001 per token
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001); // Fallback price
    }
  };

  const calculateTokenAmount = (fiat) => {
    if (!fiat || !tokenPrice) return "";
    const fiatValue = parseFloat(fiat);
    const fee = fiatValue * 0.03; // 3% fee
    const netFiat = fiatValue - fee;
    const tokens = netFiat / tokenPrice;
    return tokens.toFixed(2);
  };

  const handleFiatChange = (value) => {
    setFiatAmount(value);
    setTokenAmount(calculateTokenAmount(value));
  };

  const handleBuyWithFiat = async () => {
    if (!account || !fiatAmount) return;
    
    setLoading(true);
    try {
      // This would integrate with a payment processor like Stripe, PayPal, or crypto onramp
      // For now, we'll simulate the process
      
      // Step 1: Process fiat payment
      const paymentData = {
        amount: fiatAmount,
        currency: "USD",
        tokens: tokenAmount,
        userAddress: account.address
      };
      
      // Step 2: After payment confirmation, mint/transfer tokens
      // This would typically be handled by your backend after payment verification
      
      alert(`Purchase initiated: $${fiatAmount} for ${tokenAmount} CHAOS tokens`);
      
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="fiat-buy-section">
        <p className="account-message">Connect your wallet to buy with fiat</p>
      </div>
    );
  }

  return (
    <div className="fiat-buy-section">
      <h3 className="section-title">Buy with USD</h3>
      
      <div className="price-display">
        <p>Current Price: ${tokenPrice.toFixed(6)} per CHAOS</p>
      </div>

      <div className="form-group">
        <label className="form-label">USD Amount</label>
        <input
          type="number"
          className="form-input"
          placeholder="Enter USD amount"
          value={fiatAmount}
          onChange={(e) => handleFiatChange(e.target.value)}
          min="1"
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label className="form-label">You'll Receive (after 3% fee)</label>
        <input
          type="text"
          className="form-input"
          placeholder="CHAOS tokens"
          value={tokenAmount}
          readOnly
        />
      </div>

      <div className="fee-breakdown">
        <p>Amount: ${fiatAmount || "0.00"}</p>
        <p>Fee (3%): ${fiatAmount ? (parseFloat(fiatAmount) * 0.03).toFixed(2) : "0.00"}</p>
        <p>Net: ${fiatAmount ? (parseFloat(fiatAmount) * 0.97).toFixed(2) : "0.00"}</p>
      </div>

      <button
        onClick={handleBuyWithFiat}
        disabled={!fiatAmount || loading}
        className="action-btn buy-btn fiat-buy-btn"
      >
        {loading ? "Processing..." : `Buy ${tokenAmount || "0"} CHAOS`}
      </button>

      <div className="payment-methods">
        <p>Payment methods: Credit Card, Debit Card, Bank Transfer</p>
      </div>
    </div>
  );
}
