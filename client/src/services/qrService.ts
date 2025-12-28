import { apiRequest } from "./apiClient";

export interface QRRotateResponse {
  success: boolean;
  qrToken: string;
  expiresIn: string;
  message: string;
}

export interface QRRotateRequest {
  ownerId: string;
}

/**
 * Rotate QR token - get a new short-lived access token for QR code generation
 */
export async function rotateQRToken(
  ownerId: string
): Promise<QRRotateResponse> {
  return apiRequest<QRRotateResponse>("/qr/rotate", {
    method: "POST",
    body: JSON.stringify({ ownerId }),
  });
}

