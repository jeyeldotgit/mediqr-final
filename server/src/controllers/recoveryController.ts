import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { createShardsSchema, guardianShardSchema } from "../schemas/recovery";

/**
 * POST /api/recovery/shards
 * Create and store multiple recovery shards
 *
 * Accepts an array of encrypted shards (up to 3) and stores them in recovery_shards table.
 * One shard should have guardianId = null (backup shard stored in Supabase).
 */
export async function createRecoveryShards(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = createShardsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { shards } = validationResult.data;

    // Get user ID from request (in production, this would come from JWT)
    // For now, we'll use a userId from the request body or extract from auth
    const userId = (req.body.userId || req.headers["x-user-id"]) as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
        details: "userId must be provided in request body or x-user-id header",
      });
    }

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: "User not found",
        details: "The specified user ID does not exist",
      });
    }

    // Store each shard
    const shardIds: string[] = [];
    const shardRecords = shards.map((shard) => ({
      user_id: userId,
      guardian_id: shard.guardianId || userId, // Use userId as placeholder for backup shard
      encrypted_shard: shard.encryptedShard,
    }));

    const { data: insertedShards, error: insertError } = await supabase
      .from("recovery_shards")
      .insert(shardRecords)
      .select("id");

    if (insertError) {
      console.error("Error inserting shards:", insertError);
      return res.status(500).json({
        error: "Failed to store recovery shards",
        details: insertError.message,
      });
    }

    if (insertedShards) {
      shardIds.push(...insertedShards.map((s) => s.id));
    }

    res.status(201).json({
      success: true,
      shardIds,
      message: `Successfully stored ${shardIds.length} recovery shard(s)`,
    });
  } catch (error) {
    console.error("Unexpected error in createRecoveryShards:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * POST /api/social/shard
 * Store a single guardian shard
 *
 * Stores an encrypted shard associated with a specific guardian.
 */
export async function storeGuardianShard(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = guardianShardSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { guardianId, encryptedShard } = validationResult.data;

    // Get user ID from request
    const userId = (req.body.userId || req.headers["x-user-id"]) as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
        details: "userId must be provided in request body or x-user-id header",
      });
    }

    // Verify user and guardian exist
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .in("id", [userId, guardianId]);

    if (profilesError || !profiles || profiles.length !== 2) {
      return res.status(404).json({
        error: "User or guardian not found",
        details: "Both user and guardian must exist in the system",
      });
    }

    // Check if shard already exists for this guardian
    const { data: existingShard, error: checkError } = await supabase
      .from("recovery_shards")
      .select("id")
      .eq("user_id", userId)
      .eq("guardian_id", guardianId)
      .single();

    let shardId: string;

    if (existingShard) {
      // Update existing shard
      const { data: updatedShard, error: updateError } = await supabase
        .from("recovery_shards")
        .update({ encrypted_shard: encryptedShard })
        .eq("id", existingShard.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("Error updating shard:", updateError);
        return res.status(500).json({
          error: "Failed to update guardian shard",
          details: updateError.message,
        });
      }

      shardId = updatedShard.id;
    } else {
      // Insert new shard
      const { data: insertedShard, error: insertError } = await supabase
        .from("recovery_shards")
        .insert({
          user_id: userId,
          guardian_id: guardianId,
          encrypted_shard: encryptedShard,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Error inserting shard:", insertError);
        return res.status(500).json({
          error: "Failed to store guardian shard",
          details: insertError.message,
        });
      }

      shardId = insertedShard.id;
    }

    res.status(201).json({
      success: true,
      shardId,
      message: "Guardian shard stored successfully",
    });
  } catch (error) {
    console.error("Unexpected error in storeGuardianShard:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/recovery/shards
 * Get all recovery shards for the current user
 */
export async function getRecoveryShards(req: Request, res: Response) {
  try {
    // Get user ID from request
    const userId = (req.query.userId || req.headers["x-user-id"]) as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
        details: "userId must be provided in query params or x-user-id header",
      });
    }

    // Fetch all shards for this user
    const { data: shards, error: fetchError } = await supabase
      .from("recovery_shards")
      .select("id, user_id, guardian_id, encrypted_shard")
      .eq("user_id", userId);

    if (fetchError) {
      console.error("Error fetching shards:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch recovery shards",
        details: fetchError.message,
      });
    }

    res.json({
      success: true,
      shards: shards || [],
    });
  } catch (error) {
    console.error("Unexpected error in getRecoveryShards:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/recovery/shards/:shardId
 * Get a specific shard by ID
 */
export async function getShardById(req: Request, res: Response) {
  try {
    const { shardId } = req.params;

    // Get user ID from request (for authorization check)
    const userId = (req.query.userId || req.headers["x-user-id"]) as string;

    // Fetch the shard
    const { data: shard, error: fetchError } = await supabase
      .from("recovery_shards")
      .select("id, user_id, guardian_id, encrypted_shard")
      .eq("id", shardId)
      .single();

    if (fetchError || !shard) {
      return res.status(404).json({
        error: "Shard not found",
        details: "The specified shard ID does not exist",
      });
    }

    // Verify user owns this shard (if userId provided)
    if (userId && shard.user_id !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have access to this shard",
      });
    }

    res.json(shard);
  } catch (error) {
    console.error("Unexpected error in getShardById:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * DELETE /api/recovery/shards/:shardId
 * Delete a recovery shard
 */
export async function deleteRecoveryShard(req: Request, res: Response) {
  try {
    const { shardId } = req.params;

    // Get user ID from request (for authorization check)
    const userId = (req.body.userId || req.headers["x-user-id"]) as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
        details: "userId must be provided in request body or x-user-id header",
      });
    }

    // Verify user owns this shard
    const { data: shard, error: fetchError } = await supabase
      .from("recovery_shards")
      .select("user_id")
      .eq("id", shardId)
      .single();

    if (fetchError || !shard) {
      return res.status(404).json({
        error: "Shard not found",
        details: "The specified shard ID does not exist",
      });
    }

    if (shard.user_id !== userId) {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have permission to delete this shard",
      });
    }

    // Delete the shard
    const { error: deleteError } = await supabase
      .from("recovery_shards")
      .delete()
      .eq("id", shardId);

    if (deleteError) {
      console.error("Error deleting shard:", deleteError);
      return res.status(500).json({
        error: "Failed to delete recovery shard",
        details: deleteError.message,
      });
    }

    res.json({
      success: true,
      message: "Recovery shard deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error in deleteRecoveryShard:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
