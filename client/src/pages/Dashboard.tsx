import { useState, useEffect } from "react";
import { useCrypto } from "../contexts/CryptoProvider";
import { useNavigate } from "react-router-dom";
import { getVaultItems } from "../lib/api";
import { getUserId } from "../lib/storage";
import {
  Heart,
  QrCode,
  Settings,
  FileText,
  Calendar,
  ArrowRight,
  Lock,
  Shield,
} from "lucide-react";

interface VaultItem {
  id: string;
  category: string;
  updated_at: string;
}

export default function Dashboard() {
  const { isUnlocked } = useCrypto();
  const navigate = useNavigate();
  const userId = getUserId();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!isUnlocked) {
      navigate("/onboarding");
      return;
    }

    if (userId) {
      loadVaultSummary();
    }
  }, [isUnlocked, userId, navigate]);

  const loadVaultSummary = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getVaultItems(userId);
      const items = response.items || [];
      setVaultItems(items);

      // Find most recent update
      if (items.length > 0) {
        const dates = items.map((item) => new Date(item.updated_at));
        const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));
        setLastUpdated(mostRecent);
      }
    } catch (err) {
      console.error("Failed to load vault summary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isUnlocked) {
    return null;
  }

  // Count items by category
  const categoryCounts = vaultItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalItems = vaultItems.length;

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
            <p className="text-neutral/70">
              Welcome to your MediQR health vault
            </p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Records */}
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral/70 mb-1">Total Records</p>
                  <p className="text-3xl font-bold text-primary">
                    {loading ? "..." : totalItems}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral/70 mb-1">Last Updated</p>
                  <p className="text-lg font-semibold text-secondary">
                    {loading ? (
                      "..."
                    ) : lastUpdated ? (
                      lastUpdated.toLocaleDateString()
                    ) : (
                      "Never"
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </div>
          </div>

          {/* Security Status */}
          <div className="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral/70 mb-1">Security</p>
                  <p className="text-lg font-semibold text-accent">Encrypted</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {totalItems > 0 && (
          <div className="card bg-base-200 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Records by Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["identity", "allergies", "medications", "records"].map(
                  (category) => {
                    const count = categoryCounts[category] || 0;
                    return (
                      <div
                        key={category}
                        className="text-center p-4 bg-base-100 rounded-lg"
                      >
                        <p className="text-2xl font-bold text-primary mb-1">
                          {count}
                        </p>
                        <p className="text-sm text-neutral/70 capitalize">
                          {category}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Health Vault */}
          <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h2 className="card-title text-primary">Health Vault</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                View and manage your encrypted medical records
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => navigate("/vault")}
                >
                  Open Vault
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <QrCode className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="card-title text-secondary">Generate QR</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                Create your MediQR code for emergency access by healthcare
                providers
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => {
                    // Placeholder for QR generation
                    alert("QR code generation coming soon!");
                  }}
                >
                  Generate QR
                  <QrCode className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow group">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Settings className="w-5 h-5 text-accent" />
                </div>
                <h2 className="card-title text-accent">Settings</h2>
              </div>
              <p className="text-neutral/80 mb-4">
                Manage guardians, recovery options, and account settings
              </p>
              <div className="card-actions">
                <button
                  className="btn btn-accent w-full"
                  onClick={() => {
                    // Placeholder for settings
                    alert("Settings page coming soon!");
                  }}
                >
                  Settings
                  <Settings className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 card bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Your Data is Encrypted
                </h3>
                <p className="text-sm text-neutral/80">
                  All your medical information is encrypted client-side using
                  AES-256-GCM before being stored. Only you have the key to
                  decrypt your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
