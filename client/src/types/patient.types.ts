/**
 * Patient-related type definitions
 */

import type { VaultBlob } from "./vault.types";

export type AccessMethod = "QR_SCAN" | "BREAK_GLASS";

export interface PatientData {
  patientId: string;
  blobs: VaultBlob[];
  fragment: string;
  token?: string;
  accessMethod?: AccessMethod;
  justification?: string;
}

export interface DecryptedRecord {
  id: string;
  category: string;
  data: Record<string, unknown> | { error: string; message?: string };
  updatedAt: string;
}

export interface PatientViewState {
  patientData: PatientData | null;
  decryptedRecords: DecryptedRecord[];
  loading: boolean;
  decrypting: boolean;
  error: string | null;
}

