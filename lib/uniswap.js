import { Bridge } from "thirdweb";
import { client } from "./client";

// Get real-time token price using thirdweb Bridge
export const getTokenPrice = async (tokenAddress, chainId = 1) => {
  try {
    // First try thirdweb Bridge API
    const token = await Bridge.tokens({
      chainId: chainId,
      tokenAddress: tokenAddress,
      client,
    });

    if (token && token.length > 0 && token[0].priceUsd) {
      return parseFloat(token[0].priceUsd);
    }

    // Fallback to DexScreener
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    const data = await response.json();

    if (data.pairs && data.pairs.length > 0) {
      return parseFloat(data.pairs[0].priceUsd || "0");
    }

    return 0.001; // Fallback price
  } catch (error) {
    console.error("Error fetching token price:", error);
    return 0.001;
  }
};

// Get swap routes using thirdweb Bridge
export const getUniswapQuote = async (fromToken, toToken, amount) => {
  try {
    // Map token symbols to addresses (you'll need to expand this)
    const tokenMap = {
      "ETH": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      "CHAOS": process.env.NEXT_PUBLIC_CHAOS_COIN_ADDRESS,
      "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    };

    const fromTokenAddress = tokenMap[fromToken];
    const toTokenAddress = tokenMap[toToken];

    if (!fromTokenAddress || !toTokenAddress) {
      throw new Error("Unsupported token pair");
    }

    // Get routes using Bridge API
    const routes = await Bridge.routes({
      originChainId: 1,
      originTokenAddress: fromTokenAddress,
      destinationChainId: 1,
      destinationTokenAddress: toTokenAddress,
      client,
    });

    if (routes && routes.length > 0) {
      // Calculate output amount based on current rates
      const fromPrice = await getTokenPrice(fromTokenAddress);
      const toPrice = await getTokenPrice(toTokenAddress);

      if (fromPrice > 0 && toPrice > 0) {
        const exchangeRate = fromPrice / toPrice;
        const outputAmount = (parseFloat(amount) * exchangeRate * 0.997).toFixed(6); // Include 0.3% fee

        return {
          inputAmount: amount,
          outputAmount: outputAmount,
          exchangeRate: exchangeRate,
          priceImpact: "0.1%",
          minimumReceived: (parseFloat(outputAmount) * 0.99).toFixed(6),
          route: routes[0]
        };
      }
    }

    // Fallback calculation
    const exchangeRate = fromToken === "ETH" ? 2000 : 0.0005;
    const outputAmount = (parseFloat(amount) * exchangeRate).toFixed(6);

    return {
      inputAmount: amount,
      outputAmount: outputAmount,
      exchangeRate: exchangeRate,
      priceImpact: "0.1%",
      minimumReceived: (parseFloat(outputAmount) * 0.99).toFixed(6)
    };
  } catch (error) {
    console.error("Error getting swap quote:", error);
    return null;
  }
};

// Real-time price streaming
export const subscribeToPriceUpdates = (tokenAddress, callback, interval = 30000) => {
  const updatePrice = async () => {
    const price = await getTokenPrice(tokenAddress);
    callback(price);
  };

  const intervalId = setInterval(updatePrice, interval);
  updatePrice(); // Initial call

  return () => clearInterval(intervalId);
};