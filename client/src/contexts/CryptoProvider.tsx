import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { deriveMEKFromMnemonic } from "../lib/crypto/keyDerivation";
import { encryptDataToBase64, decryptDataFromBase64 } from "../lib/crypto/aes";

interface CryptoContextType {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (mnemonic: string) => Promise<void>;
  unlockWithKey: (key: CryptoKey) => Promise<void>;
  lock: () => void;
  encryptData: (
    plaintext: string
  ) => Promise<{ encrypted: string; iv: string }>;
  decryptData: (encrypted: string, iv: string) => Promise<string>;
}

const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

// Idle timeout in milliseconds (default: 15 minutes)
const IDLE_TIMEOUT = 15 * 60 * 1000;

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const unlock = useCallback(async (mnemonic: string) => {
    try {
      const key = await deriveMEKFromMnemonic(mnemonic);
      setMasterKey(key);
      setIsUnlocked(true);
    } catch (error) {
      throw new Error(
        `Failed to unlock: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const unlockWithKey = useCallback(async (key: CryptoKey) => {
    try {
      setMasterKey(key);
      setIsUnlocked(true);
    } catch (error) {
      throw new Error(
        `Failed to unlock with key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  // Clear master key from memory
  const clearMasterKey = useCallback(() => {
    // Note: CryptoKey objects cannot be explicitly cleared in JavaScript,
    // but setting to null removes the reference and allows GC
    setMasterKey(null);
    setIsUnlocked(false);
    
    // Clear any stored references
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const lock = useCallback(() => {
    clearMasterKey();
  }, [clearMasterKey]);

  // Reset idle timer on activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (isUnlocked && masterKey) {
      idleTimerRef.current = setTimeout(() => {
        console.log("[CryptoProvider] Idle timeout - locking vault");
        clearMasterKey();
      }, IDLE_TIMEOUT);
    }
  }, [isUnlocked, masterKey, clearMasterKey]);

  // Track user activity
  useEffect(() => {
    if (!isUnlocked) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      resetIdleTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isUnlocked, resetIdleTimer]);

  const encryptData = useCallback(
    async (plaintext: string): Promise<{ encrypted: string; iv: string }> => {
      if (!masterKey) {
        throw new Error("Master key not available. Please unlock first.");
      }
      resetIdleTimer();
      return encryptDataToBase64(masterKey, plaintext);
    },
    [masterKey, resetIdleTimer]
  );

  const decryptData = useCallback(
    async (encrypted: string, iv: string): Promise<string> => {
      if (!masterKey) {
        throw new Error("Master key not available. Please unlock first.");
      }
      resetIdleTimer();
      return decryptDataFromBase64(masterKey, encrypted, iv);
    },
    [masterKey, resetIdleTimer]
  );

  return (
    <CryptoContext.Provider
      value={{
        masterKey,
        isUnlocked,
        unlock,
        unlockWithKey,
        lock,
        encryptData,
        decryptData,
      }}
    >
      {children}
    </CryptoContext.Provider>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error("useCrypto must be used within a CryptoProvider");
  }
  return context;
}
