/**
 * Zod schemas for Onboarding
 */

import { z } from "zod";

export const mnemonicSchema = z.object({
  phrase: z
    .string()
    .min(1, "Recovery phrase is required")
    .refine(
      (val) => val.split(" ").length === 12,
      "Recovery phrase must be exactly 12 words"
    ),
});

export type MnemonicFormData = z.infer<typeof mnemonicSchema>;

