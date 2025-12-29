/**
 * Base API client configuration
 */

import { getUserId } from "../lib/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Base fetch wrapper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get userId from storage and add to headers if available
  const userId = getUserId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (userId) {
    headers["x-user-id"] = userId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.details || `HTTP ${response.status}`);
  }

  return response.json();
}

export { apiRequest, API_BASE_URL };
