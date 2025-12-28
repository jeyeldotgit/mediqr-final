import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateMnemonicPhrase,
  validateMnemonicPhrase,
} from "../lib/crypto/mnemonic";
import { useCrypto } from "../contexts/CryptoProvider";
import { setOnboarded, storeMnemonic, storeLocalShard, storeUserId } from "../lib/storage";
import { initProfile } from "../services/authService";
import { derivePublicKey, hashIdentifier } from "../lib/crypto/identifier";

type Step = "generate" | "verify" | "complete";

export default function Onboarding() {
  const [step, setStep] = useState<Step>("generate");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [verificationOrder, setVerificationOrder] = useState<number[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { unlock } = useCrypto();
  const navigate = useNavigate();

  // Generate mnemonic on mount
  useEffect(() => {
    const phrase = generateMnemonicPhrase();
    setMnemonic(phrase.split(" "));
  }, []);

  const handleGenerateComplete = () => {
    setStep("verify");
    setError("");
  };

  const handleWordSelect = (word: string, index: number) => {
    if (verificationOrder.includes(index)) {
      return; // Already selected
    }

    const newOrder = [...verificationOrder, index];
    const newSelected = [...selectedWords, word];

    setVerificationOrder(newOrder);
    setSelectedWords(newSelected);

    // Check if all words are selected
    if (newOrder.length === mnemonic.length) {
      verifyMnemonic(newSelected);
    }
  };

  const verifyMnemonic = async (selected: string[]) => {
    const phrase = selected.join(" ");

    if (!validateMnemonicPhrase(phrase)) {
      setError("Invalid mnemonic phrase. Please try again.");
      setVerificationOrder([]);
      setSelectedWords([]);
      return;
    }

    // Check if words are in correct order
    const isCorrect = selected.every((word, idx) => word === mnemonic[idx]);

    if (!isCorrect) {
      setError("Words are not in the correct order. Please try again.");
      setVerificationOrder([]);
      setSelectedWords([]);
      return;
    }

    // Verification successful - proceed to unlock and complete
    setIsLoading(true);
    try {
      // Unlock crypto context
      await unlock(phrase);

      // Store mnemonic and local shard
      storeMnemonic(phrase);
      // For Phase 1, store a placeholder local shard
      // In future phases, this will be a real SSS shard
      storeLocalShard("local-shard-placeholder");

      // Initialize profile on backend
      const publicKey = await derivePublicKey(phrase);
      const hashedId = await hashIdentifier(phrase);

      try {
        const profileResult = await initProfile(publicKey, hashedId);
        // Store user ID for future API calls
        if (profileResult.userId) {
          storeUserId(profileResult.userId);
        }
      } catch (apiError) {
        console.error("Failed to initialize profile:", apiError);
        // Continue anyway - profile creation can be retried later
        setError(
          "Profile initialization failed, but encryption is ready. You can retry from settings."
        );
      }

      setOnboarded(true);
      setStep("complete");
    } catch (err) {
      setError("Failed to initialize encryption. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    // Navigate to dashboard or call /auth/init
    navigate("/dashboard");
  };

  // Shuffle words for verification
  const shuffledWords = [...mnemonic].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          <div className="mb-4 flex justify-between items-center">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">
            Welcome to MediQR
          </h1>

          {/* Step Indicator */}
          <ul className="steps w-full mb-8">
            <li className={`step ${step !== "generate" ? "step-primary" : ""}`}>
              Generate
            </li>
            <li className={`step ${step === "complete" ? "step-primary" : ""}`}>
              Verify
            </li>
            <li className={`step ${step === "complete" ? "step-primary" : ""}`}>
              Complete
            </li>
          </ul>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Generate Step */}
          {step === "generate" && (
            <div className="space-y-6">
              <div className="alert alert-warning">
                <span>
                  <strong>Important:</strong> Write down these 12 words in order
                  and store them securely. You'll need them to access your
                  account.
                </span>
              </div>

              <div className="bg-base-300 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">
                  Your Recovery Phrase
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {mnemonic.map((word, index) => (
                    <div
                      key={index}
                      className="bg-base-100 p-3 rounded text-center font-mono"
                    >
                      <span className="text-sm text-base-content/60">
                        {index + 1}.
                      </span>{" "}
                      <span className="font-semibold">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary w-full"
                onClick={handleGenerateComplete}
              >
                I've Written Down My Phrase
              </button>
            </div>
          )}

          {/* Verify Step */}
          {step === "verify" && (
            <div className="space-y-6">
              <div className="alert alert-info">
                <span>
                  Please select the words in the correct order to verify you've
                  saved them correctly.
                </span>
              </div>

              {/* Selected words display */}
              {selectedWords.length > 0 && (
                <div className="bg-base-300 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">
                    Selected Words ({selectedWords.length}/{mnemonic.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((word, idx) => (
                      <span
                        key={idx}
                        className="badge badge-primary badge-lg font-mono"
                      >
                        {idx + 1}. {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Word selection grid */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Select Words in Order:
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {shuffledWords.map((word, index) => {
                    const originalIndex = mnemonic.indexOf(word);
                    const isSelected =
                      verificationOrder.includes(originalIndex);
                    return (
                      <button
                        key={`${word}-${index}`}
                        className={`btn ${
                          isSelected ? "btn-primary" : "btn-outline btn-primary"
                        }`}
                        onClick={() => handleWordSelect(word, originalIndex)}
                        disabled={isSelected || isLoading}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isLoading && (
                <div className="flex justify-center">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )}
            </div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <div className="space-y-6 text-center">
              <div className="alert alert-success">
                <span>✓ Your account has been set up successfully!</span>
              </div>

              <p className="text-base-content/80">
                Your encryption keys have been generated and your account is
                ready to use.
              </p>

              <button
                className="btn btn-primary w-full"
                onClick={handleComplete}
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
