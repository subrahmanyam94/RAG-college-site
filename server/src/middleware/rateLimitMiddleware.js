const rateLimit = require('express-rate-limit');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Limit each IP to 40 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

// Rate limiter for RAG chat query endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 queries per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Query rate limit exceeded. Please wait a moment before sending more queries.',
  },
});

module.exports = {
  authLimiter,
  chatLimiter,
};
