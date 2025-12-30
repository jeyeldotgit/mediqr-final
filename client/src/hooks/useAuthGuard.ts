/**
 * Hook for authentication guard logic
 * Handles redirects based on auth state
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { isOnboarded } from "../lib/storage";

interface UseAuthGuardOptions {
  requireUnlocked?: boolean;
  redirectTo?: string;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { requireUnlocked = true, redirectTo } = options;
  const { isUnlocked } = useCrypto();
  const navigate = useNavigate();
  const onboarded = isOnboarded();

  useEffect(() => {
    if (requireUnlocked && !isUnlocked) {
      if (redirectTo) {
        navigate(redirectTo);
      } else if (onboarded) {
        navigate("/restore");
      } else {
        navigate("/onboarding");
      }
    }
  }, [isUnlocked, navigate, onboarded, redirectTo, requireUnlocked]);

  return { isUnlocked, onboarded };
};

