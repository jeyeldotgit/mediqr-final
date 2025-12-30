/**
 * Staff Scanner Page
 * Converted to arrow syntax
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recordAccess } from "../services/staffService";
import { QrCode, Camera, AlertCircle, Shield } from "lucide-react";

const StaffScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const staffToken = localStorage.getItem("mediqr_staff_token");
  const staffRole = localStorage.getItem("mediqr_staff_role");

  useEffect(() => {
    if (!staffToken) {
      navigate("/staff/login");
      return;
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [staffToken, navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScanning(true);
        setError(null);
      }
    } catch {
      setError("Failed to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const payload = JSON.parse(qrData);
      const { token, fragment, userId } = payload;

      if (!token || !fragment || !userId) {
        throw new Error("Invalid QR code format");
      }

      setLoading(true);
      setError(null);

      const response = await recordAccess(
        { qrToken: token, patientId: userId },
        staffToken!
      );

      localStorage.setItem(
        "mediqr_patient_data",
        JSON.stringify({
          patientId: userId,
          blobs: response.blobs,
          fragment,
          token,
          accessMethod: "QR_SCAN",
        })
      );

      navigate(`/staff/patient-view/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process QR code");
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    const qrData = prompt("Enter QR code data:");
    if (qrData) handleQRScan(qrData);
  };

  const handleLogout = () => {
    localStorage.removeItem("mediqr_staff_token");
    localStorage.removeItem("mediqr_staff_id");
    localStorage.removeItem("mediqr_staff_role");
    navigate("/staff/login");
  };

  if (!staffToken) return null;

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">QR Scanner</h1>
            <p className="text-neutral/70">
              Scan patient MediQR code to access records
            </p>
            <p className="text-sm text-neutral/60 mt-1">
              Role: <span className="font-semibold capitalize">{staffRole}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {staffRole === "er_admin" && (
              <button
                className="btn btn-error"
                onClick={() => navigate("/staff/emergency")}
              >
                <Shield className="w-4 h-4 mr-2" />
                Emergency Access
              </button>
            )}
            <button className="btn btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Scanner Section */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title text-secondary mb-4">
              <QrCode className="w-6 h-6" />
              Patient QR Code Scanner
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-lg" />
                <span className="ml-4">Processing QR code...</span>
              </div>
            )}

            {!scanning && !loading && (
              <div className="text-center py-8">
                <div className="w-32 h-32 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-16 h-16 text-secondary/50" />
                </div>
                <p className="text-neutral/70 mb-6">
                  Start camera to scan patient QR code
                </p>
                <div className="flex gap-4 justify-center">
                  <button className="btn btn-secondary" onClick={startCamera}>
                    <Camera className="w-5 h-5 mr-2" />
                    Start Camera
                  </button>
                  <button className="btn btn-ghost" onClick={handleManualInput}>
                    Manual Input
                  </button>
                </div>
              </div>
            )}

            {scanning && !loading && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-auto"
                    style={{ maxHeight: "400px" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-secondary border-dashed w-64 h-64 rounded-lg" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral/70 mb-4">
                    Position QR code within the frame
                  </p>
                  <button className="btn btn-ghost" onClick={stopCamera}>
                    Stop Camera
                  </button>
                </div>
                <div className="alert alert-info">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-semibold">
                      QR Scanner Library Required
                    </p>
                    <p className="text-xs mt-1">
                      For now, use "Manual Input" button to test
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <div className="card-body">
            <h3 className="font-semibold text-primary mb-2">How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral/80">
              <li>Click "Start Camera" to activate your device camera</li>
              <li>Position the patient's MediQR code within the scanning frame</li>
              <li>The QR code will be automatically scanned and processed</li>
              <li>You'll be redirected to view the patient's encrypted records</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScanner;
