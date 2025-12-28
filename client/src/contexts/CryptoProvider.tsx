import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { deriveMEKFromMnemonic } from "../lib/crypto/keyDerivation";
import { encryptData, decryptData, encryptDataToBase64, decryptDataFromBase64 } from "../lib/crypto/aes";

interface CryptoContextType {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (mnemonic: string) => Promise<void>;
  lock: () => void;
  encryptData: (plaintext: string) => Promise<{ encrypted: string; iv: string }>;
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
      console.error("Failed to unlock:", error);
      throw new Error("Failed to derive master key from mnemonic");
    }
  }, []);

  const lock = useCallback(() => {
    setMasterKey(null);
    setIsUnlocked(false);
  }, []);

  const encrypt = useCallback(
    async (plaintext: string): Promise<{ encrypted: string; iv: string }> => {
      if (!masterKey) {
        throw new Error("Master key not unlocked");
      }
      return encryptDataToBase64(masterKey, plaintext);
    },
    [masterKey]
  );

  const decrypt = useCallback(
    async (encrypted: string, iv: string): Promise<string> => {
      if (!masterKey) {
        throw new Error("Master key not unlocked");
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
        lock,
        encryptData: encrypt,
        decryptData: decrypt,
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

