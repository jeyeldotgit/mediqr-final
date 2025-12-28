import { useCrypto } from "../contexts/CryptoProvider";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { isUnlocked } = useCrypto();
  const navigate = useNavigate();

  if (!isUnlocked) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <button
            className="btn btn-ghost"
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Health Vault</h2>
              <p>View and manage your encrypted medical records</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Open Vault</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">QR Code</h2>
              <p>Generate your MediQR code for emergency access</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Generate QR</button>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Settings</h2>
              <p>Manage guardians and recovery options</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Settings</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

