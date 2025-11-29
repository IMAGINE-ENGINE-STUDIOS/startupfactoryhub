import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import NasdaqFeature from "@/components/NasdaqFeature";
import FeaturesSection from "@/components/FeaturesSection";
import CommunitySection from "@/components/CommunitySection";
import AIAssistantPreview from "@/components/AIAssistantPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <HeroSection />
      <NasdaqFeature />
      <FeaturesSection />
      <CommunitySection />
      <AIAssistantPreview />
      <Footer />
    </div>
  );
};

export default Index;
