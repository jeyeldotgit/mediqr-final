import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decryptDataFromBase64 } from "../lib/crypto/aes";
import { deriveSessionKeyFromFragment } from "../lib/crypto/sessionKey";
import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Pill,
  Clipboard,
} from "lucide-react";

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatLabel(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

interface PatientData {
  patientId: string;
  blobs: Array<{
    id: string;
    category: string;
    storagePath: string;
    iv: string;
    updatedAt: string;
    signedUrl: string | null;
    error?: string;
  }>;
  fragment: string;
  token?: string; // QR token from backend
  accessMethod?: "QR_SCAN" | "BREAK_GLASS";
  justification?: string;
}

interface DecryptedRecord {
  id: string;
  category: string;
  data: any;
  updatedAt: string;
}

export default function StaffPatientView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [decryptedRecords, setDecryptedRecords] = useState<DecryptedRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    // Get patient data from localStorage
    const stored = localStorage.getItem("mediqr_patient_data");
    if (!stored) {
      setError("No patient data found. Please scan QR code again.");
      setLoading(false);
      return;
    }

    try {
      const data: PatientData = JSON.parse(stored);
      if (data.patientId !== id) {
        setError("Patient ID mismatch");
        setLoading(false);
        return;
      }
      setPatientData(data);
      loadAndDecryptRecords(data);
    } catch (err) {
      console.error("Failed to parse patient data:", err);
      setError("Invalid patient data");
      setLoading(false);
    }
  }, [id]);

  const loadAndDecryptRecords = async (data: PatientData) => {
    if (!data.blobs || data.blobs.length === 0) {
      setLoading(false);
      return;
    }

    setDecrypting(true);
    setError(null);

    try {
      // Check if we have the required data for decryption
      if (!data.fragment) {
        throw new Error("QR fragment missing. Cannot decrypt records.");
      }

      // For QR_SCAN access, we need the token to derive the key
      // For BREAK_GLASS, we might not have the token (emergency access)
      // In that case, we'll need to handle it differently
      if (data.accessMethod === "QR_SCAN" && !data.token) {
        throw new Error("QR token missing. Cannot decrypt records.");
      }

      // Derive decryption key from fragment and token
      let decryptionKey: CryptoKey;

      if (data.accessMethod === "BREAK_GLASS") {
        // For break-glass access, we might not have the QR token
        // In this case, we'll use a simplified key derivation
        // Note: This is a limitation - break-glass access may not be able to decrypt
        // unless we have a way to derive the key without the token
        throw new Error(
          "Break-glass access cannot decrypt records without the QR token. " +
            "This is a security limitation - emergency access provides blob URLs but decryption requires the QR token."
        );
      } else {
        // Derive session key from fragment
        // We use a deterministic token derived from the fragment itself
        // This matches the encryption side which also uses a deterministic token
        const fragmentBytes = new Uint8Array(
          data.fragment.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
        );

        // Derive deterministic token from fragment (same as encryption side)
        const tokenMaterial = await crypto.subtle.digest(
          "SHA-256",
          fragmentBytes
        );
        const tokenBytes = new Uint8Array(tokenMaterial.slice(0, 32));
        const deterministicToken = Array.from(tokenBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        console.log(
          "Deriving session key from fragment with deterministic token"
        );
        decryptionKey = await deriveSessionKeyFromFragment(
          data.fragment,
          deterministicToken,
          data.patientId
        );
        console.log("Session key derived successfully");
      }

      const decrypted: DecryptedRecord[] = [];

      for (const blob of data.blobs) {
        if (!blob.signedUrl || blob.error) {
          continue; // Skip blobs without valid URLs
        }

        try {
          // Fetch encrypted blob
          const response = await fetch(blob.signedUrl);
          if (!response.ok) {
            console.error(
              `Failed to fetch blob ${blob.id}:`,
              response.statusText
            );
            continue;
          }

          // Get encrypted data as ArrayBuffer (binary)
          // The blob is stored as binary (application/octet-stream) in Supabase Storage
          const encryptedArrayBuffer = await response.arrayBuffer();

          // Convert ArrayBuffer to base64 for decryption
          // The data was originally base64, then converted to Buffer for storage
          // Now we need to convert it back to base64
          const encryptedBase64 = arrayBufferToBase64(encryptedArrayBuffer);

          // Validate IV format before attempting decryption
          if (!blob.iv || blob.iv.trim().length === 0) {
            throw new Error("IV is missing or empty");
          }

          // Attempt to decrypt the blob using the derived key
          // Note: This may fail if data was encrypted with master key directly
          // In that case, we'll catch the error and show it
          let decryptedData: string;
          try {
            decryptedData = await decryptDataFromBase64(
              decryptionKey,
              encryptedBase64,
              blob.iv
            );
          } catch (decryptError) {
            // If decryption fails, it's likely because the key doesn't match
            // This happens when data is encrypted with master key but we're using derived key
            throw new Error(
              `Decryption failed: The data appears to be encrypted with a different key. ` +
                `This is expected with the current architecture - data is encrypted with the master key, ` +
                `but staff cannot derive the master key from the QR fragment. ` +
                `To enable staff decryption, the encryption scheme needs to use session keys. ` +
                `Error: ${
                  decryptError instanceof Error
                    ? decryptError.message
                    : "Unknown error"
                }`
            );
          }

          // Parse the decrypted JSON data
          let parsedData: any;
          try {
            parsedData = JSON.parse(decryptedData);
          } catch (parseError) {
            // If parsing fails, use the raw decrypted string
            parsedData = { raw: decryptedData };
          }

          decrypted.push({
            id: blob.id,
            category: blob.category,
            data: parsedData,
            updatedAt: blob.updatedAt,
          });
        } catch (err) {
          console.error(`Failed to decrypt blob ${blob.id}:`, err);
          // Add a record indicating decryption failure
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

      setDecryptedRecords(decrypted);
    } catch (err) {
      console.error("Decryption error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to decrypt patient records"
      );
    } finally {
      setLoading(false);
      setDecrypting(false);
    }
  };

  if (loading || decrypting) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-neutral/70">
            {decrypting
              ? "Decrypting patient records..."
              : "Loading patient data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/staff/scanner")}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Scanner
            </button>
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">
                Patient Records
              </h1>
              <p className="text-neutral/70">Patient ID: {id}</p>
            </div>
          </div>
          {patientData?.accessMethod === "BREAK_GLASS" ? (
            <div className="badge badge-error badge-lg">
              <AlertCircle className="w-4 h-4 mr-1" />
              Break-Glass Access
            </div>
          ) : (
            <div className="badge badge-success badge-lg">
              <CheckCircle className="w-4 h-4 mr-1" />
              QR Access
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Access Info */}
        {patientData && (
          <div className="card bg-base-200 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-secondary mb-4">
                Access Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral/70">Records Found</p>
                  <p className="text-2xl font-bold text-primary">
                    {patientData.blobs.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral/70">Access Method</p>
                  <p
                    className={`text-lg font-semibold ${
                      patientData.accessMethod === "BREAK_GLASS"
                        ? "text-error"
                        : "text-secondary"
                    }`}
                  >
                    {patientData.accessMethod === "BREAK_GLASS"
                      ? "Break-Glass"
                      : "QR Scan"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral/70">Access Time</p>
                  <p className="text-lg font-semibold">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              {patientData.accessMethod === "BREAK_GLASS" &&
                patientData.justification && (
                  <div className="mt-4 pt-4 border-t border-base-300">
                    <p className="text-sm text-neutral/70 mb-2">
                      Justification:
                    </p>
                    <p className="text-sm bg-base-100 p-3 rounded">
                      {patientData.justification}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Decrypted Records */}
        {decryptedRecords.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Medical Records
            </h2>

            {decryptedRecords.map((record) => (
              <div key={record.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    {record.category === "identity" && (
                      <FileText className="w-6 h-6 text-primary" />
                    )}
                    {record.category === "allergies" && (
                      <AlertCircle className="w-6 h-6 text-error" />
                    )}
                    {record.category === "medications" && (
                      <Pill className="w-6 h-6 text-secondary" />
                    )}
                    {record.category === "records" && (
                      <Clipboard className="w-6 h-6 text-accent" />
                    )}
                    <h3 className="card-title capitalize">{record.category}</h3>
                    <div className="badge badge-ghost">
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="bg-base-100 p-4 rounded-lg">
                    {record.data && typeof record.data === "object" ? (
                      "error" in record.data ? (
                        <div className="alert alert-error">
                          <AlertCircle className="w-4 h-4" />
                          <div>
                            <p className="font-semibold text-sm">
                              {(record.data as any).error}
                            </p>
                            {(record.data as any).message && (
                              <p className="text-xs mt-1">
                                {(record.data as any).message}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(
                            record.data as Record<string, any>
                          ).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-xs font-semibold text-neutral/60">
                                {formatLabel(key)}
                              </dt>
                              <dd className="mt-1 text-sm">
                                {value && typeof value === "object" ? (
                                  <pre className="whitespace-pre-wrap text-xs">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  String(value ?? "")
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap">
                        {String(record.data ?? "")}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-12">
              <AlertCircle className="w-16 h-16 text-neutral/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Records Available
              </h3>
              <p className="text-neutral/70">
                {patientData?.blobs.length === 0
                  ? "This patient has no medical records stored."
                  : "Failed to decrypt patient records. This may require proper key derivation implementation."}
              </p>
            </div>
          </div>
        )}

        {/* Implementation Note */}
        <div className="mt-6 alert alert-info">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Phase 3 MVP Note</p>
            <p className="text-xs mt-1">
              Full decryption requires proper key derivation from the QR
              fragment + token. The current implementation shows the structure
              but needs the complete key derivation logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
