
import crypto from 'crypto';

export const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
};

export const rateLimitWebhook = (() => {
  const attempts = new Map();
  const maxAttempts = 10;
  const timeWindow = 60000; // 1 minute

  return (identifier) => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier) || [];
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < timeWindow);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    attempts.set(identifier, recentAttempts);
    return true;
  };
})();

export const validatePaymentAmount = (amount, min = 1, max = 10000) => {
  const numAmount = parseFloat(amount);
  return numAmount >= min && numAmount <= max;
};
