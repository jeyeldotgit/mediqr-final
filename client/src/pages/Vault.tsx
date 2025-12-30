/**
 * Vault Page
 * Layout and composition only - logic extracted to hooks
 */

import { AlertTriangle } from "lucide-react";
import { useAuthGuard, useVault } from "../hooks";
import { VaultCategoryForm } from "../components/vault";
import { VAULT_CATEGORIES, type VaultCategory } from "../types";

const Vault = () => {
  const { isUnlocked } = useAuthGuard();
  const {
    vaultItems,
    formData,
    activeCategory,
    saving,
    success,
    error,
    setActiveCategory,
    handleInputChange,
    handleSubmit,
  } = useVault();

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

        {/* Category Forms */}
        <div className="space-y-4">
          {(Object.keys(VAULT_CATEGORIES) as VaultCategory[]).map(
            (category) => {
              const config = VAULT_CATEGORIES[category];
              const categoryItems = vaultItems.filter(
                (item) => item.category === category
              );

              return (
                <VaultCategoryForm
                  key={category}
                  category={category}
                  config={config}
                  isOpen={activeCategory === category}
                  isSaving={saving === category}
                  isSuccess={success === category}
                  categoryItems={categoryItems}
                  formData={formData[category]}
                  onToggle={(open) =>
                    setActiveCategory(open ? category : null)
                  }
                  onInputChange={(field, value) =>
                    handleInputChange(category, field, value)
                  }
                  onSubmit={() => handleSubmit(category)}
                />
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default Vault;
