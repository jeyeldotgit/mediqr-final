import { z } from "zod";

/**
 * Schema for /vault/sync endpoint
 */
export const vaultSyncSchema = z.object({
  ownerId: z.string().uuid("Owner ID must be a valid UUID"),
  category: z.enum(["identity", "allergies", "medications", "records"], {
    errorMap: () => ({
      message:
        "Category must be one of: identity, allergies, medications, records",
    }),
  }),
  encryptedData: z.string().min(1, "Encrypted data is required"),
  iv: z.string().min(1, "Initialization vector (IV) is required"),
});

export type VaultSyncRequest = z.infer<typeof vaultSyncSchema>;
