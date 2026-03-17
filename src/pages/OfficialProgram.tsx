import OfficialHero from '@/components/official/OfficialHero';
import OfficialMentorSection from '@/components/official/OfficialMentorSection';
import OfficialAdvisorSection from '@/components/official/OfficialAdvisorSection';
import OfficialWallet from '@/components/official/OfficialWallet';
import OfficialEarthIntel from '@/components/official/OfficialEarthIntel';
import OfficialHowItWorks from '@/components/official/OfficialHowItWorks';
import OfficialCTA from '@/components/official/OfficialCTA';

export default function OfficialProgram() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <OfficialHero />
      <OfficialMentorSection />
      <OfficialAdvisorSection />
      <OfficialWallet />
      <OfficialEarthIntel />
      <OfficialHowItWorks />
      <OfficialCTA />
      <div className="h-16" />
    </div>
  );
}
