import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { supabase } from "../config/supabase";
import { authInitSchema, AuthInitRequest } from "../schemas/auth";

/**
 * POST /api/auth/init
 * Initialize a new citizen profile with public key and hashed identifier
 *
 * For Phase 1: Creates a user in auth.users first, then creates the profile
 * In production, this would be handled by Supabase Auth signup flow
 */
export async function initAuth(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = authInitSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { publicKey, hashedIdentifier }: AuthInitRequest =
      validationResult.data;

    // For Phase 1, we need to create a user in auth.users first
    // Generate a UUID for the user
    const userId = randomUUID();

    // Generate a random password (user won't use it, but required by Supabase Auth)
    const randomPassword = randomUUID() + randomUUID();

    // Create user in auth.users using Admin API
    // Note: This requires the service role key
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        id: userId,
        email: `${hashedIdentifier.substring(0, 8)}@mediqr.local`, // Temporary email
        password: randomPassword,
        email_confirm: true, // Auto-confirm for Phase 1
      });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return res.status(500).json({
        error: "Failed to create auth user",
        details: authError.message,
        hint: "Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly in your environment variables",
      });
    }

    // Get the created user's ID
    const authUserId = authData?.user?.id || userId;

    // Insert profile into database
    // The service role should bypass RLS automatically
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: authUserId, // Use the auth user ID
        role: "citizen",
        public_key: publicKey,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      // If profile creation fails and we created an auth user, clean it up
      if (authData?.user) {
        await supabase.auth.admin.deleteUser(userId);
      }

      return res.status(500).json({
        error: "Failed to create profile",
        details: error.message,
        code: error.code,
      });
    }

    // Return success with user ID
    res.status(201).json({
      success: true,
      userId: data.id,
      message: "Profile initialized successfully",
    });
  } catch (error) {
    console.error("Unexpected error in initAuth:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
