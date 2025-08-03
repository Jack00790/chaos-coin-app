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

// Security utilities for input validation and rate limiting

// Rate limiting storage
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // Max requests per window

// CSP headers for XSS protection
export const getSecurityHeaders = () => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
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

export const validateTransaction = (amount, balance) => {
  const numAmount = parseFloat(amount);
  const numBalance = parseFloat(balance);

  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (numAmount > numBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount too large for security' };
  }

  // Check for decimal precision attacks
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 18) {
    return { valid: false, error: 'Too many decimal places' };
  }

  return { valid: true };
};

export const validatePriceData = (newPrice, oldPrice, maxChangePercent = 50) => {
  if (!oldPrice || oldPrice === 0) return true;

  const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;
  return changePercent <= maxChangePercent;
};

export const checkRateLimit = (identifier) => {
  const now = Date.now();
  const userRequests = rateLimitStore.get(identifier) || [];

  // Remove old requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= MAX_REQUESTS) {
    return false;
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(identifier, validRequests);

  return true;
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