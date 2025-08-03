import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { mintTo, transfer } from "thirdweb/extensions/erc20";
import { toWei } from "thirdweb/utils";
import { chaosCoinContract } from "../lib/contract";
import FiatToBuy from "./FiatToBuy";

export default function TokenOperations() {
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const account = useActiveAccount();

  // Parse buy amount to wei (18 decimals)
  const buyParsed = (() => {
    try {
      const num = parseFloat(buyAmount);
      return num > 0 ? toWei(buyAmount) : null;
    } catch {
      return null;
    }
  })();

  // Parse sell amount to wei (18 decimals)
  const sellParsed = (() => {
    try {
      const num = parseFloat(sellAmount);
      return num > 0 ? toWei(sellAmount) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div>
      <h2 className="section-title">Token Operations</h2>

      {/* Fiat Buy Section */}
      <FiatToBuy />

      {/* Crypto Buy Section */}
      <div className="crypto-buy-section">
        <h3 className="section-title">Buy with Crypto (Mint)</h3>
        {account ? (
          <div className="form-group">
            <label className="form-label">CHAOS Amount to Mint</label>
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
              className="action-btn buy-btn"
            >
              Mint {buyAmount || "0"} CHAOS
            </TransactionButton>
          </div>
        ) : (
          <p className="account-message">Connect your wallet to mint tokens.</p>
        )}
      </div>

      {/* Sell Section */}
      <div className="sell-section">
        <h3 className="section-title">Sell CHAOS Tokens</h3>
        {account ? (
          <div className="form-group">
            <label className="form-label">CHAOS Amount to Sell</label>
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
              className="action-btn sell-btn"
            >
              Sell {sellAmount || "0"} CHAOS
            </TransactionButton>
          </div>
        ) : (
          <p className="account-message">Connect your wallet to sell tokens.</p>
        )}
      </div>
    </div>
  );
}