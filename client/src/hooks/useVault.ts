/**
 * Hook for vault operations
 * Handles loading, saving, and encrypting vault data
 */

import { useState, useEffect, useCallback } from "react";
import { useCrypto } from "../contexts/CryptoProvider";
import { getUserId } from "../lib/storage";
import { syncVault, getVaultItems } from "../services/vaultService";
import { deriveSessionKeyFromMaster } from "../lib/crypto/sessionKey";
import { encryptDataToBase64 } from "../lib/crypto/aes";
import type { VaultCategory, VaultItem, VaultFormData } from "../types";

interface UseVaultReturn {
  vaultItems: VaultItem[];
  formData: VaultFormData;
  activeCategory: VaultCategory | null;
  saving: VaultCategory | null;
  success: VaultCategory | null;
  error: string;
  loading: boolean;
  setActiveCategory: (category: VaultCategory | null) => void;
  handleInputChange: (
    category: VaultCategory,
    field: string,
    value: string
  ) => void;
  handleSubmit: (category: VaultCategory) => Promise<void>;
}

const initialFormData: VaultFormData = {
  identity: {},
  allergies: {},
  medications: {},
  records: {},
};

export const useVault = (): UseVaultReturn => {
  const { isUnlocked, masterKey } = useCrypto();
  const userId = getUserId();

  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [formData, setFormData] = useState<VaultFormData>(initialFormData);
  const [activeCategory, setActiveCategory] = useState<VaultCategory | null>(
    null
  );
  const [saving, setSaving] = useState<VaultCategory | null>(null);
  const [success, setSuccess] = useState<VaultCategory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadVaultItems = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getVaultItems(userId);
      setVaultItems(response.items || []);
      setError("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load vault items";
      setError(
        `Unable to load vault items. ${errorMessage}. ${
          navigator.onLine
            ? "Please try again."
            : "You're offline. Please download offline vault when online."
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && isUnlocked) {
      loadVaultItems();
    }
  }, [userId, isUnlocked, loadVaultItems]);

  const handleInputChange = useCallback(
    (category: VaultCategory, field: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (category: VaultCategory) => {
      if (!userId || !isUnlocked || !masterKey) {
        setError("Please unlock your vault first");
        return;
      }

      try {
        setSaving(category);
        setError("");
        setSuccess(null);

        const data = formData[category];
        const jsonData = JSON.stringify(data);

        // Generate fragment deterministically
        const fragmentPlaintext = new TextEncoder().encode(
          `mediqr-fragment-${userId}`
        );
        const ivInput = new TextEncoder().encode(`mediqr-iv-${userId}`);
        const ivHash = await crypto.subtle.digest("SHA-256", ivInput);
        const fixedIV = new Uint8Array(ivHash.slice(0, 12));

        const encryptedFragment = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: fixedIV, tagLength: 128 },
          masterKey,
          fragmentPlaintext
        );

        const fragmentBytes = new Uint8Array(encryptedFragment.slice(0, 16));
        const tokenMaterial = await crypto.subtle.digest(
          "SHA-256",
          fragmentBytes
        );
        const tokenBytes = new Uint8Array(tokenMaterial.slice(0, 32));
        const deterministicToken = Array.from(tokenBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const sessionKey = await deriveSessionKeyFromMaster(
          masterKey,
          deterministicToken,
          userId
        );

        const { encrypted, iv } = await encryptDataToBase64(
          sessionKey,
          jsonData
        );
        await syncVault(userId, category, encrypted, iv);

        setFormData((prev) => ({ ...prev, [category]: {} }));
        setSuccess(category);
        await loadVaultItems();

        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save data");
      } finally {
        setSaving(null);
      }
    },
    [userId, isUnlocked, masterKey, formData, loadVaultItems]
  );

  return {
    vaultItems,
    formData,
    activeCategory,
    saving,
    success,
    error,
    loading,
    setActiveCategory,
    handleInputChange,
    handleSubmit,
  };
};

