import { useNavigate } from "react-router-dom";
import { isOnboarded } from "../lib/storage";
import {
  Shield,
  Key,
  Zap,
  Users,
  Lock,
  QrCode,
  FileLock,
  Heart,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const onboarded = isOnboarded();

  const handleGetStarted = () => {
    if (onboarded) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
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
              <button
                className="btn btn-ghost"
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Features
              </button>
              <button className="btn btn-primary" onClick={handleGetStarted}>
                {onboarded ? "Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-base-100 to-secondary/10">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
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
              . Hospitals can access life-saving information via a secure QR
              scan, while your data remains end-to-end encrypted.
            </p>

            <p className="mb-10 text-lg text-neutral/60">
              Unreadable to MediQR, Supabase, or any backend component.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                className="btn btn-primary btn-lg group"
                onClick={handleGetStarted}
              >
                {onboarded ? "Go to Dashboard" : "Get Started Free"}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="btn btn-outline btn-secondary btn-lg"
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
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

      {/* Features Section */}
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
            {/* Self-Sovereign Identity */}
            <div className="group card bg-gradient-to-br from-base-200 to-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300">
              <div className="card-body">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="card-title text-primary mb-2">
                  Self-Sovereign Identity
                </h3>
                <p className="text-neutral/80">
                  Your identity and access are defined by cryptography (12-word
                  phrase), not by a central database. You own your keys.
                </p>
              </div>
            </div>

            {/* Zero-Knowledge Storage */}
            <div className="group card bg-gradient-to-br from-base-200 to-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300">
              <div className="card-body">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-content transition-colors">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="card-title text-primary mb-2">
                  Zero-Knowledge Storage
                </h3>
                <p className="text-neutral/80">
                  Servers only handle encrypted blobs and metadata, never
                  plaintext PHI. Your medical data is unreadable to MediQR,
                  Supabase, or any backend.
                </p>
              </div>
            </div>

            {/* Emergency Readiness */}
            <div className="group card bg-gradient-to-br from-base-200 to-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300">
              <div className="card-body">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-content transition-colors">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="card-title text-primary mb-2">
                  Emergency Readiness
                </h3>
                <p className="text-neutral/80">
                  QR-based access and "break-glass" workflows support real-world
                  medical emergencies. Critical information when you need it
                  most.
                </p>
              </div>
            </div>

            {/* Social Recovery */}
            <div className="group card bg-gradient-to-br from-base-200 to-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-base-300">
              <div className="card-body">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="card-title text-primary mb-2">
                  Social Recovery
                </h3>
                <p className="text-neutral/80">
                  Prevent permanent lockouts through cryptographic key sharding
                  and guardian recovery. Your trusted contacts can help restore
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gradient-to-br from-secondary/5 via-base-100 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-5xl font-bold text-primary">
              How It Works
            </h2>
            <p className="text-xl text-neutral/70 max-w-2xl mx-auto">
              Simple, secure, and in your control
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3 max-w-6xl mx-auto">
            <div className="relative text-center group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-primary-content shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="pt-12 pb-8 px-6 rounded-2xl bg-base-200 border border-base-300 group-hover:border-primary/50 transition-colors">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Key className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-primary">
                  Generate Your Keys
                </h3>
                <p className="text-neutral/80 leading-relaxed">
                  Create your 12-word recovery phrase. This phrase generates
                  your encryption keys—only you have access.
                </p>
              </div>
            </div>

            <div className="relative text-center group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold text-secondary-content shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="pt-12 pb-8 px-6 rounded-2xl bg-base-200 border border-base-300 group-hover:border-secondary/50 transition-colors">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Lock className="w-10 h-10 text-secondary" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-secondary">
                  Encrypt Your Data
                </h3>
                <p className="text-neutral/80 leading-relaxed">
                  Add your medical information. Everything is encrypted
                  client-side before it's stored. No one can read it but you.
                </p>
              </div>
            </div>

            <div className="relative text-center group">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-accent flex items-center justify-center text-3xl font-bold text-accent-content shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="pt-12 pb-8 px-6 rounded-2xl bg-base-200 border border-base-300 group-hover:border-accent/50 transition-colors">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <QrCode className="w-10 h-10 text-accent" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-accent">
                  Share Securely
                </h3>
                <p className="text-neutral/80 leading-relaxed">
                  Generate a QR code for emergency access. Healthcare providers
                  can scan it to access critical information when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Highlights */}
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
                    Military-grade encryption ensures your data remains secure
                    and unreadable to unauthorized parties.
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
                    All encryption happens in your browser. Your data never
                    leaves your device unencrypted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 bg-gradient-to-br from-primary via-primary/95 to-primary overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
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
              onClick={handleGetStarted}
            >
              {onboarded ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
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
              © 2024 MediQR. Your health data, your control.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
