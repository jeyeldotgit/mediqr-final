import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { isOnboarded } from "../lib/storage";
import {
  Shield,
  Key,
  Settings as SettingsIcon,
  ArrowLeft,
  Lock,
  Database,
} from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { isUnlocked } = useCrypto();
  const onboarded = isOnboarded();

  // Redirect if not onboarded or not unlocked
  useEffect(() => {
    if (!onboarded) {
      navigate("/onboarding");
    } else if (!isUnlocked) {
      navigate("/restore");
    }
  }, [onboarded, isUnlocked, navigate]);

  // Don't render if not ready
  if (!onboarded || !isUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary">Settings</h1>
                  <p className="text-neutral/70">
                    Manage your account and security preferences
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Management */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="card-title text-primary">Guardians</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                Manage your social recovery guardians. Add trusted contacts who
                can help you recover your account.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => navigate("/settings/guardians")}
                >
                  Manage Guardians
                  <Shield className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Recovery Options */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Key className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="card-title text-secondary">Recovery</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                View your recovery options. Your mnemonic phrase and shard
                recovery settings.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => navigate("/settings/recovery")}
                >
                  Recovery Options
                  <Key className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <h2 className="card-title text-accent">Security</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                Security settings and encryption status. Your data is encrypted
                client-side.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-accent w-full"
                  onClick={() => {
                    alert("Security settings coming soon!");
                  }}
                  disabled
                >
                  Security Settings
                  <Lock className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center group-hover:bg-info/20 transition-colors">
                  <Database className="w-5 h-5 text-info" />
                </div>
                <h2 className="card-title text-info">Data</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                Manage your vault data and storage. View and manage your medical
                records.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-info w-full"
                  onClick={() => navigate("/vault")}
                >
                  Manage Vault
                  <Database className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 card bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Zero-Knowledge Architecture
                </h3>
                <p className="text-sm text-neutral/80">
                  Your master encryption key is never stored on our servers. All
                  data is encrypted client-side before transmission. Only you
                  have access to your decryption keys.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
