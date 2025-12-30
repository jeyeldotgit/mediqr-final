/**
 * Dashboard Stats Component
 * Displays summary cards for dashboard
 */

import { FileText, Calendar, Shield } from "lucide-react";

interface DashboardStatsProps {
  totalItems: number;
  lastUpdated: Date | null;
  loading: boolean;
}

export const DashboardStats = ({
  totalItems,
  lastUpdated,
  loading,
}: DashboardStatsProps) => {
  return (
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
                {loading
                  ? "..."
                  : lastUpdated
                  ? lastUpdated.toLocaleDateString()
                  : "Never"}
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
  );
};
