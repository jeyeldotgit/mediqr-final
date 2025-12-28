import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response, _next: NextFunction) {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // TODO: plug in a proper logger
  // eslint-disable-next-line no-console
  console.error("[errorHandler]", err);

  res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred.",
  });
}
