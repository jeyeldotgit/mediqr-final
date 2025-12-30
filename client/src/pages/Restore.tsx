/**
 * Restore Page
 * Converted to arrow syntax
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { validateMnemonicPhrase } from "../lib/crypto/mnemonic";
import { isOnboarded } from "../lib/storage";
import {
  collectShardsForRecovery,
  reconstructFromShards,
} from "../lib/crypto/shardDistribution";
import { Key, ArrowRight, AlertCircle, Lock, Shield, Loader } from "lucide-react";

type RecoveryMethod = "mnemonic" | "shards";

interface ShardStatus {
  local: boolean;
  guardian: boolean;
  backup: boolean;
}

const Restore = () => {
  const navigate = useNavigate();
  const { unlock, unlockWithKey } = useCrypto();
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("mnemonic");
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shardStatus, setShardStatus] = useState<ShardStatus>({
    local: false,
    guardian: false,
    backup: false,
  });

  if (!isOnboarded()) {
    navigate("/onboarding");
    return null;
  }

  const handleMnemonicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedMnemonic = mnemonic.trim().toLowerCase();
      if (!validateMnemonicPhrase(normalizedMnemonic)) {
        setError("Invalid mnemonic phrase. Please check your 12 words.");
        setLoading(false);
        return;
      }

      await unlock(normalizedMnemonic);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore access.");
    } finally {
      setLoading(false);
    }
  };

  const handleShardRecovery = async () => {
    setError(null);
    setLoading(true);
    setShardStatus({ local: false, guardian: false, backup: false });

    try {
      const { localShard, guardianShards, backupShard } =
        await collectShardsForRecovery();

      const availableShards: Array<{ shard: string; encrypted: boolean }> = [];

      if (localShard) {
        availableShards.push({ shard: localShard, encrypted: false });
        setShardStatus((prev) => ({ ...prev, local: true }));
      }

      if (guardianShards.length > 0) {
        availableShards.push({
          shard: guardianShards[0].encryptedShard,
          encrypted: false,
        });
        setShardStatus((prev) => ({ ...prev, guardian: true }));
      }

      if (backupShard) {
        availableShards.push({
          shard: backupShard.encryptedShard,
          encrypted: false,
        });
        setShardStatus((prev) => ({ ...prev, backup: true }));
      }

      if (availableShards.length < 2) {
        setError(
          `You need at least 2 shards to recover. Found ${availableShards.length}.`
        );
        setLoading(false);
        return;
      }

      const shardsForReconstruction = availableShards.map((s) => ({
        shard: s.shard,
        encrypted: false,
      }));

      const reconstructedKey = await reconstructFromShards(shardsForReconstruction);
      await unlockWithKey(reconstructedKey);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recover from shards.");
      setLoading(false);
    }
  };

  const ShardStatusItem = ({
    label,
    available,
  }: {
    label: string;
    available: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            available ? "bg-success" : "bg-base-300"
          }`}
        />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`badge ${available ? "badge-success" : "badge-ghost"}`}>
        {available ? "Available" : "Not Found"}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Restore Access</h1>
            <p className="text-neutral/70">
              Choose your recovery method to unlock your vault
            </p>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab ${recoveryMethod === "mnemonic" ? "tab-active" : ""}`}
              onClick={() => setRecoveryMethod("mnemonic")}
            >
              <Key className="w-4 h-4 mr-2" />
              Mnemonic
            </button>
            <button
              className={`tab ${recoveryMethod === "shards" ? "tab-active" : ""}`}
              onClick={() => setRecoveryMethod("shards")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Social Recovery
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="alert alert-info mb-4">
            <Lock className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">Your data is secure</p>
              <p className="text-xs mt-1">
                Your mnemonic phrase is never sent to our servers.
              </p>
            </div>
          </div>

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
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading || !mnemonic.trim()}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner" />
                    Restoring...
                  </>
                ) : (
                  <>
                    Unlock Vault
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {recoveryMethod === "shards" && (
            <div className="space-y-4">
              <div className="alert alert-info">
                <Shield className="w-5 h-5" />
                <p className="text-sm">
                  Recover using shards from your device, guardian, or backup. Need
                  2 of 3.
                </p>
              </div>

              <div className="space-y-2">
                <ShardStatusItem label="Local Device Shard" available={shardStatus.local} />
                <ShardStatusItem label="Guardian Shard" available={shardStatus.guardian} />
                <ShardStatusItem label="Backup Shard" available={shardStatus.backup} />
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleShardRecovery}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Recover with Shards
                  </>
                )}
              </button>
            </div>
          )}

          <div className="text-center mt-4">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restore;
