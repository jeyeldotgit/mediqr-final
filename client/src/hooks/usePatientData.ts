/**
 * Hook for patient data loading and decryption
 * Extracts all crypto/data logic from StaffPatientView
 */

import { useState, useEffect, useCallback } from "react";
import { decryptDataFromBase64 } from "../lib/crypto/aes";
import { deriveSessionKeyFromFragment } from "../lib/crypto/sessionKey";
import type {
  PatientData,
  DecryptedRecord,
  PatientViewState,
} from "../types/patient.types";

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const formatLabel = (field: string): string => {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

interface UsePatientDataOptions {
  patientId: string | undefined;
}

export const usePatientData = ({ patientId }: UsePatientDataOptions) => {
  const [state, setState] = useState<PatientViewState>({
    patientData: null,
    decryptedRecords: [],
    loading: true,
    decrypting: false,
    error: null,
  });

  const loadAndDecryptRecords = useCallback(
    async (data: PatientData) => {
      if (!data.blobs || data.blobs.length === 0) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      setState((prev) => ({ ...prev, decrypting: true, error: null }));

      try {
        if (!data.fragment) {
          throw new Error("QR fragment missing. Cannot decrypt records.");
        }

        if (data.accessMethod === "QR_SCAN" && !data.token) {
          throw new Error("QR token missing. Cannot decrypt records.");
        }

        if (data.accessMethod === "BREAK_GLASS") {
          throw new Error(
            "Break-glass access cannot decrypt records without the QR token. " +
              "This is a security limitation - emergency access provides blob URLs but decryption requires the QR token."
          );
        }

        // Derive session key from fragment
        const fragmentBytes = new Uint8Array(
          data.fragment.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );

        const tokenMaterial = await crypto.subtle.digest(
          "SHA-256",
          fragmentBytes
        );
        const tokenBytes = new Uint8Array(tokenMaterial.slice(0, 32));
        const deterministicToken = Array.from(tokenBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const decryptionKey = await deriveSessionKeyFromFragment(
          data.fragment,
          deterministicToken,
          data.patientId
        );

        const decrypted: DecryptedRecord[] = [];

        for (const blob of data.blobs) {
          if (!blob.signedUrl || blob.error) continue;

          try {
            const response = await fetch(blob.signedUrl);
            if (!response.ok) continue;

            const encryptedArrayBuffer = await response.arrayBuffer();
            const encryptedBase64 = arrayBufferToBase64(encryptedArrayBuffer);

            if (!blob.iv || blob.iv.trim().length === 0) {
              throw new Error("IV is missing or empty");
            }

            const decryptedData = await decryptDataFromBase64(
              decryptionKey,
              encryptedBase64,
              blob.iv
            );

            let parsedData: Record<string, unknown>;
            try {
              parsedData = JSON.parse(decryptedData);
            } catch {
              parsedData = { raw: decryptedData };
            }

            decrypted.push({
              id: blob.id,
              category: blob.category,
              data: parsedData,
              updatedAt: blob.updatedAt,
            });
          } catch (err) {
            decrypted.push({
              id: blob.id,
              category: blob.category,
              data: {
                error: "Decryption failed",
                message: err instanceof Error ? err.message : "Unknown error",
              },
              updatedAt: blob.updatedAt,
            });
          }
        }

        setState((prev) => ({
          ...prev,
          decryptedRecords: decrypted,
          loading: false,
          decrypting: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error:
            err instanceof Error
              ? err.message
              : "Failed to decrypt patient records",
          loading: false,
          decrypting: false,
        }));
      }
    },
    []
  );

  useEffect(() => {
    const stored = localStorage.getItem("mediqr_patient_data");
    if (!stored) {
      setState((prev) => ({
        ...prev,
        error: "No patient data found. Please scan QR code again.",
        loading: false,
      }));
      return;
    }

    try {
      const data: PatientData = JSON.parse(stored);
      if (data.patientId !== patientId) {
        setState((prev) => ({
          ...prev,
          error: "Patient ID mismatch",
          loading: false,
        }));
        return;
      }
      setState((prev) => ({ ...prev, patientData: data }));
      loadAndDecryptRecords(data);
    } catch {
      setState((prev) => ({
        ...prev,
        error: "Invalid patient data",
        loading: false,
      }));
    }
  }, [patientId, loadAndDecryptRecords]);

  return state;
};

