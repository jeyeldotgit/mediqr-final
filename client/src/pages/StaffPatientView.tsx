/**
 * Staff Patient View Page
 * Layout and composition only - logic extracted to hooks
 */

import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { usePatientData } from "../hooks";
import {
  PatientRecordCard,
  AccessInfoCard,
} from "../components/staff-patient-view";

const StaffPatientView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patientData, decryptedRecords, loading, decrypting, error } =
    usePatientData({ patientId: id });

  if (loading || decrypting) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg" />
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
        {patientData && <AccessInfoCard patientData={patientData} />}

        {/* Decrypted Records */}
        {decryptedRecords.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary mb-4">
              Medical Records
            </h2>
            {decryptedRecords.map((record) => (
              <PatientRecordCard key={record.id} record={record} />
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
                  : "Failed to decrypt patient records."}
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
              fragment + token.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPatientView;
