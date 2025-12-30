/**
 * Patient Record Card Component
 * Displays a single decrypted patient record
 */

import { AlertCircle, FileText, Pill, Clipboard } from "lucide-react";
import { formatLabel } from "../../hooks/usePatientData";
import type { DecryptedRecord } from "../../types";

interface PatientRecordCardProps {
  record: DecryptedRecord;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case "identity":
      return <FileText className="w-6 h-6 text-primary" />;
    case "allergies":
      return <AlertCircle className="w-6 h-6 text-error" />;
    case "medications":
      return <Pill className="w-6 h-6 text-secondary" />;
    case "records":
      return <Clipboard className="w-6 h-6 text-accent" />;
    default:
      return <FileText className="w-6 h-6 text-primary" />;
  }
};

const isErrorData = (
  data: Record<string, unknown> | { error: string; message?: string }
): data is { error: string; message?: string } => {
  return "error" in data;
};

export const PatientRecordCard = ({ record }: PatientRecordCardProps) => {
  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <CategoryIcon category={record.category} />
          <h3 className="card-title capitalize">{record.category}</h3>
          <div className="badge badge-ghost">
            {new Date(record.updatedAt).toLocaleDateString()}
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-lg">
          {isErrorData(record.data) ? (
            <div className="alert alert-error">
              <AlertCircle className="w-4 h-4" />
              <div>
                <p className="font-semibold text-sm">{record.data.error}</p>
                {record.data.message && (
                  <p className="text-xs mt-1">{record.data.message}</p>
                )}
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(record.data).map(([key, value]) => (
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
          )}
        </div>
      </div>
    </div>
  );
};

