
import { ethers } from "ethers";

// Contract address validation
export const isValidContractAddress = (address) => {
  try {
    return ethers.utils.isAddress(address) && address !== ethers.constants.AddressZero;
  } catch {
    return false;
  }
};

// Transaction security checks
export const validateTransaction = (tx) => {
  const checks = {
    hasValidTo: isValidContractAddress(tx.to),
    hasReasonableGas: tx.gasLimit && tx.gasLimit < 500000n, // Prevent gas attacks
    hasValidValue: tx.value >= 0n,
    hasValidData: tx.data && tx.data.length > 0
  };
  
  return {
    isSecure: Object.values(checks).every(Boolean),
    checks
  };
};

// Input sanitization
export const sanitizeInput = (input, type = 'string') => {
  if (type === 'number') {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  
  if (type === 'address') {
    return isValidContractAddress(input) ? input : null;
  }
  
  return input.toString().trim().slice(0, 1000); // Prevent XSS
};

// Price manipulation protection
export const validatePriceData = (priceData, lastKnownPrice) => {
  if (!priceData || !lastKnownPrice) return false;
  
  const priceChange = Math.abs(priceData - lastKnownPrice) / lastKnownPrice;
  return priceChange < 0.5; // Reject price changes > 50%
};

// Environment validation
export const validateEnv = () => {
  const required = [
    'NEXT_PUBLIC_TW_CLIENT_ID',
    'NEXT_PUBLIC_CHAOS_COIN_ADDRESS', 
    'NEXT_PUBLIC_CHAIN',
    'NEXT_PUBLIC_TREASURY_ADDRESS'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};
