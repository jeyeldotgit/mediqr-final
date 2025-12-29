import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { verifyStaffToken } from "../lib/jwt";
import { logAccess } from "../middleware/auditLog";
import { breakGlassSchema } from "../schemas/emergency";

/**
 * POST /api/emergency/break-glass
 * Emergency break-glass access for ER Admins
 * 
 * This endpoint:
 * 1. Verifies staff JWT token
 * 2. Checks that staff has er_admin role
 * 3. Validates patient ID and justification
 * 4. Returns medical blobs with signed URLs
 * 5. Logs BREAK_GLASS access with justification
 */
export async function breakGlass(req: Request, res: Response) {
  try {
    // Get staff token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        details: "Staff JWT token required in Authorization header",
      });
    }

    const staffToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify staff token
    let staffPayload;
    try {
      staffPayload = verifyStaffToken(staffToken);
    } catch (error) {
      return res.status(401).json({
        error: "Invalid staff token",
        details: error instanceof Error ? error.message : "Token verification failed",
      });
    }

    // Check that staff has er_admin role
    if (staffPayload.role !== "er_admin") {
      return res.status(403).json({
        error: "Forbidden",
        details: "Break-glass access requires er_admin role",
      });
    }

    // Validate request body
    const validationResult = breakGlassSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { patientId, justification } = validationResult.data;

    // Verify patient exists
    const { data: patientProfile, error: patientError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", patientId)
      .single();

    if (patientError || !patientProfile) {
      return res.status(404).json({
        error: "Patient not found",
        details: "The specified patient ID does not exist",
      });
    }

    if (patientProfile.role !== "citizen") {
      return res.status(403).json({
        error: "Invalid patient",
        details: "Patient ID does not belong to a citizen",
      });
    }

    // Get all medical blobs for this patient
    const { data: blobs, error: blobsError } = await supabase
      .from("medical_blobs")
      .select("id, category, storage_path, iv, updated_at")
      .eq("owner_id", patientId)
      .order("updated_at", { ascending: false });

    if (blobsError) {
      console.error("Database error:", blobsError);
      return res.status(500).json({
        error: "Failed to fetch medical records",
        details: blobsError.message,
      });
    }

    // Generate signed URLs for each blob (valid for 1 hour)
    const blobAccess = await Promise.all(
      (blobs || []).map(async (blob) => {
        // Generate signed URL for storage access
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from("vault")
          .createSignedUrl(blob.storage_path, 3600); // 1 hour expiry

        if (urlError) {
          console.error("Error generating signed URL:", urlError);
          return {
            id: blob.id,
            category: blob.category,
            storagePath: blob.storage_path,
            iv: blob.iv,
            updatedAt: blob.updated_at,
            signedUrl: null,
            error: "Failed to generate access URL",
          };
        }

        return {
          id: blob.id,
          category: blob.category,
          storagePath: blob.storage_path,
          iv: blob.iv,
          updatedAt: blob.updated_at,
          signedUrl: signedUrlData?.signedUrl || null,
        };
      })
    );

    // Log BREAK_GLASS access with justification
    await logAccess({
      staffId: staffPayload.staffId,
      patientId: patientId,
      method: "BREAK_GLASS",
      justification: justification,
    });

    res.json({
      success: true,
      patientId: patientId,
      staffId: staffPayload.staffId,
      staffRole: staffPayload.role,
      blobs: blobAccess,
      count: blobAccess.length,
      method: "BREAK_GLASS",
      justification: justification,
      message: "Emergency access granted",
    });
  } catch (error) {
    console.error("Unexpected error in breakGlass:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

