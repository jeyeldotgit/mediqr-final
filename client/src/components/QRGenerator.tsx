import { useState, useEffect } from "react";
import { useCrypto } from "../contexts/CryptoProvider";
import { rotateQRToken } from "../services/qrService";
import { getUserId } from "../lib/storage";
import { QrCode, RefreshCw, Copy, Check } from "lucide-react";

/**
 * QRGenerator Component
 * 
 * Generates a QR code containing:
 * - Backend token (from /qr/rotate endpoint)
 * - Local fragment (derived from master key, never sent to server)
 * 
 * The QR code payload is a JSON object that staff scanners can decode
 */
export default function QRGenerator() {
  const { isUnlocked, masterKey } = useCrypto();
  const userId = getUserId();
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate a local fragment from the master key
  // This fragment is combined with the backend token to derive the decryption key
  // Since the master key is not extractable, we derive the fragment by encrypting
  // a known value with the master key and using part of the ciphertext
  const generateLocalFragment = async (): Promise<string> => {
    if (!masterKey || !userId) {
      throw new Error("Master key or user ID not available");
    }

    // Derive fragment by encrypting a known plaintext with the master key
    // Use a fixed IV to ensure determinism (same input = same fragment)
    // The fragment is derived from the ciphertext, making it unique per user/key
    const plaintext = new TextEncoder().encode(`mediqr-fragment-${userId}`);
    
    // Create a deterministic 12-byte IV from user ID
    // Hash the user ID and use first 12 bytes as IV
    const ivInput = new TextEncoder().encode(`mediqr-iv-${userId}`);
    const ivHash = await crypto.subtle.digest("SHA-256", ivInput);
    const fixedIV = new Uint8Array(ivHash.slice(0, 12)); // Use first 12 bytes

    try {
      // Encrypt the plaintext using the master key
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: fixedIV,
          tagLength: 128,
        },
        masterKey,
        plaintext
      );

      // Use the first 16 bytes of ciphertext as the fragment
      // Convert to hex string for easy transmission
      const fragmentBytes = new Uint8Array(ciphertext.slice(0, 16));
      const fragmentHex = Array.from(fragmentBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      return fragmentHex;
    } catch (error) {
      console.error("Failed to generate fragment:", error);
      throw new Error("Failed to derive fragment from master key");
    }
  };

  const generateQR = async () => {
    if (!userId || !isUnlocked) {
      setError("Please unlock your vault first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get backend token
      const tokenResponse = await rotateQRToken(userId);
      const backendToken = tokenResponse.qrToken;
      setQrToken(backendToken);

      // Generate local fragment
      const localFragment = await generateLocalFragment();

      // Create QR payload
      const qrPayload = {
        token: backendToken,
        fragment: localFragment,
        userId: userId,
        timestamp: Date.now(),
      };

      // Encode as JSON string for QR code
      const qrDataString = JSON.stringify(qrPayload);
      setQrData(qrDataString);
    } catch (err) {
      console.error("Failed to generate QR:", err);
      setError(err instanceof Error ? err.message : "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!qrData) return;

    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Auto-generate QR on mount if unlocked
  useEffect(() => {
    if (isUnlocked && userId && !qrData) {
      generateQR();
    }
  }, [isUnlocked, userId]);

  if (!isUnlocked) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <p className="text-neutral/70">Please unlock your vault to generate QR code</p>
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
            {/* QR Code Display */}
            <div className="flex justify-center p-4 bg-base-100 rounded-lg">
              <div className="w-64 h-64 flex items-center justify-center border-2 border-secondary/20 rounded-lg">
                {/* QR Code will be rendered here */}
                {/* For now, we'll use a placeholder - install qrcode.react for actual QR */}
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

            {/* QR Data (for debugging - remove in production) */}
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

            {/* Token Info */}
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
            <button
              className="btn btn-secondary"
              onClick={generateQR}
            >
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
    </div>
  );
}

