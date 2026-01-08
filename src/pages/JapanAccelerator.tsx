import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MatrixBackground from "@/components/MatrixBackground";
import JapanHero from "@/components/japan/JapanHero";
import ValuePropositionCards from "@/components/japan/ValuePropositionCards";
import WhyJapanStats from "@/components/japan/WhyJapanStats";
import PlatformFeatures from "@/components/japan/PlatformFeatures";
import PartnershipStructure from "@/components/japan/PartnershipStructure";
import StartupBenefits from "@/components/japan/StartupBenefits";
import MembershipTiers from "@/components/japan/MembershipTiers";
import PartnerBenefits from "@/components/japan/PartnerBenefits";
import InvestmentROI from "@/components/japan/InvestmentROI";
import EventsCalendar from "@/components/japan/EventsCalendar";
import OptionalAddOns from "@/components/japan/OptionalAddOns";
import JapanCTA from "@/components/japan/JapanCTA";

const JapanAccelerator = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      
      <JapanHero />
      <ValuePropositionCards />
      <WhyJapanStats />
      <PlatformFeatures />
      <PartnershipStructure />
      <StartupBenefits />
      <MembershipTiers />
      <PartnerBenefits />
      <InvestmentROI />
      <EventsCalendar />
      <OptionalAddOns />
      <JapanCTA />
      
      <Footer />
    </div>
  );
};

export default JapanAccelerator;
