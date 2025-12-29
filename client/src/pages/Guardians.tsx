import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { getGuardians, searchUsers } from "../services/guardianService";
import {
  storeGuardianShard,
  deleteRecoveryShard,
  getRecoveryShards,
} from "../services/recoveryService";
import { distributeShards } from "../lib/crypto/shardDistribution";
import { getUserId } from "../lib/storage";
import {
  UserPlus,
  Trash2,
  Shield,
  AlertCircle,
  Search,
  Loader,
  BookOpen,
} from "lucide-react";
import EducationModal, { useEducationModal } from "../components/EducationModal";

export default function Guardians() {
  const navigate = useNavigate();
  const { masterKey, isUnlocked } = useCrypto();
  const { topic, isOpen, openModal, closeModal } = useEducationModal();
  const [guardians, setGuardians] = useState<
    Array<{
      id: string;
      guardianId: string;
      shardId?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; role: string; publicKey?: string }>
  >([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      navigate("/restore");
      return;
    }
    loadGuardians();
  }, [isUnlocked, navigate]);

  const loadGuardians = async () => {
    try {
      setLoading(true);
      const guardianList = await getGuardians();
      setGuardians(guardianList);
    } catch (err) {
      console.error("Failed to load guardians:", err);
      setError("Failed to load guardians. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setError(null);

      // Try to search by userId (UUID format)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidRegex.test(searchQuery.trim());

      const result = await searchUsers(
        isUUID ? { userId: searchQuery.trim() } : { email: searchQuery.trim() }
      );

      // Filter out current user
      const userId = getUserId();
      setSearchResults(
        result.users.filter(
          (user) => user.id !== userId && user.role === "citizen"
        )
      );
    } catch (err) {
      console.error("Search error:", err);
      setError(
        "Failed to search users. Please check the user ID and try again."
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddGuardian = async (guardianId: string) => {
    if (!masterKey) {
      setError("Master key not available. Please restore your account first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if guardian already exists
      if (guardians.some((g) => g.guardianId === guardianId)) {
        setError("This user is already a guardian.");
        return;
      }

      // Get current shards to see if we need to redistribute
      const currentShards = await getRecoveryShards();
      const hasExistingShards = currentShards.shards.length > 0;

      if (hasExistingShards) {
        // If shards already exist, we need to recreate them with the new guardian
        // For simplicity, we'll just add a new shard for this guardian
        // In production, you might want to redistribute all shards
        const { splitMEKIntoShards } = await import("../lib/crypto/shamir");
        const { encryptDataToBase64 } = await import("../lib/crypto/aes");
        const rawShards = await splitMEKIntoShards(masterKey);

        // Use shard index 1 for guardian (we'll store it)
        const encrypted = await encryptDataToBase64(masterKey, rawShards[1]);
        const shardData = encrypted.encrypted + ":" + encrypted.iv;

        await storeGuardianShard({
          guardianId,
          encryptedShard: shardData,
        });
      } else {
        // First time setting up shards - distribute all 3
        await distributeShards(masterKey, [guardianId]);
      }

      // Reload guardians
      await loadGuardians();
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to add guardian:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add guardian. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGuardian = async (shardId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this guardian? They will no longer be able to help you recover your account."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await deleteRecoveryShard(shardId);
      await loadGuardians();
    } catch (err) {
      console.error("Failed to remove guardian:", err);
      setError("Failed to remove guardian. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupShards = async () => {
    if (!masterKey) {
      setError("Master key not available. Please restore your account first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Distribute shards (will use existing guardians if any)
      const guardianIds = guardians.map((g) => g.guardianId);
      await distributeShards(masterKey, guardianIds);

      // Reload guardians
      await loadGuardians();
    } catch (err) {
      console.error("Failed to setup shards:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to setup recovery shards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
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
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-primary">
                    Guardian Management
                  </h1>
                  <p className="text-neutral/70">
                    Manage your social recovery guardians
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>

            {/* Info Alert */}
            <div className="alert alert-info">
              <Shield className="w-5 h-5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      How Social Recovery Works
                    </p>
                    <p className="text-xs mt-1">
                      Your master key is split into 3 shards using Shamir's Secret
                      Sharing. You need any 2 of 3 shards to recover your account.
                      One shard is stored locally, one with a guardian, and one as a
                      backup in Supabase.
                    </p>
                  </div>
                  <button
                    className="btn btn-sm btn-ghost ml-4"
                    onClick={() => openModal("guardians")}
                    aria-label="Learn more about guardians"
                  >
                    <BookOpen className="w-4 h-4" />
                    Learn More
                  </button>
                </div>
              </div>
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

        {/* Search Section */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">Add Guardian</h2>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter user ID (UUID) to search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Search
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Search Results:</h3>
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div>
                        <p className="font-mono text-sm">{user.id}</p>
                        <p className="text-xs text-neutral/70">
                          Role: {user.role}
                        </p>
                      </div>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleAddGuardian(user.id)}
                        disabled={loading}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add as Guardian
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <div className="mt-4 text-sm text-neutral/70">
                No users found. Make sure you're entering a valid user ID.
              </div>
            )}
          </div>
        </div>

        {/* Guardians List */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Guardians</h2>
              <button
                className="btn btn-sm btn-outline"
                onClick={handleSetupShards}
                disabled={loading}
              >
                Setup/Refresh Shards
              </button>
            </div>

            {loading && guardians.length === 0 ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : guardians.length === 0 ? (
              <div className="text-center py-8 text-neutral/70">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No guardians added yet.</p>
                <p className="text-sm mt-1">
                  Add a guardian above to enable social recovery.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Guardian ID</th>
                      <th>Shard ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardians.map((guardian) => (
                      <tr key={guardian.id}>
                        <td>
                          <code className="text-xs font-mono">
                            {guardian.guardianId}
                          </code>
                        </td>
                        <td>
                          <code className="text-xs font-mono">
                            {guardian.shardId || "N/A"}
                          </code>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() =>
                              handleRemoveGuardian(
                                guardian.shardId || guardian.id
                              )
                            }
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Education Modal */}
      <EducationModal topic={topic} isOpen={isOpen} onClose={closeModal} />
    </div>
  );
}
