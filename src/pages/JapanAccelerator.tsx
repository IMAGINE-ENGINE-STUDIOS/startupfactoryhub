import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JapanHero from "@/components/japan/JapanHero";
import IntroductionSection from "@/components/japan/IntroductionSection";
import ValuePropositionCards from "@/components/japan/ValuePropositionCards";
import ContentKnowledge from "@/components/japan/ContentKnowledge";
import WhyMattersPartners from "@/components/japan/WhyMattersPartners";
import WhyJapanStats from "@/components/japan/WhyJapanStats";
import PlatformFeatures from "@/components/japan/PlatformFeatures";
import PartnershipStructure from "@/components/japan/PartnershipStructure";
import StartupBenefits from "@/components/japan/StartupBenefits";
import MembershipTiers from "@/components/japan/MembershipTiers";
import SelectionCriteria from "@/components/japan/SelectionCriteria";
import PartnerBenefits from "@/components/japan/PartnerBenefits";
import CommercialTerms from "@/components/japan/CommercialTerms";
import EventsCalendar from "@/components/japan/EventsCalendar";
import PaymentTerms from "@/components/japan/PaymentTerms";
import InvestmentROI from "@/components/japan/InvestmentROI";
import OptionalAddOns from "@/components/japan/OptionalAddOns";
import NextSteps from "@/components/japan/NextSteps";
import JapanCTA from "@/components/japan/JapanCTA";

const JapanAccelerator = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />
      
      <JapanHero />
      <IntroductionSection />
      <ValuePropositionCards />
      <ContentKnowledge />
      <WhyMattersPartners />
      <WhyJapanStats />
      <PlatformFeatures />
      <PartnershipStructure />
      <StartupBenefits />
      <MembershipTiers />
      <SelectionCriteria />
      <PartnerBenefits />
      <CommercialTerms />
      <EventsCalendar />
      <PaymentTerms />
      <InvestmentROI />
      <OptionalAddOns />
      <NextSteps />
      <JapanCTA />
      
      <Footer />
    </div>
  );
};

export default JapanAccelerator;
