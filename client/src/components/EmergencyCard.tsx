import { useState, useEffect } from "react";
import { useCrypto } from "../contexts/CryptoProvider";
import {
  downloadOfflineVault,
  getOfflineVault,
  hasRecentOfflineVault,
  clearOfflineVault,
  getOfflineVaultSize,
} from "../services/offlineVaultService";
import {
  AlertTriangle,
  Download,
  CheckCircle,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function EmergencyCard() {
  const { isUnlocked } = useCrypto();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [offlineVault, setOfflineVault] = useState(getOfflineVault());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleDownloadOfflineVault = async () => {
    if (!isUnlocked) {
      setError("Please unlock your vault first");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const vaultData = await downloadOfflineVault();
      setOfflineVault(vaultData);
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to download offline vault:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to download vault for offline use"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOfflineVault = async () => {
    await handleDownloadOfflineVault();
  };

  const handleClearOfflineVault = () => {
    if (
      !confirm(
        "Are you sure you want to clear the offline vault? You'll need to download it again for offline access."
      )
    ) {
      return;
    }

    clearOfflineVault();
    setOfflineVault(null);
    setSuccess(false);
    setError(null);
  };

  if (!isUnlocked) {
    return null;
  }

  const hasRecentVault = hasRecentOfflineVault();
  const vaultSize = offlineVault ? getOfflineVaultSize() : 0;
  const vaultSizeKB = (vaultSize / 1024).toFixed(2);

  return (
    <div className="card bg-gradient-to-br from-warning/10 via-base-200 to-error/10 border-2 border-warning/30 shadow-xl">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="card-title text-warning">
              Emergency & Offline Mode
            </h2>
            <p className="text-sm text-neutral/70">
              Download your vault for offline access
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="badge badge-success">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </div>
            ) : (
              <div className="badge badge-warning">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </div>
            )}
          </div>
        </div>

        {/* Info Alert */}
        <div className="alert alert-info mb-4">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Offline Mode</p>
            <p className="text-xs mt-1">
              Download your encrypted vault data to access it offline. Your QR
              code will work even when the server is unavailable. Data is stored
              locally and encrypted.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle className="w-5 h-5" />
            <span>Offline vault downloaded successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Offline Vault Status */}
        {offlineVault && (
          <div className="bg-base-100 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold">
                  Offline Vault Available
                </span>
              </div>
              {hasRecentVault && (
                <span className="badge badge-success badge-sm">Recent</span>
              )}
            </div>
            <div className="text-xs text-neutral/70 space-y-1">
              <p>
                Downloaded: {new Date(offlineVault.timestamp).toLocaleString()}
              </p>
              <p>Items: {offlineVault.items.length}</p>
              <p>Size: {vaultSizeKB} KB</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!offlineVault ? (
            <button
              className="btn btn-warning flex-1"
              onClick={handleDownloadOfflineVault}
              disabled={loading || !isOnline}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Offline Vault
                </>
              )}
            </button>
          ) : (
            <>
              <button
                className="btn btn-warning flex-1"
                onClick={handleRefreshOfflineVault}
                disabled={loading || !isOnline}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Vault
                  </>
                )}
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleClearOfflineVault}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div className="mt-4 alert alert-warning">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">You're Offline</p>
              <p className="text-xs mt-1">
                {offlineVault
                  ? "Your offline vault is available. QR codes will work with local data."
                  : "No offline vault available. Please download when online."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
