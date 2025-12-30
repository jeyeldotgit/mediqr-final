/**
 * Mnemonic Verification Component
 * Allows user to verify their recovery phrase
 */

interface MnemonicVerifyProps {
  mnemonic: string[];
  shuffledWords: string[];
  selectedWords: string[];
  verificationOrder: number[];
  isLoading: boolean;
  onWordSelect: (word: string, index: number) => void;
}

export const MnemonicVerify = ({
  mnemonic,
  shuffledWords,
  selectedWords,
  verificationOrder,
  isLoading,
  onWordSelect,
}: MnemonicVerifyProps) => {
  return (
    <div className="space-y-6">
      <div className="alert alert-info">
        <span>
          Please select the words in the correct order to verify you've saved
          them correctly.
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
        <h3 className="text-lg font-semibold mb-3">Select Words in Order:</h3>
        <div className="grid grid-cols-3 gap-3">
          {shuffledWords.map((word, index) => {
            const originalIndex = mnemonic.indexOf(word);
            const isSelected = verificationOrder.includes(originalIndex);
            return (
              <button
                key={`${word}-${index}`}
                className={`btn ${
                  isSelected ? "btn-primary" : "btn-outline btn-primary"
                }`}
                onClick={() => onWordSelect(word, originalIndex)}
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
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
    </div>
  );
};

