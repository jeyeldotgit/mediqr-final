/**
 * Hook for dashboard data and state
 */

import { useState, useEffect, useCallback } from "react";
import { getVaultItems } from "../services/vaultService";
import { getUserId } from "../lib/storage";
import type { VaultItem } from "../types";

interface DashboardState {
  vaultItems: VaultItem[];
  loading: boolean;
  lastUpdated: Date | null;
  totalItems: number;
  categoryCounts: Record<string, number>;
}

export const useDashboard = () => {
  const userId = getUserId();
  const [state, setState] = useState<DashboardState>({
    vaultItems: [],
    loading: true,
    lastUpdated: null,
    totalItems: 0,
    categoryCounts: {},
  });

  const loadVaultSummary = useCallback(async () => {
    if (!userId) return;

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await getVaultItems(userId);
      const items = response.items || [];

      // Calculate category counts
      const categoryCounts = items.reduce(
        (acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Find most recent update
      let lastUpdated: Date | null = null;
      if (items.length > 0) {
        const dates = items.map((item) => new Date(item.updated_at));
        lastUpdated = new Date(Math.max(...dates.map((d) => d.getTime())));
      }

      setState({
        vaultItems: items,
        loading: false,
        lastUpdated,
        totalItems: items.length,
        categoryCounts,
      });
    } catch (err) {
      console.error("Failed to load vault summary:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadVaultSummary();
    }
  }, [userId, loadVaultSummary]);

  return { ...state, userId, refresh: loadVaultSummary };
};

