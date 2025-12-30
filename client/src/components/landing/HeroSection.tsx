/**
 * Hero Section Component
 * Main hero section for Landing page
 */

import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

interface HeroSectionProps {
  onboarded: boolean;
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const HeroSection = ({
  onboarded,
  onGetStarted,
  onLearnMore,
}: HeroSectionProps) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-base-100 to-secondary/10">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">
              Self-Sovereign Health Identity
            </span>
          </div>

          <h1 className="mb-6 text-6xl font-bold leading-tight md:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Your Health Data,
            </span>
            <br />
            <span className="text-neutral">Your Control</span>
          </h1>

          <p className="mb-4 text-xl text-neutral/70 md:text-2xl max-w-3xl mx-auto">
            Own and control your medical data through a{" "}
            <span className="font-semibold text-primary">
              Zero-Knowledge architecture
            </span>
            . Hospitals can access life-saving information via a secure QR scan,
            while your data remains end-to-end encrypted.
          </p>

          <p className="mb-10 text-lg text-neutral/60">
            Unreadable to MediQR, Supabase, or any backend component.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              className="btn btn-primary btn-lg group"
              onClick={onGetStarted}
            >
              {onboarded ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              className="btn btn-outline btn-secondary btn-lg"
              onClick={onLearnMore}
            >
              Learn More
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-neutral/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Zero-Knowledge Architecture</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>Self-Sovereign Identity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

