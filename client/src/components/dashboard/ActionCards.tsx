/**
 * Action Cards Component
 * Dashboard action buttons for navigation
 */

import { useNavigate } from "react-router-dom";
import { FileText, QrCode, Settings, ArrowRight } from "lucide-react";

export const ActionCards = () => {
  const navigate = useNavigate();

  const scrollToQR = () => {
    const qrSection = document.getElementById("qr-generator-section");
    if (qrSection) {
      qrSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
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
            Create your MediQR code for emergency access by healthcare providers
          </p>
          <div className="card-actions">
            <button className="btn btn-secondary w-full" onClick={scrollToQR}>
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
              onClick={() => navigate("/settings")}
            >
              Settings
              <Settings className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
