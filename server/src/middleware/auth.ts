import { Request, Response, NextFunction } from "express";
import { verifyStaffToken, StaffTokenPayload } from "../lib/jwt";

/**
 * Express Request with authenticated staff information
 */
export interface AuthenticatedRequest extends Request {
  staff?: StaffTokenPayload;
}

/**
 * Middleware to verify staff JWT token
 * Adds staff information to request object
 */
export function authenticateStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      details: "Staff JWT token required in Authorization header",
    });
  }

  const token = authHeader.substring(7);

  try {
    const staffPayload = verifyStaffToken(token);
    req.staff = staffPayload;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
      details:
        error instanceof Error ? error.message : "Token verification failed",
    });
  }
}
