import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { isOnboarded, getLocalShard } from "../lib/storage";
import { getRecoveryShards } from "../services/recoveryService";
import { getGuardians } from "../services/guardianService";
import { getUserId } from "../lib/storage";
import {
  Key,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react";

interface ShardStatus {
  local: boolean;
  guardian: boolean;
  backup: boolean;
  totalAvailable: number;
}

export default function RecoveryOptions() {
  const navigate = useNavigate();
  const { isUnlocked } = useCrypto();
  const onboarded = isOnboarded();
  const [loading, setLoading] = useState(true);
  const [shardStatus, setShardStatus] = useState<ShardStatus>({
    local: false,
    guardian: false,
    backup: false,
    totalAvailable: 0,
  });
  const [guardianCount, setGuardianCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!onboarded) {
      navigate("/onboarding");
    } else if (!isUnlocked) {
      navigate("/restore");
    } else {
      loadRecoveryStatus();
    }
  }, [onboarded, isUnlocked, navigate]);

  const loadRecoveryStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check local shard
      const localShard = getLocalShard();
      const hasLocalShard = !!localShard;

      // Check guardian and backup shards
      const userId = getUserId();
      let hasGuardianShard = false;
      let hasBackupShard = false;
      let guardianCount = 0;

      if (userId) {
        try {
          const shardsResponse = await getRecoveryShards();
          const guardiansResponse = await getGuardians();

          guardianCount = guardiansResponse.length;

          // Check for guardian shards (guardian_id !== user_id)
          const guardianShards = shardsResponse.shards.filter(
            (shard) => shard.guardianId && shard.guardianId !== userId
          );
          hasGuardianShard = guardianShards.length > 0;

          // Check for backup shard (guardian_id === user_id)
          const backupShards = shardsResponse.shards.filter(
            (shard) => shard.guardianId === userId
          );
          hasBackupShard = backupShards.length > 0;
        } catch (err) {
          console.error("Failed to load shard status:", err);
          // Don't set error - just show what we can determine
        }
      }

      const totalAvailable =
        (hasLocalShard ? 1 : 0) +
        (hasGuardianShard ? 1 : 0) +
        (hasBackupShard ? 1 : 0);

      setShardStatus({
        local: hasLocalShard,
        guardian: hasGuardianShard,
        backup: hasBackupShard,
        totalAvailable,
      });
      setGuardianCount(guardianCount);
    } catch (err) {
      console.error("Failed to load recovery status:", err);
      setError("Failed to load recovery information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not ready
  if (!onboarded || !isUnlocked) {
    return null;
  }

  const canRecoverWithShards = shardStatus.totalAvailable >= 2;
  const recoveryReady = canRecoverWithShards;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Key className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-secondary">
                    Recovery Options
                  </h1>
                  <p className="text-neutral/70">
                    View your account recovery methods and status
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/settings")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Recovery Status Overview */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="text-2xl font-semibold mb-4">Recovery Status</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overall Status */}
                <div
                  className={`alert ${
                    recoveryReady
                      ? "alert-success"
                      : shardStatus.totalAvailable === 1
                        ? "alert-warning"
                        : "alert-error"
                  }`}
                >
                  {recoveryReady ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {recoveryReady
                        ? "Recovery Ready"
                        : shardStatus.totalAvailable === 1
                          ? "Recovery Partially Configured"
                          : "Recovery Not Configured"}
                    </p>
                    <p className="text-sm mt-1">
                      {recoveryReady
                        ? "You have sufficient recovery methods configured. You can recover your account using your mnemonic phrase or shard recovery."
                        : shardStatus.totalAvailable === 1
                          ? "You have 1 shard available. You need at least 2 shards for social recovery. Consider adding a guardian or setting up backup shards."
                          : "You don't have any recovery shards configured. Set up guardians to enable social recovery."}
                    </p>
                  </div>
                </div>

                {/* Recovery Methods */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mnemonic Recovery */}
                  <div className="card bg-base-200 shadow-md">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-2">
                        <Key className="w-5 h-5 text-primary" />
                        <h3 className="card-title text-lg">Mnemonic Phrase</h3>
                      </div>
                      <p className="text-sm text-neutral/80 mb-3">
                        Your 12-word mnemonic phrase is the primary recovery
                        method. Store it securely offline.
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium text-success">
                          Always Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shard Recovery */}
                  <div className="card bg-base-200 shadow-md">
                    <div className="card-body">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-secondary" />
                        <h3 className="card-title text-lg">Social Recovery</h3>
                      </div>
                      <p className="text-sm text-neutral/80 mb-3">
                        Recover using shards stored on your device, with
                        guardians, or in backup. Requires 2 of 3 shards.
                      </p>
                      <div className="flex items-center gap-2">
                        {canRecoverWithShards ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-success" />
                            <span className="text-sm font-medium text-success">
                              {shardStatus.totalAvailable} of 3 Shards Available
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-error" />
                            <span className="text-sm font-medium text-error">
                              {shardStatus.totalAvailable} of 3 Shards Available
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shard Details */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="text-2xl font-semibold mb-4">Shard Status</h2>

            {loading ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner"></span>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Local Shard */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardStatus.local ? "bg-success" : "bg-base-300"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium">Local Device Shard</p>
                      <p className="text-sm text-neutral/70">
                        Stored on this device
                      </p>
                    </div>
                  </div>
                    {shardStatus.local ? (
                      <span className="badge badge-success">Available</span>
                    ) : (
                      <span className="badge badge-ghost">Not Found</span>
                    )}
                </div>

                {/* Guardian Shard */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardStatus.guardian ? "bg-success" : "bg-base-300"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium">Guardian Shard</p>
                      <p className="text-sm text-neutral/70">
                        {guardianCount > 0
                          ? `${guardianCount} guardian(s) configured`
                          : "No guardians configured"}
                      </p>
                    </div>
                  </div>
                  {shardStatus.guardian ? (
                    <span className="badge badge-success">Available</span>
                  ) : (
                    <span className="badge badge-ghost">Not Found</span>
                  )}
                </div>

                {/* Backup Shard */}
                <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        shardStatus.backup ? "bg-success" : "bg-base-300"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium">Backup Shard</p>
                      <p className="text-sm text-neutral/70">
                        Stored securely in Supabase
                      </p>
                    </div>
                  </div>
                  {shardStatus.backup ? (
                    <span className="badge badge-success">Available</span>
                  ) : (
                    <span className="badge badge-ghost">Not Found</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Setup Guardians */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="card-title">Manage Guardians</h3>
              </div>
              <p className="text-sm text-neutral/80 mb-4">
                Add or remove guardians to enable social recovery. Guardians can
                help you recover your account if you lose access.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => navigate("/settings/guardians")}
                >
                  Manage Guardians
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Perform Recovery */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-5 h-5 text-secondary" />
                <h3 className="card-title">Recover Account</h3>
              </div>
              <p className="text-sm text-neutral/80 mb-4">
                If you've lost access to your account, use your mnemonic phrase
                or shard recovery to restore access.
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => navigate("/restore")}
                >
                  Start Recovery
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-6 card bg-gradient-to-r from-info/5 to-primary/5 border border-info/20">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-info mt-0.5" />
              <div>
                <h3 className="font-semibold text-info mb-2">
                  How Recovery Works
                </h3>
                <div className="space-y-2 text-sm text-neutral/80">
                  <p>
                    <strong>Mnemonic Recovery:</strong> Your 12-word mnemonic
                    phrase is the master key to your account. Store it securely
                    offline. Never share it with anyone.
                  </p>
                  <p>
                    <strong>Social Recovery:</strong> Your master key is split
                    into 3 shards using Shamir's Secret Sharing. You need any 2
                    of 3 shards to recover:
                  </p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Local shard (stored on this device)</li>
                    <li>Guardian shard (stored with a trusted guardian)</li>
                    <li>Backup shard (stored securely in Supabase)</li>
                  </ul>
                  <p className="mt-2">
                    If you lose your mnemonic, you can recover using any 2 of
                    these shards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

