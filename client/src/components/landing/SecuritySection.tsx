/**
 * Security Section Component
 * Security highlights for Landing page
 */

import { FileLock, Activity } from "lucide-react";

export const SecuritySection = () => {
  return (
    <div className="py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4 text-5xl font-bold text-primary">
              Built for Security
            </h2>
            <p className="text-xl text-neutral/70">
              Your privacy is our foundation
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                  <FileLock className="w-6 h-6 text-primary-content" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  AES-256-GCM Encryption
                </h3>
                <p className="text-neutral/80">
                  Military-grade encryption ensures your data remains secure and
                  unreadable to unauthorized parties.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <Activity className="w-6 h-6 text-secondary-content" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">
                  Client-Side Encryption
                </h3>
                <p className="text-neutral/80">
                  All encryption happens in your browser. Your data never leaves
                  your device unencrypted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

