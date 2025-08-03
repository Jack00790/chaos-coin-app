
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { TransactionWidget } from "thirdweb/react";
import { prepareContractCall, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { toUnits } from "thirdweb/utils";
import Navbar from "../components/Navbar";
import { client } from "../lib/payment";
import { getActiveChain, chaosCoinContract } from "../lib/contract";
import { validateTransaction, sanitizeInput } from "../lib/security";

export default function Swap() {
  const account = useActiveAccount();
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState("sell"); // sell or buy
  const [estimatedOutput, setEstimatedOutput] = useState("0");
  const [tokenPrice, setTokenPrice] = useState(0.001);

  useEffect(() => {
    fetchTokenPrice();
    if (swapAmount) {
      calculateEstimatedOutput();
    }
  }, [swapAmount, swapDirection, tokenPrice]);

  const fetchTokenPrice = async () => {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}`
      );
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        setTokenPrice(parseFloat(data.pairs[0].priceUsd || "0.001"));
      } else {
        setTokenPrice(0.001);
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001);
    }
  };

  const calculateEstimatedOutput = () => {
    const amount = parseFloat(sanitizeInput(swapAmount, 'number'));
    if (!amount || amount <= 0) {
      setEstimatedOutput("0");
      return;
    }

    let output;
    if (swapDirection === "sell") {
      // Selling CHAOS for USD
      output = (amount * tokenPrice * 0.975).toFixed(2); // 2.5% fee
    } else {
      // Buying CHAOS with USD
      output = ((amount * 0.975) / tokenPrice).toFixed(2); // 2.5% fee
    }
    setEstimatedOutput(output);
  };

  const prepareSellTransaction = () => {
    if (!swapAmount || !account) return null;
    
    const amount = sanitizeInput(swapAmount, 'number');
    if (amount <= 0) return null;

    return prepareContractCall({
      contract: chaosCoinContract,
      method: transfer,
      params: [
        process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
        toUnits(amount.toString(), 18)
      ]
    });
  };

  const handleTransactionSuccess = (result) => {
    console.log("Swap successful:", result);
    alert(`Swap completed! Transaction hash: ${result.transactionHash}`);
    setSwapAmount("");
    setEstimatedOutput("0");
  };

  const handleTransactionError = (error) => {
    console.error("Swap failed:", error);
    alert("Swap failed. Please check your balance and try again.");
  };

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Swap Tokens</h1>
          <div className="card text-center">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="text-gray mb-3">Please connect your wallet to swap CHAOS tokens</p>
          </div>
        </main>
      </div>
    );
  }

  const transaction = prepareSellTransaction();

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Swap CHAOS Tokens</h1>

        <div className="card">
          <h2 className="section-title">Secure Token Swapping</h2>
          
          {/* Swap Direction Toggle */}
          <div style={{marginBottom: '2rem'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <button
                type="button"
                className={`btn ${swapDirection === 'sell' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSwapDirection('sell')}
              >
                💰 Sell CHAOS
              </button>
              <button
                type="button"
                className={`btn ${swapDirection === 'buy' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSwapDirection('buy')}
              >
                🛒 Buy CHAOS
              </button>
            </div>
          </div>

          {/* Swap Interface */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">
                {swapDirection === 'sell' ? 'CHAOS Amount to Sell' : 'USD Amount to Spend'}
              </label>
              <input
                type="number"
                className="form-input"
                placeholder={swapDirection === 'sell' ? 'Enter CHAOS amount' : 'Enter USD amount'}
                value={swapAmount}
                onChange={(e) => setSwapAmount(sanitizeInput(e.target.value, 'number'))}
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Output</label>
              <input
                type="text"
                className="form-input"
                value={`${estimatedOutput} ${swapDirection === 'sell' ? 'USD' : 'CHAOS'}`}
                readOnly
              />
            </div>

            {/* Transaction Breakdown */}
            {swapAmount && parseFloat(swapAmount) > 0 && (
              <div className="card" style={{background: 'rgba(255,255,255,0.02)', marginBottom: '1rem'}}>
                <h3 className="section-title" style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>
                  Transaction Details
                </h3>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Amount:</span>
                  <span>{swapAmount} {swapDirection === 'sell' ? 'CHAOS' : 'USD'}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Rate:</span>
                  <span>${tokenPrice.toFixed(6)} per CHAOS</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Processing Fee (2.5%):</span>
                  <span>${(parseFloat(swapAmount) * tokenPrice * 0.025).toFixed(2)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', color: '#10b981', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem'}}>
                  <span><strong>You'll Receive:</strong></span>
                  <span><strong>{estimatedOutput} {swapDirection === 'sell' ? 'USD' : 'CHAOS'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Widget for Selling */}
          {swapDirection === 'sell' && transaction && (
            <div style={{marginTop: '2rem'}}>
              <TransactionWidget
                client={client}
                chain={getActiveChain()}
                transaction={transaction}
                onSuccess={handleTransactionSuccess}
                onError={handleTransactionError}
                style={{
                  borderRadius: '12px',
                  border: '1px solid rgba(16,185,129,0.3)'
                }}
              />
            </div>
          )}

          {/* Buy Direction Notice */}
          {swapDirection === 'buy' && (
            <div style={{marginTop: '2rem', textAlign: 'center'}}>
              <p className="text-gray">
                To buy CHAOS tokens, please use the <a href="/buy" style={{color: '#10b981'}}>Buy page</a> 
                which supports both crypto and fiat payments.
              </p>
            </div>
          )}

          {/* Security Warning */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)'}}>
            <h3 style={{color: '#fca5a5', marginBottom: '1rem'}}>⚠️ Security Reminders</h3>
            <ul style={{listStyle: 'none', padding: 0, color: '#fca5a5'}}>
              <li style={{marginBottom: '0.5rem'}}>• Always verify transaction details before confirming</li>
              <li style={{marginBottom: '0.5rem'}}>• Check your wallet balance before selling</li>
              <li style={{marginBottom: '0.5rem'}}>• Transaction fees apply to all operations</li>
              <li>• Large transactions may experience slippage</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
