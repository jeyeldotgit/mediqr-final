import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { validateMnemonicPhrase } from "../lib/crypto/mnemonic";
import { isOnboarded } from "../lib/storage";
import {
  collectShardsForRecovery,
  reconstructFromShards,
} from "../lib/crypto/shardDistribution";
import {
  Key,
  ArrowRight,
  AlertCircle,
  Lock,
  Shield,
  Loader,
} from "lucide-react";

type RecoveryMethod = "mnemonic" | "shards";

export default function Restore() {
  const navigate = useNavigate();
  const { unlock, unlockWithKey } = useCrypto();
  const [recoveryMethod, setRecoveryMethod] =
    useState<RecoveryMethod>("mnemonic");
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shardRecoveryStatus, setShardRecoveryStatus] = useState<{
    local: boolean;
    guardian: boolean;
    backup: boolean;
  }>({ local: false, guardian: false, backup: false });

  // Redirect if not onboarded (should go to onboarding instead)
  if (!isOnboarded()) {
    navigate("/onboarding");
    return null;
  }

  const handleMnemonicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Normalize mnemonic (trim, lowercase for validation)
      const normalizedMnemonic = mnemonic.trim().toLowerCase();

      // Validate mnemonic format
      if (!validateMnemonicPhrase(normalizedMnemonic)) {
        setError(
          "Invalid mnemonic phrase. Please check your 12 words and try again."
        );
        setLoading(false);
        return;
      }

      // Unlock crypto with the mnemonic
      await unlock(normalizedMnemonic);

      // Success - redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Restore error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to restore access. Please check your mnemonic phrase."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShardRecovery = async () => {
    setError(null);
    setLoading(true);
    setShardRecoveryStatus({ local: false, guardian: false, backup: false });

    try {
      // Collect available shards
      const { localShard, guardianShards, backupShard } =
        await collectShardsForRecovery();

      const availableShards: Array<{ shard: string; encrypted: boolean }> = [];

      // Add local shard if available
      if (localShard) {
        availableShards.push({ shard: localShard, encrypted: false });
        setShardRecoveryStatus((prev) => ({ ...prev, local: true }));
      }

      // Add guardian shard if available (use first one)
      if (guardianShards.length > 0) {
        const guardianShard = guardianShards[0];
        availableShards.push({
          shard: guardianShard.encryptedShard,
          encrypted: false, // Stored as raw hex for Phase 4
        });
        setShardRecoveryStatus((prev) => ({ ...prev, guardian: true }));
      }

      // Add backup shard if available
      if (backupShard) {
        availableShards.push({
          shard: backupShard.encryptedShard,
          encrypted: false, // Stored as raw hex for Phase 4
        });
        setShardRecoveryStatus((prev) => ({ ...prev, backup: true }));
      }

      if (availableShards.length < 2) {
        setError(
          `You need at least 2 shards to recover. Found ${availableShards.length}. Please use your mnemonic phrase or collect more shards.`
        );
        setLoading(false);
        return;
      }

      // For shard decryption, we need a temporary key
      // In a real implementation, shards might be encrypted with a different key
      // For now, we'll try to reconstruct directly (assuming shards are stored encrypted with MEK)
      // This is a simplified approach - in production, you'd need a separate encryption key

      // For Phase 4: Shards are stored as raw hex strings (not encrypted)
      // Map available shards to the format expected by reconstructFromShards
      const shardsForReconstruction = availableShards.map((s) => ({
        shard: s.shard,
        encrypted: false, // Shards are stored as raw hex for Phase 4
      }));

      // Reconstruct MEK from shards
      const reconstructedKey = await reconstructFromShards(
        shardsForReconstruction
      );

      // Unlock with reconstructed key
      await unlockWithKey(reconstructedKey);

      // Success - redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Shard recovery error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to recover from shards. Please try using your mnemonic phrase."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Restore Access
            </h1>
            <p className="text-neutral/70">
              Choose your recovery method to unlock your vault
            </p>
          </div>

          {/* Recovery Method Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab ${
                recoveryMethod === "mnemonic" ? "tab-active" : ""
              }`}
              onClick={() => setRecoveryMethod("mnemonic")}
            >
              <Key className="w-4 h-4 mr-2" />
              Mnemonic Phrase
            </button>
            <button
              className={`tab ${
                recoveryMethod === "shards" ? "tab-active" : ""
              }`}
              onClick={() => setRecoveryMethod("shards")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Social Recovery
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="alert alert-info mb-4">
            <Lock className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">Your data is secure</p>
              <p className="text-xs mt-1">
                Your mnemonic phrase is never sent to our servers. All
                decryption happens in your browser.
              </p>
            </div>
          </div>

          {/* Mnemonic Recovery Form */}
          {recoveryMethod === "mnemonic" && (
            <form onSubmit={handleMnemonicSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Recovery Phrase (12 words)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 font-mono text-sm"
                  placeholder="word1 word2 word3 ... word12"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-neutral/60">
                    Enter all 12 words separated by spaces
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading || !mnemonic.trim()}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Restoring...
                    </>
                  ) : (
                    <>
                      Unlock Vault
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Shard Recovery Form */}
          {recoveryMethod === "shards" && (
            <div className="space-y-4">
              <div className="alert alert-info">
                <Shield className="w-5 h-5" />
                <div>
                  <p className="text-sm font-semibold">Social Recovery</p>
                  <p className="text-xs mt-1">
                    Recover your account using shards stored on your device,
                    with a guardian, or in Supabase backup. You need any 2 of 3
                    shards.
                  </p>
                </div>
              </div>

              {/* Shard Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardRecoveryStatus.local ? "bg-success" : "bg-base-300"
                      }`}
                    ></div>
                    <span className="text-sm">Local Device Shard</span>
                  </div>
                  {shardRecoveryStatus.local ? (
                    <span className="badge badge-success">Available</span>
                  ) : (
                    <span className="badge badge-ghost">Not Found</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardRecoveryStatus.guardian
                          ? "bg-success"
                          : "bg-base-300"
                      }`}
                    ></div>
                    <span className="text-sm">Guardian Shard</span>
                  </div>
                  {shardRecoveryStatus.guardian ? (
                    <span className="badge badge-success">Available</span>
                  ) : (
                    <span className="badge badge-ghost">Not Found</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardRecoveryStatus.backup
                          ? "bg-success"
                          : "bg-base-300"
                      }`}
                    ></div>
                    <span className="text-sm">Backup Shard (Supabase)</span>
                  </div>
                  {shardRecoveryStatus.backup ? (
                    <span className="badge badge-success">Available</span>
                  ) : (
                    <span className="badge badge-ghost">Not Found</span>
                  )}
                </div>
              </div>

              {/* Recover Button */}
              <button
                className="btn btn-primary w-full"
                onClick={handleShardRecovery}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Recovering from Shards...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Recover with Shards
                  </>
                )}
              </button>

              <div className="text-center text-sm text-neutral/70">
                <p>
                  Need help? You can also use your mnemonic phrase to recover.
                </p>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center mt-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
