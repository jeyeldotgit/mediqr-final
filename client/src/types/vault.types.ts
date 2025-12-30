/**
 * Vault-related type definitions
 */

export type VaultCategory = "identity" | "allergies" | "medications" | "records";

export interface VaultItem {
  id: string;
  category: VaultCategory;
  updated_at: string;
  storage_path: string;
}

export interface VaultBlob {
  id: string;
  category: string;
  storagePath: string;
  iv: string;
  updatedAt: string;
  signedUrl: string | null;
  error?: string;
}

export interface SyncVaultRequest {
  ownerId: string;
  category: VaultCategory;
  encryptedData: string;
  iv: string;
}

export interface SyncVaultResponse {
  success: boolean;
  blobId: string;
  storagePath: string;
  message: string;
}

export interface GetVaultItemsResponse {
  success: boolean;
  items: VaultItem[];
  count: number;
}

export interface VaultFormData {
  identity: Record<string, string>;
  allergies: Record<string, string>;
  medications: Record<string, string>;
  records: Record<string, string>;
}

export interface CategoryConfig {
  label: string;
  fields: string[];
}

export const VAULT_CATEGORIES: Record<VaultCategory, CategoryConfig> = {
  identity: {
    label: "Identity",
    fields: ["fullName", "dateOfBirth", "bloodType", "emergencyContact"],
  },
  allergies: {
    label: "Allergies",
    fields: ["allergen", "severity", "reaction", "notes"],
  },
  medications: {
    label: "Medications",
    fields: ["medication", "dosage", "frequency", "prescribingDoctor"],
  },
  records: {
    label: "Medical Records",
    fields: ["condition", "diagnosisDate", "treatment", "notes"],
  },
};

