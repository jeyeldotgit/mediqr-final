/**
 * Footer Component
 * Footer for Landing page
 */

import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-neutral text-neutral-content py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-content">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold">MediQR</span>
          </div>
          <p className="text-sm opacity-80 text-center">
            © 2026 MediQR. Your health data, your control.
          </p>
        </div>
      </div>
    </footer>
  );
};

