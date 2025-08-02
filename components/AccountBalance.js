import React from "react";
import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { client } from "../lib/client";
import { getActiveChain } from "../lib/contract";

/**
 * Displays the connected wallet's Chaos Coin balance.  It uses the
 * `useWalletBalance` hook introduced in thirdweb’s v5 React SDK【161787696205220†L125-L167】.
 */
export default function AccountBalance() {
  const account = useActiveAccount();

  // When no wallet is connected, we render a helpful message.  The connect
  // button lives in the NavBar component.
  if (!account) {
    return <p className="account-message">Connect your wallet to view your balance.</p>;
  }

  const {
    data: balance,
    isLoading,
    isError,
  } = useWalletBalance({
    chain: getActiveChain(),
    address: account.address,
    client,
    tokenAddress: process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS,
  });

  return (
    <div className="account-balance">
      <h2 className="section-title">Your Balance</h2>
      {isLoading ? (
        <p>Loading balance…</p>
      ) : isError || !balance ? (
        <p className="error">Unable to fetch balance.</p>
      ) : (
        <p>
          {balance.displayValue} {balance.symbol}
        </p>
      )}
    </div>
  );
}