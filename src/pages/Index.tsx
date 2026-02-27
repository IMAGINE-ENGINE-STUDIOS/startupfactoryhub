import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import NasdaqFeature from "@/components/NasdaqFeature";
import FeaturesSection from "@/components/FeaturesSection";
import CommunitySection from "@/components/CommunitySection";
import AIAssistantPreview from "@/components/AIAssistantPreview";
import AboutHero from "@/components/AboutHero";
import TeamSection from "@/components/TeamSection";
import PartnersCarousel from "@/components/PartnersCarousel";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutHero />
      <FeaturesSection />
      <CommunitySection />
      <AIAssistantPreview />
      <PartnersCarousel />
      {/* <TeamSection /> */}
      <NasdaqFeature />
      <Footer />
    </div>
  );
};

export default Index;
