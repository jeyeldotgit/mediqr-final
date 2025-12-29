import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestBreakGlass } from "../services/emergencyService";
import { getStaffToken } from "../lib/storage";
import {
  AlertTriangle,
  Shield,
  ArrowLeft,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function StaffEmergency() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState("");
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!patientId.trim()) {
      setError("Patient ID is required");
      return;
    }

    if (!justification.trim() || justification.trim().length < 10) {
      setError("Justification must be at least 10 characters");
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getStaffToken();
      if (!token) {
        setError("Staff authentication required. Please log in again.");
        navigate("/staff/login");
        return;
      }

      const response = await requestBreakGlass({
        patientId: patientId.trim(),
        justification: justification.trim(),
      });

      // Store patient data for viewing
      localStorage.setItem(
        "mediqr_patient_data",
        JSON.stringify({
          patientId: response.patientId,
          blobs: response.blobs,
          fragment: "", // Not needed for break-glass
          accessMethod: "BREAK_GLASS",
          justification: response.justification,
        })
      );

      setSuccess(true);

      // Redirect to patient view after short delay
      setTimeout(() => {
        navigate(`/staff/patient-view/${response.patientId}`);
      }, 2000);
    } catch (err) {
      console.error("Break-glass error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to access patient records. Please check your permissions and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-error/10 via-base-100 to-warning/10 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-error" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-error">
                    Emergency Break-Glass Access
                  </h1>
                  <p className="text-neutral/70">
                    Emergency access to patient records (ER Admin only)
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/staff/scanner")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
            </div>

            {/* Warning Alert */}
            <div className="alert alert-warning">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Emergency Access Only</p>
                <p className="text-sm mt-1">
                  This action will be logged and may require justification review.
                  Use only in genuine emergency situations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert alert-success mb-6">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Access Granted</p>
              <p className="text-sm mt-1">
                Redirecting to patient records...
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-6">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Break-Glass Form */}
        {!success && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient ID */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Patient ID <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Enter patient UUID"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-neutral/70">
                      The UUID of the patient whose records you need to access
                    </span>
                  </label>
                </div>

                {/* Justification */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Justification <span className="text-error">*</span>
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    placeholder="Provide a detailed justification for emergency access (minimum 10 characters)..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    disabled={loading}
                    required
                    minLength={10}
                    maxLength={500}
                  />
                  <label className="label">
                    <span className="label-text-alt text-neutral/70">
                      {justification.length}/500 characters. Minimum 10 characters required.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-error w-full"
                    disabled={loading || !patientId.trim() || justification.trim().length < 10}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Request Emergency Access
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error mb-4">
                Confirm Emergency Access
              </h3>
              <div className="alert alert-warning mb-4">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-semibold">This action will be logged</p>
                  <p className="text-sm mt-1">
                    Your access request and justification will be permanently
                    recorded in the audit log.
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-neutral/70 mb-2">
                  <strong>Patient ID:</strong> {patientId}
                </p>
                <p className="text-sm text-neutral/70">
                  <strong>Justification:</strong>
                </p>
                <p className="text-sm bg-base-200 p-3 rounded mt-2">
                  {justification}
                </p>
              </div>
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Access"
                  )}
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop"
              onClick={() => setShowConfirmModal(false)}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}

