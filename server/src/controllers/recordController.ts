import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { recordAccessSchema, RecordAccessRequest } from "../schemas/qr";
import { verifyQRToken, verifyStaffToken } from "../lib/jwt";

/**
 * POST /api/record/access
 * Validate staff JWT + patient QR token, then return storage references for encrypted blobs
 * 
 * This endpoint:
 * 1. Verifies staff JWT token
 * 2. Verifies patient QR token
 * 3. Looks up medical_blobs for the patient
 * 4. Returns storage paths and signed URLs for authorized access
 * 5. Logs the access in access_logs
 */
export async function recordAccess(req: Request, res: Response) {
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

    // Validate request body
    const validationResult = recordAccessSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { qrToken, patientId }: RecordAccessRequest = validationResult.data;

    // Verify QR token
    let qrPayload;
    try {
      qrPayload = verifyQRToken(qrToken);
    } catch (error) {
      return res.status(401).json({
        error: "Invalid QR token",
        details: error instanceof Error ? error.message : "QR token verification failed",
      });
    }

    // Verify patient ID matches QR token
    if (qrPayload.userId !== patientId) {
      return res.status(403).json({
        error: "Token mismatch",
        details: "QR token does not match patient ID",
      });
    }

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

    // Log access in access_logs
    const { error: logError } = await supabase.from("access_logs").insert({
      staff_id: staffPayload.staffId,
      patient_id: patientId,
      method: "QR_SCAN",
    });

    if (logError) {
      console.error("Failed to log access:", logError);
      // Don't fail the request if logging fails, but log the error
    }

    res.json({
      success: true,
      patientId: patientId,
      staffId: staffPayload.staffId,
      staffRole: staffPayload.role,
      blobs: blobAccess,
      count: blobAccess.length,
      message: "Access granted",
    });
  } catch (error) {
    console.error("Unexpected error in recordAccess:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

