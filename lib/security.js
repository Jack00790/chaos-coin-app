import { ethers } from "ethers";

// Contract address validation
export const isValidContractAddress = (address) => {
  try {
    return ethers.utils.isAddress(address) && address !== ethers.constants.AddressZero;
  } catch {
    return false;
  }
};

// Security utilities for input validation and rate limiting

// Rate limiting storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Input validation
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const isValidAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
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

// Rate limiting functionality
export const checkRateLimit = (userAddress) => {
  const now = Date.now();
  const userKey = userAddress.toLowerCase();

  if (!rateLimitStore.has(userKey)) {
    rateLimitStore.set(userKey, { count: 1, firstRequest: now });
    return true;
  }

  const userData = rateLimitStore.get(userKey);

  // Reset if window has passed
  if (now - userData.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(userKey, { count: 1, firstRequest: now });
    return true;
  }

  // Check if under limit
  if (userData.count < MAX_REQUESTS_PER_WINDOW) {
    userData.count++;
    return true;
  }

  return false;
};

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

// Security headers for API responses
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
});

export const sanitizeInput = (input, type = 'string') => {
  if (typeof input !== 'string') {
    input = String(input || '');
  }

  // Enhanced XSS protection
  input = input
    .replace(/[<>\"'&]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '');

  if (type === 'number') {
    const num = parseFloat(input.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : Math.max(0, num);
  }

  if (type === 'address') {
    // Enhanced Ethereum address validation
    const cleaned = input.replace(/[^0x\da-fA-F]/g, '');
    return cleaned.match(/^0x[a-fA-F0-9]{40}$/) ? cleaned : '';
  }

  if (type === 'url') {
    try {
      const url = new URL(input);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  }

  return input.trim().substring(0, 1000); // Limit length
};

export const validatePriceData = (newPrice, oldPrice, maxChangePercent = 50) => {
  if (!oldPrice || oldPrice === 0) return true;

  const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  return changePercent <= maxChangePercent;
};

// Admin validation
export const validateAdmin = (address) => {
  const adminAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS?.toLowerCase();
  return address?.toLowerCase() === adminAddress;
};

// Anti-bot protection
export const validateHuman = () => {
  // Basic bot detection
  return typeof window !== 'undefined' && 
         window.navigator && 
         !window.navigator.webdriver;
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