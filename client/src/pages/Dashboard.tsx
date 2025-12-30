/**
 * Dashboard Page
 * Layout and composition only - logic extracted to hooks
 */

import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuthGuard, useDashboard } from "../hooks";
import {
  DashboardStats,
  ActionCards,
  QRGenerator,
  EmergencyCard,
} from "../components/dashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isUnlocked } = useAuthGuard();
  const { loading, lastUpdated, totalItems, categoryCounts } = useDashboard();

  if (!isUnlocked) return null;

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Dashboard</h1>
            <p className="text-neutral/70">
              Welcome to your MediQR health vault
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            Home
          </button>
        </div>

        {/* Summary Cards */}
        <DashboardStats
          totalItems={totalItems}
          lastUpdated={lastUpdated}
          loading={loading}
        />

        {/* Category Breakdown */}
        {totalItems > 0 && (
          <div className="card bg-base-200 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">
                Records by Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["identity", "allergies", "medications", "records"].map(
                  (category) => (
                    <div
                      key={category}
                      className="text-center p-4 bg-base-100 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-primary mb-1">
                        {categoryCounts[category] || 0}
                      </p>
                      <p className="text-sm text-neutral/70 capitalize">
                        {category}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <ActionCards />

        {/* Emergency & Offline Mode Card */}
        <div className="mt-6">
          <EmergencyCard />
        </div>

        {/* QR Generator Section */}
        <div id="qr-generator-section" className="mt-6">
          <QRGenerator />
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
};

export default Dashboard;
