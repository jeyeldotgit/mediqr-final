/**
 * Authentication service
 * Handles user profile initialization and authentication
 */

import { apiRequest } from "./apiClient";

export interface InitProfileRequest {
  publicKey: string;
  hashedIdentifier: string;
}

export interface InitProfileResponse {
  success: boolean;
  userId: string;
  message: string;
}

/**
 * Initialize user profile after onboarding
 */
export async function initProfile(
  publicKey: string,
  hashedIdentifier: string
): Promise<InitProfileResponse> {
  return apiRequest<InitProfileResponse>("/auth/init", {
    method: "POST",
    body: JSON.stringify({
      publicKey,
      hashedIdentifier,
    }),
  });
}

