/**
 * Mnemonic Display Component
 * Shows the generated recovery phrase
 */

import { BookOpen } from "lucide-react";

interface MnemonicDisplayProps {
  mnemonic: string[];
  onContinue: () => void;
  onLearnMore: () => void;
}

export const MnemonicDisplay = ({
  mnemonic,
  onContinue,
  onLearnMore,
}: MnemonicDisplayProps) => {
  return (
    <div className="space-y-6">
      <div className="alert alert-warning">
        <div className="flex items-start gap-3">
          <span>
            <strong>Important:</strong> Write down these 12 words in order and
            store them securely. You'll need them to access your account.
          </span>
          <button
            className="btn btn-sm btn-ghost"
            onClick={onLearnMore}
            aria-label="Learn more about recovery phrases"
          >
            <BookOpen className="w-4 h-4" />
            Learn More
          </button>
        </div>
      </div>

      <div className="bg-base-300 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Your Recovery Phrase</h2>
        <div className="grid grid-cols-3 gap-3">
          {mnemonic.map((word, index) => (
            <div
              key={index}
              className="bg-base-100 p-3 rounded text-center font-mono"
            >
              <span className="text-sm text-base-content/60">{index + 1}.</span>{" "}
              <span className="font-semibold">{word}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary w-full" onClick={onContinue}>
        I've Written Down My Phrase
      </button>
    </div>
  );
};

