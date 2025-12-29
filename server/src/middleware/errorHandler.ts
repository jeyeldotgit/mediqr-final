import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export function notFound(req: Request, res: Response, _next: NextFunction) {
  logger.warn("Route not found", {
    method: req.method,
    endpoint: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const error = err instanceof Error ? err : new Error(String(err));

  logger.error("Unhandled error", error, {
    method: req.method,
    endpoint: req.originalUrl,
    ip: req.ip,
    statusCode: res.statusCode,
  });

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred.",
    ...(isDevelopment && { details: error.message }),
  });
}
