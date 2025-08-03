import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { TransactionButton } from "thirdweb/react";
import { mintTo, transfer } from "thirdweb/extensions/erc20";
import { chaosCoinContract } from "../lib/contract";
import FiatToBuy from "./FiatToBuy";

/**
 * Component containing mint and transfer forms.  The mint operation corresponds
 * to buying Chaos Coin; the transfer operation corresponds to selling (tokens
 * are sent to a treasury address).  Transactions are dispatched using
 * thirdweb’s `TransactionButton`【622043461082774†L138-L180】.
 */
export default function TokenOperations() {
  const account = useActiveAccount();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");

  // Validate numeric input.  We coerce the string into a BigInt only if the
  // value is a non‑negative integer.  The ERC‑20 extensions expect integer
  // amounts without decimal places; decimals are handled by the contract.
  function parseAmount(value) {
    try {
      const trimmed = value.trim();
      if (!trimmed) return null;
      // Only allow numeric characters
      if (!/^[0-9]+$/.test(trimmed)) return null;
      const amount = BigInt(trimmed);
      return amount >= 0n ? amount : null;
    } catch (e) {
      return null;
    }
  }

  const buyParsed = parseAmount(buyAmount);
  const sellParsed = parseAmount(sellAmount);

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
          <p className="account-message">Connect your wallet to mint tokens</p>
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
                console.log("Transaction submitted", result.transactionHash);
              }}
              onTransactionConfirmed={(receipt) => {
                console.log("Transaction confirmed", receipt.transactionHash);
                setSellAmount("");
              }}
              disabled={!sellParsed || sellParsed <= 0n}
              className="action-btn sell-btn"
            >
              Sell {sellAmount || "0"} CHAOS
            </TransactionButton>
          </div>
        ) : (
          <p className="account-message">Connect your wallet to sell tokens</p>
        )}
      </div>
    </div>
  );
}(sellAmount);

  return (
    <div className="token-ops">
      <h2 className="section-title">Buy / Sell Chaos Coin</h2>
      {!account && (
        <p className="account-message">Connect your wallet to trade.</p>
      )}
      <div className="form-group">
        <label htmlFor="buy" className="form-label">
          Amount to buy
        </label>
        <input
          id="buy"
          type="text"
          className="form-input"
          placeholder="e.g. 10"
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value)}
        />
        <TransactionButton
          className="action-btn buy-btn"
          // The transaction callback is called only when the user clicks the button.
          transaction={() => {
            if (!account || buyParsed === null) return null;
            return mintTo({
              contract: chaosCoinContract,
              to: account.address,
              amount: buyParsed,
            });
          }}
          onTransactionSent={(result) => {
            console.log("Buy transaction sent", result.transactionHash);
          }}
          onTransactionConfirmed={(receipt) => {
            console.log("Buy transaction confirmed", receipt.transactionHash);
            // Reset the input after confirmation
            setBuyAmount("");
          }}
          onError={(error) => {
            console.error("Buy transaction error", error);
          }}
          disabled={!account || buyParsed === null || buyParsed === 0n}
        >
          Buy
        </TransactionButton>
      </div>

      <div className="form-group">
        <label htmlFor="sell" className="form-label">
          Amount to sell
        </label>
        <input
          id="sell"
          type="text"
          className="form-input"
          placeholder="e.g. 5"
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
        />
        <TransactionButton
          className="action-btn sell-btn"
          transaction={() => {
            if (!account || sellParsed === null) return null;
            return transfer({
              contract: chaosCoinContract,
              to: process.env.NEXT_PUBLIC_TREASURY_ADDRESS,
              amount: sellParsed,
            });
          }}
          onTransactionSent={(result) => {
            console.log("Sell transaction sent", result.transactionHash);
          }}
          onTransactionConfirmed={(receipt) => {
            console.log("Sell transaction confirmed", receipt.transactionHash);
            setSellAmount("");
          }}
          onError={(error) => {
            console.error("Sell transaction error", error);
          }}
          disabled={!account || sellParsed === null || sellParsed === 0n}
        >
          Sell
        </TransactionButton>
      </div>
    </div>
  );
}