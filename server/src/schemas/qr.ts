import { z } from "zod";

/**
 * Schema for QR token rotation request
 */
export const qrRotateSchema = z.object({
  ownerId: z.string().uuid("Owner ID must be a valid UUID"),
});

export type QRRotateRequest = z.infer<typeof qrRotateSchema>;

/**
 * Schema for staff authentication request
 */
export const staffAuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["doctor", "paramedic", "er_admin"], {
    errorMap: () => ({
      message: "Role must be doctor, paramedic, or er_admin",
    }),
  }),
});

export type StaffAuthRequest = z.infer<typeof staffAuthSchema>;

/**
 * Schema for record access request
 */
export const recordAccessSchema = z.object({
  qrToken: z.string().min(1, "QR token is required"),
  patientId: z.string().uuid("Patient ID must be a valid UUID"),
});

export type RecordAccessRequest = z.infer<typeof recordAccessSchema>;
