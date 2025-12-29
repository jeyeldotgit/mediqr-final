/**
 * Emergency service for break-glass access
 */

import { getStaffToken } from "../lib/storage";
import { API_BASE_URL } from "./apiClient";

export interface BreakGlassRequest {
  patientId: string;
  justification: string;
}

export interface BreakGlassResponse {
  success: boolean;
  patientId: string;
  staffId: string;
  staffRole: string;
  blobs: Array<{
    id: string;
    category: string;
    storagePath: string;
    iv: string;
    updatedAt: string;
    signedUrl: string | null;
    error?: string;
  }>;
  count: number;
  method: "BREAK_GLASS";
  justification: string;
  message: string;
}

/**
 * Request emergency break-glass access to patient records
 * POST /emergency/break-glass
 * 
 * Requires er_admin role
 */
export async function requestBreakGlass(
  request: BreakGlassRequest
): Promise<BreakGlassResponse> {
  const token = getStaffToken();
  if (!token) {
    throw new Error("Staff authentication required. Please log in again.");
  }

  const url = `${API_BASE_URL}/emergency/break-glass`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.details || `HTTP ${response.status}`);
  }

  return response.json();
}

