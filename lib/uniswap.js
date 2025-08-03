
// Uniswap V3 integration for real-time quotes
export const getUniswapQuote = async (tokenIn, tokenOut, amountIn, chainId = 1) => {
  try {
    // Using Uniswap's quote API
    const response = await fetch(
      `https://api.uniswap.org/v1/quote?tokenInAddress=${tokenIn}&tokenOutAddress=${tokenOut}&amount=${amountIn}&chainId=${chainId}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch quote');
    }
    
    const data = await response.json();
    return {
      amountOut: data.amountOut,
      priceImpact: data.priceImpact,
      gasEstimate: data.gasEstimate,
      route: data.route,
      slippage: data.slippage
    };
  } catch (error) {
    console.error('Error fetching Uniswap quote:', error);
    return null;
  }
};

// Get current token price from Uniswap
export const getTokenPrice = async (tokenAddress, chainId = 1) => {
  try {
    // USDC address as base for pricing
    const USDC_ADDRESS = '0xA0b86a33E6441b7c4c85c7b29c2e47E89B6Fb38A';
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    
    const quote = await getUniswapQuote(
      tokenAddress,
      USDC_ADDRESS,
      '1000000000000000000', // 1 token
      chainId
    );
    
    if (quote) {
      return parseFloat(quote.amountOut) / 1000000; // Convert USDC decimals
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
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
