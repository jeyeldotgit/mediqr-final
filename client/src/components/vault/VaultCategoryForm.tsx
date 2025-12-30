/**
 * Vault Category Form Component
 * Form for a single vault category
 */

import {
  User,
  AlertTriangle,
  Pill,
  FileText,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { VaultCategory, VaultItem, CategoryConfig } from "../../types";

interface VaultCategoryFormProps {
  category: VaultCategory;
  config: CategoryConfig;
  isOpen: boolean;
  isSaving: boolean;
  isSuccess: boolean;
  categoryItems: VaultItem[];
  formData: Record<string, string>;
  onToggle: (open: boolean) => void;
  onInputChange: (field: string, value: string) => void;
  onSubmit: () => void;
}

const CategoryIcons: Record<VaultCategory, React.ReactNode> = {
  identity: <User className="w-5 h-5" />,
  allergies: <AlertTriangle className="w-5 h-5" />,
  medications: <Pill className="w-5 h-5" />,
  records: <FileText className="w-5 h-5" />,
};

export const VaultCategoryForm = ({
  category,
  config,
  isOpen,
  isSaving,
  isSuccess,
  categoryItems,
  formData,
  onToggle,
  onInputChange,
  onSubmit,
}: VaultCategoryFormProps) => {
  return (
    <div className="collapse collapse-arrow bg-base-200 shadow-lg">
      <input
        type="checkbox"
        checked={isOpen}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <div className="collapse-title text-xl font-medium flex items-center gap-3">
        <div className="text-primary">{CategoryIcons[category]}</div>
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
                      <p className="text-sm font-medium">{config.label} Record</p>
                      <p className="text-xs text-neutral/60">
                        Updated: {new Date(item.updated_at).toLocaleDateString()}
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
                  value={formData[field] || ""}
                  onChange={(e) => onInputChange(field, e.target.value)}
                  placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                />
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="btn btn-primary"
                onClick={onSubmit}
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
};

