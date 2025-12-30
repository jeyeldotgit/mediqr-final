/**
 * Hook for QR code generation logic
 */

import { useState, useEffect, useCallback } from "react";
import { useCrypto } from "../contexts/CryptoProvider";
import { rotateQRToken } from "../services/qrService";
import { getUserId } from "../lib/storage";
import { getOfflineVault } from "../services/offlineVaultService";

interface QRGeneratorState {
  qrData: string | null;
  qrToken: string | null;
  loading: boolean;
  error: string | null;
  copied: boolean;
}

export const useQRGenerator = () => {
  const { isUnlocked, masterKey } = useCrypto();
  const userId = getUserId();

  const [state, setState] = useState<QRGeneratorState>({
    qrData: null,
    qrToken: null,
    loading: false,
    error: null,
    copied: false,
  });

  const generateLocalFragment = useCallback(async (): Promise<string> => {
    if (!masterKey || !userId) {
      throw new Error("Master key or user ID not available");
    }

    const plaintext = new TextEncoder().encode(`mediqr-fragment-${userId}`);
    const ivInput = new TextEncoder().encode(`mediqr-iv-${userId}`);
    const ivHash = await crypto.subtle.digest("SHA-256", ivInput);
    const fixedIV = new Uint8Array(ivHash.slice(0, 12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: fixedIV, tagLength: 128 },
      masterKey,
      plaintext
    );

    const fragmentBytes = new Uint8Array(ciphertext.slice(0, 16));
    return Array.from(fragmentBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }, [masterKey, userId]);

  const generateQR = useCallback(async () => {
    if (!userId || !isUnlocked) {
      setState((prev) => ({
        ...prev,
        error: "Please unlock your vault first",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let backendToken: string;
      let isOfflineMode = false;

      try {
        const tokenResponse = await rotateQRToken(userId);
        backendToken = tokenResponse.qrToken;
      } catch {
        const offlineVault = getOfflineVault();
        if (offlineVault && offlineVault.userId === userId) {
          backendToken = "OFFLINE_MODE";
          isOfflineMode = true;
        } else {
          throw new Error(
            "Backend unavailable and no offline vault found. Please download offline vault when online."
          );
        }
      }

      const localFragment = await generateLocalFragment();

      const qrPayload = {
        token: backendToken,
        fragment: localFragment,
        userId: userId,
        timestamp: Date.now(),
        offline: isOfflineMode,
      };

      setState((prev) => ({
        ...prev,
        qrData: JSON.stringify(qrPayload),
        qrToken: backendToken,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error ? err.message : "Failed to generate QR code",
        loading: false,
      }));
    }
  }, [userId, isUnlocked, generateLocalFragment]);

  const copyToClipboard = useCallback(async () => {
    if (!state.qrData) return;

    try {
      await navigator.clipboard.writeText(state.qrData);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(
        () => setState((prev) => ({ ...prev, copied: false })),
        2000
      );
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [state.qrData]);

  // Auto-generate on mount if unlocked
  useEffect(() => {
    if (isUnlocked && userId && !state.qrData) {
      generateQR();
    }
  }, [isUnlocked, userId, state.qrData, generateQR]);

  return {
    ...state,
    isUnlocked,
    generateQR,
    copyToClipboard,
  };
};

