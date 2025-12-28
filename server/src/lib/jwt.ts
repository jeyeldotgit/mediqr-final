import jwt, { SignOptions } from "jsonwebtoken";

// JWT secret - in production, use a strong random secret from environment
const JWT_SECRET =
  process.env.JWT_SECRET || "mediqr-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h"; // Default 1 hour

export interface QRTokenPayload {
  userId: string;
  scope: "vault_access";
  iat?: number;
  exp?: number;
}

export interface StaffTokenPayload {
  staffId: string;
  role: "doctor" | "paramedic" | "er_admin";
  iat?: number;
  exp?: number;
}

/**
 * Sign a QR access token for a user
 * Token is short-lived (default 1 hour) and contains user ID and scope
 */
export function signQRToken(
  payload: Omit<QRTokenPayload, "iat" | "exp">
): string {
  const tokenPayload = {
    userId: payload.userId,
    scope: payload.scope,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    expiresIn: JWT_EXPIRY,
  };
  return jwt.sign(tokenPayload, JWT_SECRET, options);
}

/**
 * Verify and decode a QR access token
 */
export function verifyQRToken(token: string): QRTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as QRTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}

/**
 * Sign a staff JWT token
 * Token contains staff ID and role for RBAC
 */
export function signStaffToken(
  payload: Omit<StaffTokenPayload, "iat" | "exp">
): string {
  const tokenPayload = {
    staffId: payload.staffId,
    role: payload.role,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    expiresIn: "8h", // Staff tokens last longer (8 hours)
  };
  return jwt.sign(tokenPayload, JWT_SECRET, options);
}

/**
 * Verify and decode a staff JWT token
 */
export function verifyStaffToken(token: string): StaffTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as StaffTokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw error;
  }
}
