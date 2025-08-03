
import React, { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { toWei, fromWei } from "thirdweb/utils";
import { chaosCoinContract } from "../lib/contract";
import { getUniswapQuote, subscribeToPriceUpdates } from "../lib/uniswap";
import { sanitizeInput, validateTransaction } from "../lib/security";
import Navbar from "../components/Navbar";

export default function Swap() {
  const account = useActiveAccount();
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("CHAOS");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get user's Chaos Coin balance
  const { data: chaosCoinBalance } = useReadContract({
    contract: chaosCoinContract,
    method: balanceOf,
    params: [account?.address || ""],
    queryOptions: {
      enabled: !!account?.address,
    },
  });

  // Get quote when amounts change
  useEffect(() => {
    const getQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setToAmount("");
        return;
      }

      try {
        setLoading(true);
        setError("");
        
        const sanitizedAmount = sanitizeInput(fromAmount, 'number');
        const quoteData = await getUniswapQuote(fromToken, toToken, sanitizedAmount);
        
        if (quoteData && quoteData.outputAmount) {
          setToAmount(quoteData.outputAmount);
          setQuote(quoteData);
        } else {
          setError("Unable to get quote. Please try again.");
        }
      } catch (err) {
        console.error("Quote error:", err);
        setError("Failed to get quote. Please check your input.");
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(getQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
    setQuote(null); // Reset quote after swapping
  };

  const handleFromAmountChange = (e) => {
    const value = sanitizeInput(e.target.value, 'number');
    setFromAmount(value.toString());
    setError(""); // Clear errors on new input
  };

  const isSwapDisabled = () => {
    return !account || !fromAmount || parseFloat(fromAmount) <= 0 || loading;
  };

  const executeSwap = async () => {
    if (!quote || isSwapDisabled()) return;
    
    try {
      setLoading(true);
      setError("");
      
      // This is a simplified swap - in production you'd use actual DEX contracts
      alert(`Swap executed: ${fromAmount} ${fromToken} → ${quote.outputAmount} ${toToken}`);
      
      // Reset form
      setFromAmount("");
      setToAmount("");
      setQuote(null);
    } catch (err) {
      console.error("Swap error:", err);
      setError("Swap failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">Swap Tokens</h1>

        <div className="card swap-container">
          <div className="swap-form">
            {error && (
              <div className="error-message" style={{marginBottom: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5'}}>
                {error}
              </div>
            )}

            {/* From Token */}
            <div className="swap-input-group">
              <label className="input-label">From</label>
              <div className="swap-input-container">
                <input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  className="swap-input"
                  min="0"
                  step="0.000001"
                />
                <select 
                  value={fromToken} 
                  onChange={(e) => setFromToken(e.target.value)}
                  className="token-select"
                >
                  <option value="ETH">ETH</option>
                  <option value="CHAOS">CHAOS</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="swap-arrow-container" style={{textAlign: 'center', margin: '1rem 0'}}>
              <button 
                onClick={handleSwapTokens}
                className="swap-arrow-btn"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ⇅
              </button>
            </div>

            {/* To Token */}
            <div className="swap-input-group">
              <label className="input-label">To</label>
              <div className="swap-input-container">
                <input
                  type="number"
                  placeholder="0.0"
                  value={toAmount}
                  readOnly
                  className="swap-input"
                  style={{background: 'rgba(255, 255, 255, 0.05)'}}
                />
                <select 
                  value={toToken} 
                  onChange={(e) => setToToken(e.target.value)}
                  className="token-select"
                >
                  <option value="ETH">ETH</option>
                  <option value="CHAOS">CHAOS</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            {/* Quote Information */}
            {quote && (
              <div className="quote-info" style={{marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Rate</span>
                  <span>1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
                </div>
                {quote.gas && (
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span>Est. Gas</span>
                    <span>{quote.gas} ETH</span>
                  </div>
                )}
              </div>
            )}

            {/* Swap Transaction */}
            {account && quote ? (
              <TransactionButton
                transaction={() => {
                  // This would normally prepare the actual swap transaction
                  // For now, we'll simulate with a transfer
                  return transfer({
                    contract: chaosCoinContract,
                    to: account.address,
                    amount: toWei(fromAmount),
                  });
                }}
                onTransactionSent={() => {
                  console.log("Swap transaction sent");
                }}
                onTransactionConfirmed={() => {
                  setFromAmount("");
                  setToAmount("");
                  setQuote(null);
                }}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '1rem',
                  background: isSwapDisabled() 
                    ? 'rgba(107, 114, 128, 0.3)' 
                    : 'linear-gradient(45deg, #10b981, #34d399)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: isSwapDisabled() ? 'not-allowed' : 'pointer',
                  opacity: isSwapDisabled() ? 0.5 : 1
                }}
                disabled={isSwapDisabled()}
              >
                {loading ? 'Getting Quote...' : 'Swap Tokens'}
              </TransactionButton>
            ) : (
              <button 
                className="btn btn-primary"
                disabled
                style={{width: '100%', marginTop: '1rem', opacity: 0.5}}
              >
                {!account ? 'Connect Wallet to Swap' : 'Enter Amount'}
              </button>
            )}
          </div>

          {/* Balance Information */}
          {account && chaosCoinBalance && (
            <div className="balance-info" style={{marginTop: '2rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px'}}>
              <h3 style={{marginBottom: '1rem'}}>Your Balances</h3>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>CHAOS:</span>
                <span>{fromWei(chaosCoinBalance, 18, 6)} CHAOS</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
