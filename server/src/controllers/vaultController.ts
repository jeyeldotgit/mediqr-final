import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { supabase } from "../config/supabase";
import { vaultSyncSchema, VaultSyncRequest } from "../schemas/vault";

/**
 * Generate a hashed storage path that doesn't leak identity
 */
function generateStoragePath(ownerId: string, category: string): string {
  // Create a hash of ownerId + category + timestamp for uniqueness
  const hash = createHash("sha256")
    .update(`${ownerId}-${category}-${Date.now()}-${randomUUID()}`)
    .digest("hex");

  // Return path: vault/{first8chars}/{fullhash}.enc
  return `vault/${hash.substring(0, 8)}/${hash}.enc`;
}

/**
 * POST /api/vault/sync
 * Accept encrypted blob and store in Supabase Storage, then create metadata record
 *
 * Storage Requirements:
 * - The 'vault' bucket must exist in Supabase Storage
 * - Bucket must be private (not public)
 * - Storage policies must allow service_role to INSERT/SELECT/DELETE
 * - See server/docs/vault-storage-setup.md for setup instructions
 */
export async function syncVault(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = vaultSyncSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.error.errors,
      });
    }

    const { ownerId, category, encryptedData, iv }: VaultSyncRequest =
      validationResult.data;

    // Verify owner exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: "Profile not found",
        details: "The specified owner ID does not exist",
      });
    }

    // Generate hashed storage path
    const storagePath = generateStoragePath(ownerId, category);

    // Convert base64 encrypted data to buffer
    const encryptedBuffer = Buffer.from(encryptedData, "base64");

    // Upload to Supabase Storage
    // Note: You'll need to create a 'vault' bucket in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vault")
      .upload(storagePath, encryptedBuffer, {
        contentType: "application/octet-stream",
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(500).json({
        error: "Failed to upload encrypted blob",
        details: uploadError.message,
      });
    }

    // Create metadata record in medical_blobs table
    const { data: blobData, error: blobError } = await supabase
      .from("medical_blobs")
      .insert({
        owner_id: ownerId,
        storage_path: storagePath,
        category: category,
        iv: iv,
      })
      .select()
      .single();

    if (blobError) {
      console.error("Metadata creation error:", blobError);

      // Cleanup: try to delete the uploaded file if metadata creation fails
      await supabase.storage.from("vault").remove([storagePath]);

      return res.status(500).json({
        error: "Failed to create metadata record",
        details: blobError.message,
      });
    }

    // Return success with blob ID
    res.status(201).json({
      success: true,
      blobId: blobData.id,
      storagePath: storagePath,
      message: "Vault item synced successfully",
    });
  } catch (error) {
    console.error("Unexpected error in syncVault:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/vault/:ownerId
 * Get all vault items for a specific owner (metadata only, not the encrypted data)
 */
export async function getVaultItems(req: Request, res: Response) {
  try {
    const { ownerId } = req.params;

    if (
      !ownerId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        ownerId
      )
    ) {
      return res.status(400).json({
        error: "Invalid owner ID",
        details: "Owner ID must be a valid UUID",
      });
    }

    // Get all vault items for this owner
    const { data, error } = await supabase
      .from("medical_blobs")
      .select("id, category, updated_at, storage_path")
      .eq("owner_id", ownerId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Failed to fetch vault items",
        details: error.message,
      });
    }

    res.json({
      success: true,
      items: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error in getVaultItems:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
