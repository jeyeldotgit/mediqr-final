/**
 * Navbar Component
 * Navigation bar for Landing page
 */

import { Heart, ArrowRight } from "lucide-react";

interface NavbarProps {
  onboarded: boolean;
  onGetStarted: () => void;
  onFeaturesClick: () => void;
}

export const Navbar = ({
  onboarded,
  onGetStarted,
  onFeaturesClick,
}: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-content">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary">MediQR</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost" onClick={onFeaturesClick}>
              Features
            </button>
            <button className="btn btn-primary" onClick={onGetStarted}>
              {onboarded ? "Dashboard" : "Get Started"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

