import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limiting middleware
 * 
 * @param options - Rate limit configuration
 * @returns Express middleware function
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => {
      // Default: use IP address
      return req.ip || req.socket.remoteAddress || "unknown";
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const entry = store[key];

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    // Increment counter
    entry.count++;

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count).toString());
    res.setHeader("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());

    // Track response status for skip options
    const originalSend = res.send;
    res.send = function (body) {
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 300;
      const isFailure = statusCode >= 400;

      // Decrement if we should skip this request
      if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && isFailure)) {
        entry.count = Math.max(0, entry.count - 1);
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (req) => {
      // Use email if available, otherwise IP
      const body = req.body as { email?: string };
      return body?.email || req.ip || "unknown";
    },
  }),

  // Moderate rate limit for general API endpoints
  api: rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  }),

  // Strict rate limit for QR token rotation
  qrRotate: rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 rotations per hour
    keyGenerator: (req) => {
      const body = req.body as { ownerId?: string };
      return body?.ownerId || req.ip || "unknown";
    },
  }),

  // Strict rate limit for vault operations
  vault: rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  }),

  // Very strict rate limit for emergency break-glass
  emergency: rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 break-glass attempts per hour per staff member
    keyGenerator: (req) => {
      // Use staff ID from JWT if available
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          // Extract staff ID from token (simplified - in production, decode JWT properly)
          return `staff:${authHeader}`;
        } catch {
          // Fall back to IP
        }
      }
      return req.ip || "unknown";
    },
  }),
};

