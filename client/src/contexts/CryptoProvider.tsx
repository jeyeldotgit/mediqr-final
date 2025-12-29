import {
  createContext,
  useContext,
  useState,
  useCallback,
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

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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

  const lock = useCallback(() => {
    setMasterKey(null);
    setIsUnlocked(false);
  }, []);

  const encryptData = useCallback(
    async (plaintext: string): Promise<{ encrypted: string; iv: string }> => {
      if (!masterKey) {
        throw new Error("Master key not available. Please unlock first.");
      }
      return encryptDataToBase64(masterKey, plaintext);
    },
    [masterKey]
  );

  const decryptData = useCallback(
    async (encrypted: string, iv: string): Promise<string> => {
      if (!masterKey) {
        throw new Error("Master key not available. Please unlock first.");
      }
      return decryptDataFromBase64(masterKey, encrypted, iv);
    },
    [masterKey]
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
