
import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { mintTo, transfer } from "thirdweb/extensions/erc20";
import { toWei } from "thirdweb/utils";
import { chaosCoinContract } from "../lib/contract";

export default function TokenOperations() {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const account = useActiveAccount();

  const buyParsed = (() => {
    try {
      const num = parseFloat(buyAmount);
      return num > 0 ? toWei(buyAmount) : null;
    } catch {
      return null;
    }
  })();

  const sellParsed = (() => {
    try {
      const num = parseFloat(sellAmount);
      return num > 0 ? toWei(sellAmount) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="card">
      <h2 className="section-title">Token Operations</h2>

      {/* Buy Section */}
      <div className="form-section">
        <h3 className="section-title">Mint CHAOS Tokens</h3>
        {account ? (
          <div className="form-group">
            <label className="form-label">Amount to Mint</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              min="0"
            />
            <TransactionButton
              transaction={() =>
                mintTo({
                  contract: chaosCoinContract,
                  to: account.address,
                  amount: buyParsed || 0n,
                })
              }
              onTransactionSent={(result) => {
                console.log("Transaction submitted", result.transactionHash);
              }}
              onTransactionConfirmed={(receipt) => {
                console.log("Transaction confirmed", receipt.transactionHash);
                setBuyAmount("");
              }}
              disabled={!buyParsed || buyParsed <= 0n}
              className="btn btn-primary"
              style={{width: '100%', marginTop: '1rem'}}
            >
              Mint {buyAmount || "0"} CHAOS
            </TransactionButton>
          </div>
        ) : (
          <p className="text-gray">Connect your wallet to mint tokens.</p>
        )}
      </div>

      {/* Sell Section */}
      <div className="form-section">
        <h3 className="section-title">Sell CHAOS Tokens</h3>
        {account ? (
          <div className="form-group">
            <label className="form-label">Amount to Sell</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter amount"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              min="0"
            />
            <TransactionButton
              transaction={() =>
                transfer({
                  contract: chaosCoinContract,
                  to: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
                  amount: sellParsed || 0n,
                })
              }
              onTransactionSent={(result) => {
                console.log("Sell transaction sent", result.transactionHash);
              }}
              onTransactionConfirmed={(receipt) => {
                console.log("Sell transaction confirmed", receipt.transactionHash);
                setSellAmount("");
              }}
              disabled={!sellParsed || sellParsed <= 0n}
              className="btn btn-secondary"
              style={{width: '100%', marginTop: '1rem'}}
            >
              Sell {sellAmount || "0"} CHAOS
            </TransactionButton>
          </div>
        ) : (
          <p className="text-gray">Connect your wallet to sell tokens.</p>
        )}
      </div>
    </div>
  );
}
