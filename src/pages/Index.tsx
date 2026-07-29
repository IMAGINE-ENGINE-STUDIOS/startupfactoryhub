import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import NasdaqFeature from "@/components/NasdaqFeature";
import FeaturesSection from "@/components/FeaturesSection";
import CommunitySection from "@/components/CommunitySection";
import ResourceMapSection from "@/components/ResourceMapSection";
import AboutHero from "@/components/AboutHero";
import TeamSection from "@/components/TeamSection";
import PartnersCarousel from "@/components/PartnersCarousel";
import Footer from "@/components/Footer";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import AppDownloadSection from "@/components/AppDownloadSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <PWAInstallBanner />
      <Navigation />
      <HeroSection />
      <AboutHero />
      <FeaturesSection />
      <CommunitySection />
      <ResourceMapSection />
      <PartnersCarousel />
      {/* <TeamSection /> */}
      <AppDownloadSection />
      <NasdaqFeature />
      <Footer />
    </div>
  );
};

export default Index;
