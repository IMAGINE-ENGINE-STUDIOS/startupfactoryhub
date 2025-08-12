import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import CommunitySection from "@/components/CommunitySection";
import AIAssistantPreview from "@/components/AIAssistantPreview";
import PartnersCarousel from "@/components/PartnersCarousel";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <PartnersCarousel />
      <CommunitySection />
      <AIAssistantPreview />
      <Footer />
    </div>
  );
};

export default Index;
