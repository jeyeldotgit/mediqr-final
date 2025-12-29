import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Input validation middleware using Zod schemas
 * 
 * @param schema - Zod schema to validate against
 * @param source - Where to validate from ('body' | 'query' | 'params')
 * @returns Express middleware function
 */
export function validateInput(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
      
      // Validate and parse
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid input data",
          details: errors,
        });
      }

      // Replace original data with validated data
      if (source === "body") {
        req.body = result.data;
      } else if (source === "query") {
        req.query = result.data as any;
      } else {
        req.params = result.data as any;
      }

      next();
    } catch (error) {
      console.error("[InputValidation] Unexpected error:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to validate input",
      });
    }
  };
}

/**
 * Sanitize string inputs to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length (prevent DoS)
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Middleware to sanitize request body
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

