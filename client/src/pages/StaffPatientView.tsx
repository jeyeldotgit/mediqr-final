import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { decryptDataFromBase64 } from "../lib/crypto/aes";
import { deriveMEKFromMnemonic } from "../lib/crypto/keyDerivation";
import { CheckCircle, AlertCircle, ArrowLeft, FileText, Heart, Pill, Clipboard } from "lucide-react";

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
  const [decryptedRecords, setDecryptedRecords] = useState<DecryptedRecord[]>([]);
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
      // For Phase 3 MVP, we need to derive a key from the fragment
      // In production, this would be more sophisticated
      // For now, we'll use the fragment directly as a key derivation input
      
      // Note: This is a simplified approach for MVP
      // In production, the fragment would be combined with the backend token
      // to derive the decryption key properly
      
      const decrypted: DecryptedRecord[] = [];

      for (const blob of data.blobs) {
        if (!blob.signedUrl || blob.error) {
          continue; // Skip blobs without valid URLs
        }

        try {
          // Fetch encrypted blob
          const response = await fetch(blob.signedUrl);
          if (!response.ok) {
            console.error(`Failed to fetch blob ${blob.id}:`, response.statusText);
            continue;
          }

          const encryptedBase64 = await response.text();

          // For MVP: We'll need the patient's mnemonic or a proper key derivation
          // For now, we'll show that decryption requires the patient's key
          // In a real implementation, the fragment + token would derive the key
          
          // This is a placeholder - actual decryption would require:
          // 1. Combining fragment with token to derive key
          // 2. Using that key to decrypt the blob
          
          decrypted.push({
            id: blob.id,
            category: blob.category,
            data: {
              note: "Decryption requires proper key derivation from fragment + token",
              encrypted: encryptedBase64.substring(0, 50) + "...",
            },
            updatedAt: blob.updatedAt,
          });
        } catch (err) {
          console.error(`Failed to decrypt blob ${blob.id}:`, err);
        }
      }

      setDecryptedRecords(decrypted);
    } catch (err) {
      console.error("Decryption error:", err);
      setError("Failed to decrypt patient records");
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
            {decrypting ? "Decrypting patient records..." : "Loading patient data..."}
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
              <h1 className="text-4xl font-bold text-primary mb-2">Patient Records</h1>
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
              <h2 className="card-title text-secondary mb-4">Access Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral/70">Records Found</p>
                  <p className="text-2xl font-bold text-primary">{patientData.blobs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral/70">Access Method</p>
                  <p className={`text-lg font-semibold ${
                    patientData.accessMethod === "BREAK_GLASS" ? "text-error" : "text-secondary"
                  }`}>
                    {patientData.accessMethod === "BREAK_GLASS" ? "Break-Glass" : "QR Scan"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral/70">Access Time</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleString()}</p>
                </div>
              </div>
              {patientData.accessMethod === "BREAK_GLASS" && patientData.justification && (
                <div className="mt-4 pt-4 border-t border-base-300">
                  <p className="text-sm text-neutral/70 mb-2">Justification:</p>
                  <p className="text-sm bg-base-100 p-3 rounded">{patientData.justification}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decrypted Records */}
        {decryptedRecords.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">Medical Records</h2>
            
            {decryptedRecords.map((record) => (
              <div key={record.id} className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    {record.category === "identity" && <FileText className="w-6 h-6 text-primary" />}
                    {record.category === "allergies" && <AlertCircle className="w-6 h-6 text-error" />}
                    {record.category === "medications" && <Pill className="w-6 h-6 text-secondary" />}
                    {record.category === "records" && <Clipboard className="w-6 h-6 text-accent" />}
                    <h3 className="card-title capitalize">{record.category}</h3>
                    <div className="badge badge-ghost">
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="bg-base-100 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(record.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-12">
              <AlertCircle className="w-16 h-16 text-neutral/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Records Available</h3>
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
              Full decryption requires proper key derivation from the QR fragment + token.
              The current implementation shows the structure but needs the complete key derivation logic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

