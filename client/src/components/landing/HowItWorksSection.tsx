/**
 * How It Works Section Component
 * Step-by-step guide for Landing page
 */

import { Key, Lock, QrCode } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Key,
    title: "Generate Your Keys",
    description:
      "Create your 12-word recovery phrase. This phrase generates your encryption keys—only you have access.",
    color: "primary",
  },
  {
    number: 2,
    icon: Lock,
    title: "Encrypt Your Data",
    description:
      "Add your medical information. Everything is encrypted client-side before it's stored. No one can read it but you.",
    color: "secondary",
  },
  {
    number: 3,
    icon: QrCode,
    title: "Share Securely",
    description:
      "Generate a QR code for emergency access. Healthcare providers can scan it to access critical information when needed.",
    color: "accent",
  },
];

export const HowItWorksSection = () => {
  return (
    <div className="py-24 bg-gradient-to-br from-secondary/5 via-base-100 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-5xl font-bold text-primary">How It Works</h2>
          <p className="text-xl text-neutral/70 max-w-2xl mx-auto">
            Simple, secure, and in your control
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center group">
              <div
                className={`absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-${step.color} flex items-center justify-center text-3xl font-bold text-${step.color}-content shadow-lg group-hover:scale-110 transition-transform`}
              >
                {step.number}
              </div>
              <div
                className={`pt-12 pb-8 px-6 rounded-2xl bg-base-200 border border-base-300 group-hover:border-${step.color}/50 transition-colors`}
              >
                <div className="mb-6 flex justify-center">
                  <div
                    className={`w-20 h-20 rounded-full bg-${step.color}/10 flex items-center justify-center group-hover:bg-${step.color}/20 transition-colors`}
                  >
                    <step.icon className={`w-10 h-10 text-${step.color}`} />
                  </div>
                </div>
                <h3 className={`mb-3 text-2xl font-semibold text-${step.color}`}>
                  {step.title}
                </h3>
                <p className="text-neutral/80 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

