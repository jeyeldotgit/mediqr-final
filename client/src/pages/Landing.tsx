/**
 * Landing Page
 * Layout and composition only - components split into smaller files
 */

import { useNavigate } from "react-router-dom";
import { useCrypto } from "../contexts/CryptoProvider";
import { isOnboarded } from "../lib/storage";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  SecuritySection,
  CTASection,
  Footer,
} from "../components/landing";

const Landing = () => {
  const navigate = useNavigate();
  const { isUnlocked } = useCrypto();
  const onboarded = isOnboarded();

  const handleGetStarted = () => {
    if (onboarded) {
      navigate(isUnlocked ? "/dashboard" : "/restore");
    } else {
      navigate("/onboarding");
    }
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar
        onboarded={onboarded}
        onGetStarted={handleGetStarted}
        onFeaturesClick={scrollToFeatures}
      />
      <HeroSection
        onboarded={onboarded}
        onGetStarted={handleGetStarted}
        onLearnMore={scrollToFeatures}
      />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <CTASection onboarded={onboarded} onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
};

export default Landing;
