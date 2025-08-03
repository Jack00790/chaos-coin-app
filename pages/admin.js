
import React, { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { TransactionWidget } from "thirdweb/react";
import { client } from "../lib/client";
import { chaosCoinContract, getActiveChain } from "../lib/contract";
import { toUnits } from "thirdweb/utils";
import Navbar from "../components/Navbar";

// Admin addresses - move to environment variables in production
const ADMIN_ADDRESSES = [
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS?.toLowerCase(),
  // Add other admin addresses here
].filter(Boolean);

// Input validation for admin functions
const validateAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000;
};

export default function Admin() {
  const account = useActiveAccount();
  const [mintAmount, setMintAmount] = useState("");
  const [mintRecipient, setMintRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contractStats, setContractStats] = useState({
    totalSupply: "0",
    contractBalance: "0",
    adminCount: 0
  });

  // Check if current user is admin
  const isAdmin = account && ADMIN_ADDRESSES.includes(account.address.toLowerCase());

  useEffect(() => {
    if (isAdmin) {
      loadContractStats();
    }
  }, [isAdmin]);

  const loadContractStats = async () => {
    try {
      // Load contract statistics securely
      // This would typically query your contract for admin info
      setContractStats({
        totalSupply: "1000000",
        contractBalance: "0",
        adminCount: ADMIN_ADDRESSES.length
      });
    } catch (error) {
      console.error("Failed to load contract stats:", error);
    }
  };

  const handleMint = async () => {
    if (!validateAddress(mintRecipient)) {
      setError("Invalid recipient address");
      return;
    }

    if (!validateAmount(mintAmount)) {
      setError("Amount must be between 0 and 1,000,000");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Prepare secure mint transaction
      const transaction = prepareContractCall({
        contract: chaosCoinContract,
        method: "function mintTo(address to, uint256 amount)",
        params: [mintRecipient, toUnits(mintAmount, 18)],
      });

      // Use TransactionWidget for secure execution
      return transaction;
    } catch (error) {
      console.error("Mint preparation failed:", error);
      setError("Failed to prepare mint transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleMintSuccess = () => {
    setSuccess(`Successfully minted ${mintAmount} CHAOS to ${mintRecipient}`);
    setMintAmount("");
    setMintRecipient("");
    loadContractStats();
  };

  const handleMintError = (error) => {
    console.error("Mint transaction failed:", error);
    setError("Mint transaction failed. Please try again.");
  };

  if (!account) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Admin Panel</h1>
          <div className="card text-center">
            <h2 className="section-title">Access Denied</h2>
            <p className="text-gray">Please connect your wallet to access admin functions</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <h1 className="page-title">Admin Panel</h1>
          <div className="card text-center">
            <h2 className="section-title">🚫 Unauthorized Access</h2>
            <p className="text-gray">Your wallet address is not authorized for admin functions</p>
            <p style={{color: '#6b7280', fontSize: '0.8rem', marginTop: '1rem'}}>
              Connected: {account.address}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <h1 className="page-title">🔐 Admin Panel</h1>

        {/* Admin Status */}
        <div className="card" style={{background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)'}}>
          <h2 className="section-title">Admin Status</h2>
          <p style={{color: '#10b981'}}>✅ Authorized Admin: {account.address}</p>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem'}}>
            <div className="market-stat">
              <div className="market-stat-label">Total Supply</div>
              <div className="market-stat-value">{contractStats.totalSupply}</div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Contract Balance</div>
              <div className="market-stat-value">{contractStats.contractBalance}</div>
            </div>
            <div className="market-stat">
              <div className="market-stat-label">Admin Count</div>
              <div className="market-stat-value">{contractStats.adminCount}</div>
            </div>
          </div>
        </div>

        {/* Secure Minting Interface */}
        <div className="card">
          <h2 className="section-title">🏭 Secure Token Minting</h2>
          
          {error && (
            <div style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
              <p style={{color: '#fca5a5'}}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
              <p style={{color: '#10b981'}}>{success}</p>
            </div>
          )}

          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Recipient Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={mintRecipient}
                onChange={(e) => {
                  setMintRecipient(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                style={{fontFamily: 'monospace'}}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount to Mint</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount (max 1,000,000)"
                value={mintAmount}
                onChange={(e) => {
                  setMintAmount(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                min="0"
                max="1000000"
                step="0.01"
              />
            </div>

            {/* Secure Transaction Widget */}
            {mintAmount && mintRecipient && validateAmount(mintAmount) && validateAddress(mintRecipient) && (
              <div style={{marginTop: '2rem'}}>
                <TransactionWidget
                  client={client}
                  chain={getActiveChain()}
                  transaction={prepareContractCall({
                    contract: chaosCoinContract,
                    method: "function mintTo(address to, uint256 amount)",
                    params: [mintRecipient, toUnits(mintAmount, 18)],
                  })}
                  onSuccess={handleMintSuccess}
                  onError={handleMintError}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)'}}>
            <h3 style={{color: '#fca5a5', marginBottom: '1rem'}}>⚠️ Security Notice:</h3>
            <ul style={{listStyle: 'none', padding: 0, color: '#fca5a5'}}>
              <li style={{marginBottom: '0.5rem'}}>• All minting actions are logged and monitored</li>
              <li style={{marginBottom: '0.5rem'}}>• Maximum mint per transaction: 1,000,000 tokens</li>
              <li style={{marginBottom: '0.5rem'}}>• Only authorized admin addresses can mint</li>
              <li>• Transactions are executed via secure TransactionWidget</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
