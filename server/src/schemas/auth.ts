import { z } from "zod";

/**
 * Schema for /auth/init endpoint
 */
export const authInitSchema = z.object({
  publicKey: z.string().min(1, "Public key is required"),
  hashedIdentifier: z.string().min(1, "Hashed identifier is required"),
});

export type AuthInitRequest = z.infer<typeof authInitSchema>;

