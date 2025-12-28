import { apiRequest } from "./apiClient";

export interface StaffAuthRequest {
  email: string;
  password: string;
  role: "doctor" | "paramedic" | "er_admin";
}

export interface StaffAuthResponse {
  success: boolean;
  token: string;
  staffId: string;
  role: "doctor" | "paramedic" | "er_admin";
  isNewUser: boolean;
  message: string;
}

export interface RecordAccessRequest {
  qrToken: string;
  patientId: string;
}

export interface BlobAccess {
  id: string;
  category: string;
  storagePath: string;
  iv: string;
  updatedAt: string;
  signedUrl: string | null;
  error?: string;
}

export interface RecordAccessResponse {
  success: boolean;
  patientId: string;
  staffId: string;
  staffRole: string;
  blobs: BlobAccess[];
  count: number;
  message: string;
}

/**
 * Authenticate staff member
 */
export async function staffAuth(
  data: StaffAuthRequest
): Promise<StaffAuthResponse> {
  return apiRequest<StaffAuthResponse>("/staff/auth", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Access patient records using QR token
 * Requires staff JWT token in Authorization header
 */
export async function recordAccess(
  data: RecordAccessRequest,
  staffToken: string
): Promise<RecordAccessResponse> {
  return apiRequest<RecordAccessResponse>("/record/access", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${staffToken}`,
    },
    body: JSON.stringify(data),
  });
}

