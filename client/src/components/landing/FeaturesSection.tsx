/**
 * Features Section Component
 * Feature cards for Landing page
 */

import { Key, Shield, Zap, Users } from "lucide-react";

const features = [
  {
    icon: Key,
    title: "Self-Sovereign Identity",
    description:
      "Your identity and access are defined by cryptography (12-word phrase), not by a central database. You own your keys.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Storage",
    description:
      "Servers only handle encrypted blobs and metadata, never plaintext PHI. Your medical data is unreadable to MediQR, Supabase, or any backend.",
    color: "secondary",
  },
  {
    icon: Zap,
    title: "Emergency Readiness",
    description:
      'QR-based access and "break-glass" workflows support real-world medical emergencies. Critical information when you need it most.',
    color: "accent",
  },
  {
    icon: Users,
    title: "Social Recovery",
    description:
      "Prevent permanent lockouts through cryptographic key sharding and guardian recovery. Your trusted contacts can help restore access.",
    color: "primary",
  },
];

export const FeaturesSection = () => {
  return (
    <div id="features" className="py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-5xl font-bold text-primary">
            Why Choose MediQR?
          </h2>
          <p className="text-xl text-neutral/70 max-w-2xl mx-auto">
            Built on principles of privacy, security, and user sovereignty
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group card bg-gradient-to-br from-base-200 to-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300"
            >
              <div className="card-body">
                <div
                  className={`mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${feature.color}/10 text-${feature.color} group-hover:bg-${feature.color} group-hover:text-${feature.color}-content transition-colors`}
                >
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="card-title text-primary mb-2">{feature.title}</h3>
                <p className="text-neutral/80">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

