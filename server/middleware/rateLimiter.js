import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for AI execution endpoints — 30 requests per minute
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter — 100 requests per minute
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
