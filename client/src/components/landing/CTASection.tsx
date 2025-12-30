/**
 * CTA Section Component
 * Call-to-action section for Landing page
 */

import { Heart, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onboarded: boolean;
  onGetStarted: () => void;
}

export const CTASection = ({ onboarded, onGetStarted }: CTASectionProps) => {
  return (
    <div className="relative py-24 bg-gradient-to-br from-primary via-primary/95 to-primary overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="mb-4 text-5xl font-bold text-white">
            Ready to Take Control of Your Health Data?
          </h2>
          <p className="mb-10 text-xl text-white/90">
            Join the future of self-sovereign health identity. Get started in
            minutes.
          </p>
          <button
            className="btn btn-lg bg-white text-primary hover:bg-base-200 border-0 shadow-xl"
            onClick={onGetStarted}
          >
            {onboarded ? "Go to Dashboard" : "Get Started Free"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

