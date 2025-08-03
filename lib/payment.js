
import { createThirdwebClient } from "thirdweb";
import { sepolia, arbitrum, optimism, base, avalanche } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_TW_CLIENT_ID,
});

// Payment configuration with security controls
export const PAYMENT_CONFIG = {
  supportedChains: [avalanche, sepolia, arbitrum, optimism, base],
  minPurchaseUSD: 1,
  maxPurchaseUSD: 10000, // Anti-money laundering limit
  processingFee: 0.025, // 2.5%
  gasBuffer: 1.2, // 20% gas buffer for transactions
  slippageTolerance: 0.01, // 1% slippage protection
};

// Secure payment validation
export const validatePayment = (amount, chain, userAddress) => {
  const errors = [];
  
  if (!amount || amount < PAYMENT_CONFIG.minPurchaseUSD) {
    errors.push(`Minimum purchase: $${PAYMENT_CONFIG.minPurchaseUSD}`);
  }
  
  if (amount > PAYMENT_CONFIG.maxPurchaseUSD) {
    errors.push(`Maximum purchase: $${PAYMENT_CONFIG.maxPurchaseUSD}`);
  }
  
  if (!PAYMENT_CONFIG.supportedChains.find(c => c.id === chain.id)) {
    errors.push("Unsupported chain");
  }
  
  if (!userAddress || userAddress.length !== 42) {
    errors.push("Invalid wallet address");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting for payments (prevent spam)
const paymentAttempts = new Map();

export const checkRateLimit = (userAddress) => {
  const now = Date.now();
  const attempts = paymentAttempts.get(userAddress) || [];
  
  // Remove attempts older than 1 hour
  const recentAttempts = attempts.filter(time => now - time < 3600000);
  
  if (recentAttempts.length >= 10) { // Max 10 attempts per hour
    return false;
  }
  
  recentAttempts.push(now);
  paymentAttempts.set(userAddress, recentAttempts);
  return true;
};

export { client };
