import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import {
  syncVault,
  getVaultItems,
  type VaultCategory,
  type VaultItem,
} from "../services/vaultService";
import { getUserId, isOnboarded } from "../lib/storage";
import {
  User,
  AlertTriangle,
  Pill,
  FileText,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type Category = VaultCategory;

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: React.ReactNode; fields: string[] }
> = {
  identity: {
    label: "Identity",
    icon: <User className="w-5 h-5" />,
    fields: ["fullName", "dateOfBirth", "bloodType", "emergencyContact"],
  },
  allergies: {
    label: "Allergies",
    icon: <AlertTriangle className="w-5 h-5" />,
    fields: ["allergen", "severity", "reaction", "notes"],
  },
  medications: {
    label: "Medications",
    icon: <Pill className="w-5 h-5" />,
    fields: ["medication", "dosage", "frequency", "prescribingDoctor"],
  },
  records: {
    label: "Medical Records",
    icon: <FileText className="w-5 h-5" />,
    fields: ["condition", "diagnosisDate", "treatment", "notes"],
  },
};

export default function Vault() {
  const { isUnlocked, encryptData } = useCrypto();
  const userId = getUserId();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [saving, setSaving] = useState<Category | null>(null);
  const [success, setSuccess] = useState<Category | null>(null);
  const [error, setError] = useState<string>("");

  // Form data state
  const [formData, setFormData] = useState<
    Record<Category, Record<string, string>>
  >({
    identity: {},
    allergies: {},
    medications: {},
    records: {},
  });

  const navigate = useNavigate();

  // Redirect if locked
  useEffect(() => {
    if (!isUnlocked) {
      // If user is onboarded but locked, redirect to restore
      // Otherwise, redirect to onboarding
      if (isOnboarded()) {
        navigate("/restore");
      } else {
        navigate("/onboarding");
      }
      return;
    }
  }, [isUnlocked, navigate]);

  // Load vault items on mount
  useEffect(() => {
    if (userId && isUnlocked) {
      loadVaultItems();
    }
  }, [userId, isUnlocked]);

  const loadVaultItems = async () => {
    if (!userId) return;

    try {
      const response = await getVaultItems(userId);
      setVaultItems(response.items || []);
    } catch (err) {
      console.error("Failed to load vault items:", err);
      setError("Failed to load vault items");
    }
  };

  const handleInputChange = (
    category: Category,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (category: Category) => {
    if (!userId || !isUnlocked) {
      setError("Please unlock your vault first");
      return;
    }

    try {
      setSaving(category);
      setError("");
      setSuccess(null);

      // Get form data for this category
      const data = formData[category];

      // Convert to JSON string
      const jsonData = JSON.stringify(data);

      // Encrypt the data
      const { encrypted, iv } = await encryptData(jsonData);

      // Sync to server
      await syncVault(userId, category, encrypted, iv);

      // Clear form and show success
      setFormData((prev) => ({
        ...prev,
        [category]: {},
      }));
      setSuccess(category);

      // Reload vault items
      await loadVaultItems();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save vault item:", err);
      setError(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setSaving(null);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <div className="card bg-base-200 shadow-xl max-w-md w-full">
          <div className="card-body text-center">
            <h2 className="card-title justify-center text-primary">
              Vault Locked
            </h2>
            <p className="text-neutral/80">
              Please unlock your vault to access your medical records.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Health Vault</h1>
          <p className="text-neutral/70">
            Manage your encrypted medical information. All data is encrypted
            before being stored.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Accordion for categories */}
        <div className="space-y-4">
          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const isOpen = activeCategory === category;
            const isSaving = saving === category;
            const isSuccess = success === category;
            const categoryItems = vaultItems.filter(
              (item) => item.category === category
            );

            return (
              <div
                key={category}
                className="collapse collapse-arrow bg-base-200 shadow-lg"
              >
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) =>
                    setActiveCategory(e.target.checked ? category : null)
                  }
                />
                <div className="collapse-title text-xl font-medium flex items-center gap-3">
                  <div className="text-primary">{config.icon}</div>
                  <span>{config.label}</span>
                  {categoryItems.length > 0 && (
                    <span className="badge badge-primary badge-sm">
                      {categoryItems.length}
                    </span>
                  )}
                </div>
                <div className="collapse-content">
                  <div className="space-y-4 pt-4">
                    {/* Existing items */}
                    {categoryItems.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-neutral/70 mb-2">
                          Saved Items
                        </h3>
                        <div className="space-y-2">
                          {categoryItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-base-100 rounded-lg border border-base-300"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {config.label} Record
                                </p>
                                <p className="text-xs text-neutral/60">
                                  Updated:{" "}
                                  {new Date(
                                    item.updated_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Form */}
                    <div className="space-y-3">
                      {config.fields.map((field) => (
                        <div key={field} className="form-control">
                          <label className="label">
                            <span className="label-text capitalize">
                              {field.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered w-full"
                            value={formData[category][field] || ""}
                            onChange={(e) =>
                              handleInputChange(category, field, e.target.value)
                            }
                            placeholder={`Enter ${field
                              .replace(/([A-Z])/g, " $1")
                              .toLowerCase()}`}
                          />
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSubmit(category)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                      </div>

                      {isSuccess && (
                        <div className="alert alert-success">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Data saved successfully!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
