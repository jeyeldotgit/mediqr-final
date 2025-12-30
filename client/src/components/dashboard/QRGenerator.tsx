/**
 * QRGenerator Component
 * Uses hook for all logic - component is pure presentation
 */

import { QrCode, RefreshCw, Copy, Check, AlertTriangle } from "lucide-react";
import { useQRGenerator } from "../../hooks";
import { EducationModal, useEducationModal } from "../shared/EducationModal";

export const QRGenerator = () => {
  const { topic, isOpen, closeModal } = useEducationModal();
  const {
    qrData,
    qrToken,
    loading,
    error,
    copied,
    isUnlocked,
    generateQR,
    copyToClipboard,
  } = useQRGenerator();

  if (!isUnlocked) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <p className="text-neutral/70">
            Please unlock your vault to generate QR code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-secondary mb-4">Your MediQR Code</h2>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 text-secondary animate-spin" />
            <span className="ml-2">Generating QR code...</span>
          </div>
        )}

        {qrData && !loading && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-base-100 rounded-lg">
              <div className="w-64 h-64 flex items-center justify-center border-2 border-secondary/20 rounded-lg">
                <div className="text-center">
                  <QrCode className="w-32 h-32 text-secondary/50 mx-auto mb-2" />
                  <p className="text-xs text-neutral/70">
                    QR Code Library Required
                  </p>
                  <p className="text-xs text-neutral/70 mt-1">
                    Install: npm install qrcode.react
                  </p>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-100">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                QR Payload (for testing)
              </div>
              <div className="collapse-content">
                <pre className="text-xs bg-base-200 p-2 rounded overflow-auto max-h-32">
                  {qrData}
                </pre>
                <button
                  className="btn btn-sm btn-ghost mt-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {qrToken && (
              <div className="text-xs text-neutral/70">
                <p>Token expires in: 1 hour</p>
                <p>Last generated: {new Date().toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        )}

        {!qrData && !loading && (
          <div className="text-center py-8">
            <QrCode className="w-16 h-16 text-secondary/50 mx-auto mb-4" />
            <p className="text-neutral/70 mb-4">Generate your MediQR code</p>
            <button className="btn btn-secondary" onClick={generateQR}>
              Generate QR Code
            </button>
          </div>
        )}

        {qrData && (
          <div className="card-actions justify-end mt-4">
            <button
              className="btn btn-sm btn-ghost"
              onClick={generateQR}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </button>
          </div>
        )}
      </div>

      <EducationModal topic={topic} isOpen={isOpen} onClose={closeModal} />
    </div>
  );
};

export default QRGenerator;

