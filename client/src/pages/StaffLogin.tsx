import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffAuth } from "../services/staffService";
import { Stethoscope, Lock, Mail, Key } from "lucide-react";

export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "paramedic" | "er_admin">(
    "doctor"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await staffAuth({ email, password, role });

      // Store staff token in localStorage
      localStorage.setItem("mediqr_staff_token", response.token);
      localStorage.setItem("mediqr_staff_id", response.staffId);
      localStorage.setItem("mediqr_staff_role", response.role);

      // Redirect to scanner
      navigate("/staff/scanner");
    } catch (err) {
      console.error("Staff auth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md">
        <div className="card-body">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Staff Login
            </h1>
            <p className="text-neutral/70">Access patient records securely</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Role</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "doctor" | "paramedic" | "er_admin")
                }
                required
              >
                <option value="doctor">Doctor</option>
                <option value="paramedic">Paramedic</option>
                <option value="er_admin">ER Admin</option>
              </select>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 pointer-events-none flex items-center h-full">
                  <Mail className="w-5 h-5 text-neutral/50" />
                </span>
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="your.email@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 pointer-events-none flex items-center h-full">
                  <Lock className="w-5 h-5 text-neutral/50" />
                </span>
                <input
                  type="password"
                  className="input input-bordered w-full pl-10"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5 mr-2" />
                    Login
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info Notice */}
          <div className="mt-6 alert alert-info">
            <div>
              <p className="text-sm">
                <strong>Phase 3 MVP:</strong> For testing, you can create a new
                account by entering any email and password. In production, this
                will integrate with professional registries.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
