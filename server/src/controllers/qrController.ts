import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { qrRotateSchema, QRRotateRequest } from "../schemas/qr";
import { signQRToken } from "../lib/jwt";

/**
 * POST /api/qr/rotate
 * Issue or update a short-lived access token for QR code generation
 * 
 * This endpoint creates a new QR access token that can be embedded in a QR code.
 * The token is short-lived (default 1 hour) and allows staff to access the user's vault.
 */
export async function rotateQRToken(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = qrRotateSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { ownerId }: QRRotateRequest = validationResult.data;

    // Verify owner exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: "Profile not found",
        details: "The specified owner ID does not exist",
      });
    }

    // Verify user is a citizen (not staff)
    if (profile.role !== "citizen") {
      return res.status(403).json({
        error: "Unauthorized",
        details: "Only citizens can generate QR codes",
      });
    }

    // Generate a short-lived QR access token
    const qrToken = signQRToken({
      userId: ownerId,
      scope: "vault_access",
    });

    // Return token (client will combine with local fragment to create QR)
    res.json({
      success: true,
      qrToken: qrToken,
      expiresIn: "1h", // Token expires in 1 hour
      message: "QR token generated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in rotateQRToken:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

