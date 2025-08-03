
import React, { useState, useEffect } from "react";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { balanceOf } from "thirdweb/extensions/erc20";
import { chaosCoinContract } from "../lib/contract";
import { getTransactionHistory, subscribeToBalanceUpdates } from "../lib/transactionHistory";
import { getTokenPrice, subscribeToPriceUpdates } from "../lib/uniswap";
import Navbar from "../components/Navbar";

export default function Wallet() {
  const account = useActiveAccount();
  const [transactions, setTransactions] = useState([]);
  const [tokenPrice, setTokenPrice] = useState(0.001);

  // Secure balance reading
  const { 
    data: balance, 
    isLoading: loadingBalance, 
    error: balanceError 
  } = useReadContract(
    balanceOf,
    {
      contract: chaosCoinContract,
      address: account?.address || "0x0000000000000000000000000000000000000000",
    }
  );

  useEffect(() => {
    fetchTokenPrice();
    if (account) {
      loadTransactionHistory();
    }
  }, [account]);

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
        setTokenPrice(0.001);
      }
    } catch (error) {
      console.error("Error fetching token price:", error);
      setTokenPrice(0.001);
    }
  };

  const loadTransactionHistory = async () => {
    if (!account?.address) return;
    
    try {
      const realTransactions = await getTransactionHistory(
        account.address,
        process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS
      );
      
      const formattedTransactions = realTransactions.map(tx => ({
        type: tx.type,
        amount: tx.amount,
        usdValue: (parseFloat(tx.amount) * tokenPrice).toFixed(2),
        date: tx.date,
        hash: `${tx.hash.substring(0, 10)}...`,
        status: tx.status,
        fullHash: tx.hash,
        timestamp: tx.timestamp
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    }
  };

  const formatBalance = (balance) => {
    if (!balance) return "0";
    const balanceInEther = Number(balance) / 10**18;
    return balanceInEther.toFixed(2);
  };

  const calculateUSDValue = (tokenAmount) => {
    return (parseFloat(tokenAmount) * tokenPrice).toFixed(2);
  };

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">My Wallet</h1>
          <div className="card text-center">
            <h2 className="section-title">Connect Your Wallet</h2>
            <p className="text-gray">Please connect your wallet to view your CHAOS tokens</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">My Wallet</h1>

        {/* Account Summary */}
        <div className="card">
          <h2 className="section-title">Account Summary</h2>
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <div style={{fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem'}}>
              Connected Wallet
            </div>
            <div style={{fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all'}}>
              {account.address}
            </div>
          </div>
          
          <div className="market-data">
            <div className="market-stat">
              <div className="market-stat-label">CHAOS Balance</div>
              <div className="market-stat-value">
                {loadingBalance ? (
                  <span className="spinner"></span>
                ) : balanceError ? (
                  "Error"
                ) : (
                  `${formatBalance(balance)} CHAOS`
                )}
              </div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">USD Value</div>
              <div className="market-stat-value">
                ${calculateUSDValue(formatBalance(balance))}
              </div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Current Price</div>
              <div className="market-stat-value">${tokenPrice.toFixed(6)}</div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card">
          <h2 className="section-title">Transaction History</h2>
          <div className="transaction-history">
            {transactions.length === 0 ? (
              <p className="text-gray text-center">No transactions found</p>
            ) : (
              transactions.map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-type">
                      <span style={{
                        color: tx.type === 'Buy' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {tx.type === 'Buy' ? '↗️' : '↘️'} {tx.type}
                      </span>
                    </div>
                    <div className="transaction-date">{tx.date}</div>
                    <div style={{fontSize: '0.8rem', color: '#6b7280'}}>
                      {tx.hash}
                    </div>
                  </div>
                  <div className="transaction-amount">
                    <div>{tx.amount} CHAOS</div>
                    <div style={{fontSize: '0.9rem', color: '#9ca3af'}}>
                      ${tx.usdValue}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: tx.status === 'Completed' ? '#10b981' : '#ef4444'
                    }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* YouTube Tutorial */}
        <div className="card">
          <h2 className="section-title">How to Import Tokens to MetaMask</h2>
          <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/6Gf_kRE4MJU" 
              title="How to Add Custom Tokens to MetaMask" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              style={{borderRadius: '12px', maxWidth: '560px'}}
            />
          </div>
        </div>

        {/* Token Information */}
        <div className="card">
          <h2 className="section-title">Don't See Your Tokens?</h2>
          <p className="text-gray mb-3" style={{textAlign: 'center'}}>
            If you don't see your CHAOS tokens in your wallet, you may need to add the token address manually.
          </p>
          
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)'}}>
            <h3 style={{color: '#10b981', marginBottom: '1rem'}}>CHAOS Token Information:</h3>
            <div style={{display: 'grid', gap: '0.5rem', fontSize: '0.9rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Token Address:</span>
                <span style={{fontFamily: 'monospace', wordBreak: 'break-all'}}>
                  {process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Token Symbol:</span>
                <span>CHAOS</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Decimals:</span>
                <span>18</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Network:</span>
                <span>{process.env.NEXT_PUBLIC_CHAIN}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
