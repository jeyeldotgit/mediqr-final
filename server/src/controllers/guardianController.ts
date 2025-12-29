import { Request, Response } from "express";
import { supabase } from "../config/supabase";

/**
 * POST /api/guardians/search
 * Search for users to add as guardians
 *
 * For Phase 4 MVP: Simple search by userId or public key
 * In production, this would support email, username, etc.
 */
export async function searchUsers(req: Request, res: Response) {
  try {
    const { userId, publicKey } = req.body;

    if (!userId && !publicKey) {
      return res.status(400).json({
        error: "Validation failed",
        details: "Either userId or publicKey must be provided",
      });
    }

    let query = supabase.from("profiles").select("id, role, public_key");

    if (userId) {
      query = query.eq("id", userId);
    } else if (publicKey) {
      query = query.eq("public_key", publicKey);
    }

    // Only return citizens (guardians should be other citizens)
    query = query.eq("role", "citizen");

    const { data: profiles, error } = await query;

    if (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({
        error: "Failed to search users",
        details: error.message,
      });
    }

    res.json({
      success: true,
      users: (profiles || []).map((p) => ({
        id: p.id,
        role: p.role,
        publicKey: p.public_key,
      })),
    });
  } catch (error) {
    console.error("Unexpected error in searchUsers:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
