import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { supabase } from "../config/supabase";
import { staffAuthSchema, StaffAuthRequest } from "../schemas/qr";
import { signStaffToken } from "../lib/jwt";

/**
 * POST /api/staff/auth
 * Authenticate staff member and issue JWT token
 *
 * For Phase 3 MVP: Simple email/password authentication
 * In production, this would integrate with professional registry/database
 */
export async function staffAuth(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = staffAuthSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { email, password, role }: StaffAuthRequest = validationResult.data;

    // For Phase 3 MVP: Simple authentication
    // In production, verify against professional registry
    // For now, we'll check if staff profile exists or create one

    // Check if staff profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_verified")
      .eq("role", role)
      .single();

    let staffId: string;
    let isNewUser = false;

    if (profileError || !existingProfile) {
      // Create new staff profile
      // In production, this would require verification against professional registry
      staffId = randomUUID();

      // Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          id: staffId,
          email: email,
          password: password,
          email_confirm: true,
        });

      if (authError) {
        console.error("Auth user creation error:", authError);
        return res.status(500).json({
          error: "Failed to create auth user",
          details: authError.message,
        });
      }

      // Create profile
      const { error: insertError } = await supabase.from("profiles").insert({
        id: staffId,
        role: role,
        is_verified: false, // In production, verify against registry
        public_key: null, // Staff don't need public keys
      });

      if (insertError) {
        // Cleanup auth user if profile creation fails
        await supabase.auth.admin.deleteUser(staffId);
        return res.status(500).json({
          error: "Failed to create profile",
          details: insertError.message,
        });
      }

      isNewUser = true;
    } else {
      // Existing staff - verify password
      // For Phase 3 MVP, we'll use Supabase Auth to verify
      // In production, integrate with professional registry
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError || !authData?.user) {
        return res.status(401).json({
          error: "Authentication failed",
          details: "Invalid email or password",
        });
      }

      staffId = existingProfile.id;
    }

    // Issue JWT token
    const staffToken = signStaffToken({
      staffId: staffId,
      role: role,
    });

    res.json({
      success: true,
      token: staffToken,
      staffId: staffId,
      role: role,
      isNewUser: isNewUser,
      message: isNewUser
        ? "Staff account created and authenticated"
        : "Staff authenticated successfully",
    });
  } catch (error) {
    console.error("Unexpected error in staffAuth:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
