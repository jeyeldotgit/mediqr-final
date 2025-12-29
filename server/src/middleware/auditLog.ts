import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AuthenticatedRequest } from "./auth";

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  staffId: string;
  patientId: string;
  method: "QR_SCAN" | "BREAK_GLASS";
  justification?: string;
}

/**
 * Middleware to log access attempts to access_logs table
 * Should be used after authentication middleware
 */
export async function logAccess(entry: AuditLogEntry): Promise<void> {
  try {
    const logData: {
      staff_id: string;
      patient_id: string;
      method: string;
      justification?: string;
    } = {
      staff_id: entry.staffId,
      patient_id: entry.patientId,
      method: entry.method,
    };

    // Only add justification for BREAK_GLASS
    if (entry.method === "BREAK_GLASS" && entry.justification) {
      logData.justification = entry.justification;
    }

    const { error } = await supabase.from("access_logs").insert(logData);

    if (error) {
      console.error("Failed to log access:", error);
      // Don't throw - logging failures shouldn't break the request
    }
  } catch (error) {
    console.error("Unexpected error in logAccess:", error);
    // Don't throw - logging failures shouldn't break the request
  }
}

/**
 * Helper function to get access method from request context
 * This can be used by endpoints to determine how access was granted
 */
export function getAccessMethod(req: Request): "QR_SCAN" | "BREAK_GLASS" {
  // Check if request has break-glass flag
  // This would be set by the break-glass endpoint
  return (req as any).accessMethod || "QR_SCAN";
}

