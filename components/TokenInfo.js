import React from "react";
import { useReadContract } from "thirdweb/react";
import { totalSupply, decimals } from "thirdweb/extensions/erc20";
import { chaosCoinContract } from "../lib/contract";

/**
 * Component for displaying token metadata such as total supply.  The ERC‑20
 * extensions from the thirdweb SDK are used to prepare read calls【644630468887960†L232-L249】.
 */
export default function TokenInfo() {
  // Fetch total supply and decimals from the contract.  These hooks
  // automatically re‑render when the values change.
  const {
    data: supply,
    isLoading: loadingSupply,
    error: supplyError,
  } = useReadContract(totalSupply, { contract: chaosCoinContract });
  const {
    data: tokenDecimals,
    isLoading: loadingDecimals,
    error: decimalsError,
  } = useReadContract(decimals, { contract: chaosCoinContract });

  // Convert the supply into human‑readable units once both calls return.  If
  // either value is undefined we default to null and handle rendering below.
  let formattedSupply = null;
  if (typeof supply === "bigint" && typeof tokenDecimals === "bigint") {
    const divisor = 10n ** tokenDecimals;
    const integerPart = supply / divisor;
    const fractionalPart = supply % divisor;
    // Pad fractional part with zeros according to decimals
    const fractionalString = fractionalPart
      .toString()
      .padStart(Number(tokenDecimals), "0")
      .replace(/0+$/, "");
    formattedSupply = fractionalString
      ? `${integerPart.toString()}.${fractionalString}`
      : integerPart.toString();
  }

  return (
    <div className="token-info">
      <h2 className="section-title">Token Information</h2>
      {loadingSupply || loadingDecimals ? (
        <p>Loading token info…</p>
      ) : supplyError || decimalsError ? (
        <p className="error">Error loading token info.</p>
      ) : (
        <div>
          {formattedSupply !== null && (
            <p className="token-supply">
              <strong>Total Supply:</strong> {formattedSupply}
            </p>
          )}
        </div>
      )}
    </div>
  );
}