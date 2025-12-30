/**
 * Onboarding Page
 * Layout and composition only - logic extracted to hooks
 */

import { useOnboarding } from "../hooks";
import { MnemonicDisplay, MnemonicVerify } from "../components/onboarding";
import { EducationModal, useEducationModal } from "../components/shared";

const Onboarding = () => {
  const {
    step,
    mnemonic,
    verificationOrder,
    selectedWords,
    error,
    isLoading,
    shuffledWords,
    handleGenerateComplete,
    handleWordSelect,
    handleComplete,
    handleBack,
  } = useOnboarding();

  const { topic, isOpen, openModal, closeModal } = useEducationModal();

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="card bg-base-200 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          {/* Back button */}
          <div className="mb-4 flex justify-between items-center">
            <button className="btn btn-ghost btn-sm" onClick={handleBack}>
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
            <MnemonicDisplay
              mnemonic={mnemonic}
              onContinue={handleGenerateComplete}
              onLearnMore={() => openModal("mnemonic")}
            />
          )}

          {/* Verify Step */}
          {step === "verify" && (
            <MnemonicVerify
              mnemonic={mnemonic}
              shuffledWords={shuffledWords}
              selectedWords={selectedWords}
              verificationOrder={verificationOrder}
              isLoading={isLoading}
              onWordSelect={handleWordSelect}
            />
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
              <button className="btn btn-primary w-full" onClick={handleComplete}>
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Education Modal */}
      <EducationModal topic={topic} isOpen={isOpen} onClose={closeModal} />
    </div>
  );
};

export default Onboarding;
