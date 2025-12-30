/**
 * Zod schemas for Vault forms
 * Single source of truth for form validation
 */

import { z } from "zod";

export const identitySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  bloodType: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const allergiesSchema = z.object({
  allergen: z.string().min(1, "Allergen is required"),
  severity: z.enum(["mild", "moderate", "severe"]).optional(),
  reaction: z.string().optional(),
  notes: z.string().optional(),
});

export const medicationsSchema = z.object({
  medication: z.string().min(1, "Medication name is required"),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  prescribingDoctor: z.string().optional(),
});

export const recordsSchema = z.object({
  condition: z.string().min(1, "Condition is required"),
  diagnosisDate: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export const vaultCategorySchemas = {
  identity: identitySchema,
  allergies: allergiesSchema,
  medications: medicationsSchema,
  records: recordsSchema,
} as const;

export type IdentityFormData = z.infer<typeof identitySchema>;
export type AllergiesFormData = z.infer<typeof allergiesSchema>;
export type MedicationsFormData = z.infer<typeof medicationsSchema>;
export type RecordsFormData = z.infer<typeof recordsSchema>;

