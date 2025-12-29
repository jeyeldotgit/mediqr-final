import { z } from "zod";

/**
 * Schema for break-glass emergency access
 */
export const breakGlassSchema = z.object({
  patientId: z.string().uuid("Patient ID must be a valid UUID"),
  justification: z
    .string()
    .min(10, "Justification must be at least 10 characters")
    .max(500, "Justification must not exceed 500 characters")
    .describe("Required justification for emergency access"),
});

export type BreakGlassRequest = z.infer<typeof breakGlassSchema>;

