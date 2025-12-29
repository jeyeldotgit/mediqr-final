import { z } from "zod";

/**
 * Schema for creating recovery shards
 */
export const createShardsSchema = z.object({
  shards: z
    .array(
      z.object({
        guardianId: z.string().uuid().nullable(),
        encryptedShard: z.string().min(1),
      })
    )
    .min(1)
    .max(3),
});

export type CreateShardsRequest = z.infer<typeof createShardsSchema>;

/**
 * Schema for storing a single guardian shard
 */
export const guardianShardSchema = z.object({
  guardianId: z.string().uuid(),
  encryptedShard: z.string().min(1),
});

export type GuardianShardRequest = z.infer<typeof guardianShardSchema>;
