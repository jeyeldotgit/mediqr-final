import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { validateMnemonicPhrase } from "../lib/crypto/mnemonic";
import { isOnboarded } from "../lib/storage";
import { Key, ArrowRight, AlertCircle, Lock } from "lucide-react";

export default function Restore() {
  const navigate = useNavigate();
  const { unlock } = useCrypto();
  const [mnemonic, setMnemonic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if not onboarded (should go to onboarding instead)
  if (!isOnboarded()) {
    navigate("/onboarding");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
              Enter your 12-word recovery phrase to unlock your vault
            </p>
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

          {/* Restore Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral/70 mb-2">
              Don't have your recovery phrase?
            </p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                // In future phases, this would link to social recovery
                alert(
                  "Social recovery is coming in Phase 4. For now, you need your 12-word phrase to restore access."
                );
              }}
            >
              Use Social Recovery (Coming Soon)
            </button>
          </div>

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
