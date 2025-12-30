/**
 * Access Info Card Component
 * Displays access information for staff viewing patient records
 */

import type { PatientData } from "../../types";

interface AccessInfoCardProps {
  patientData: PatientData;
}

export const AccessInfoCard = ({ patientData }: AccessInfoCardProps) => {
  return (
    <div className="card bg-base-200 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-secondary mb-4">Access Information</h2>
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
              <p className="text-sm text-neutral/70 mb-2">Justification:</p>
              <p className="text-sm bg-base-100 p-3 rounded">
                {patientData.justification}
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

