/**
 * Hook for onboarding flow logic
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  generateMnemonicPhrase,
  validateMnemonicPhrase,
} from "../lib/crypto/mnemonic";
import { useCrypto } from "../contexts/CryptoProvider";
import {
  setOnboarded,
  storeMnemonic,
  storeLocalShard,
  storeUserId,
} from "../lib/storage";
import { initProfile } from "../services/authService";
import { derivePublicKey, hashIdentifier } from "../lib/crypto/identifier";

export type OnboardingStep = "generate" | "verify" | "complete";

interface OnboardingState {
  step: OnboardingStep;
  mnemonic: string[];
  verificationOrder: number[];
  selectedWords: string[];
  error: string;
  isLoading: boolean;
}

export const useOnboarding = () => {
  const navigate = useNavigate();
  const { unlock } = useCrypto();

  const [state, setState] = useState<OnboardingState>({
    step: "generate",
    mnemonic: [],
    verificationOrder: [],
    selectedWords: [],
    error: "",
    isLoading: false,
  });

  // Generate mnemonic on mount
  useEffect(() => {
    const phrase = generateMnemonicPhrase();
    setState((prev) => ({ ...prev, mnemonic: phrase.split(" ") }));
  }, []);

  const handleGenerateComplete = useCallback(() => {
    setState((prev) => ({ ...prev, step: "verify", error: "" }));
  }, []);

  const verifyMnemonic = useCallback(
    async (selected: string[]) => {
      const phrase = selected.join(" ");

      if (!validateMnemonicPhrase(phrase)) {
        setState((prev) => ({
          ...prev,
          error: "Invalid mnemonic phrase. Please try again.",
          verificationOrder: [],
          selectedWords: [],
        }));
        return;
      }

      const isCorrect = selected.every(
        (word, idx) => word === state.mnemonic[idx]
      );

      if (!isCorrect) {
        setState((prev) => ({
          ...prev,
          error: "Words are not in the correct order. Please try again.",
          verificationOrder: [],
          selectedWords: [],
        }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await unlock(phrase);
        storeMnemonic(phrase);
        storeLocalShard("local-shard-placeholder");

        const publicKey = await derivePublicKey(phrase);
        const hashedId = await hashIdentifier(phrase);

        try {
          const profileResult = await initProfile(publicKey, hashedId);
          if (profileResult.userId) {
            storeUserId(profileResult.userId);
          }
        } catch (apiError) {
          console.error("Failed to initialize profile:", apiError);
          setState((prev) => ({
            ...prev,
            error:
              "Profile initialization failed, but encryption is ready. You can retry from settings.",
          }));
        }

        setOnboarded(true);
        setState((prev) => ({ ...prev, step: "complete", isLoading: false }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize encryption. Please try again.",
          isLoading: false,
        }));
        console.error(err);
      }
    },
    [state.mnemonic, unlock]
  );

  const handleWordSelect = useCallback(
    (word: string, index: number) => {
      if (state.verificationOrder.includes(index)) return;

      const newOrder = [...state.verificationOrder, index];
      const newSelected = [...state.selectedWords, word];

      setState((prev) => ({
        ...prev,
        verificationOrder: newOrder,
        selectedWords: newSelected,
      }));

      if (newOrder.length === state.mnemonic.length) {
        verifyMnemonic(newSelected);
      }
    },
    [state.verificationOrder, state.selectedWords, state.mnemonic, verifyMnemonic]
  );

  const handleComplete = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Shuffle words for verification
  const shuffledWords = [...state.mnemonic].sort(() => Math.random() - 0.5);

  return {
    ...state,
    shuffledWords,
    handleGenerateComplete,
    handleWordSelect,
    handleComplete,
    handleBack,
  };
};

