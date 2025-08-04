import { ethers } from "ethers";

// Smart contract security validation
export const isValidContractAddress = (address) => {
  return ethers.isAddress(address);
};

// Transaction validation
export const validateTransaction = (transaction) => {
  if (!transaction || typeof transaction !== 'object') {
    return { isValid: false, error: 'Invalid transaction object' };
  }

  // Check required fields
  const requiredFields = ['to', 'value'];
  for (const field of requiredFields) {
    if (!transaction[field]) {
      return { isValid: false, error: `Missing required field: ${field}` };
    }
  }

  // Validate address format
  if (!ethers.isAddress(transaction.to)) {
    return { isValid: false, error: 'Invalid recipient address' };
  }

  // Validate value is positive
  try {
    const value = ethers.parseEther(transaction.value.toString());
    if (value <= 0) {
      return { isValid: false, error: 'Transaction value must be positive' };
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid transaction value' };
  }

  return { isValid: true };
};

// Rate limiting for admin functions
const adminActionTimestamps = new Map();

export const checkAdminRateLimit = (adminAddress, action, limitMs = 60000) => {
  const key = `${adminAddress}-${action}`;
  const lastAction = adminActionTimestamps.get(key);
  const now = Date.now();

  if (lastAction && (now - lastAction) < limitMs) {
    return { allowed: false, timeLeft: limitMs - (now - lastAction) };
  }

  adminActionTimestamps.set(key, now);
  return { allowed: true };
};

// Input sanitization with enhanced XSS protection
export const sanitizeInput = (input, maxLength = 2000) => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
    .replace(/data:(?!image\/(?:png|jpg|jpeg|gif|webp))[^;]*;/gi, ''); // Remove dangerous data URLs
};

// Validate file uploads
export const validateFileUpload = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'File type not allowed' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'File size too large (max 10MB)' };
  }

  return { isValid: true };
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

// Security headers for API responses
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
});