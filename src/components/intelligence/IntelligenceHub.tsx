import { useState } from 'react';
import { Card } from '@/components/ui/card';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import TrendingCompanies from '@/components/TrendingCompanies';
import { TradingViewCharts } from './TradingViewCharts';
import { NationalArchivesSection } from './NationalArchivesSection';
import BayesForgeEngine from '@/components/bayesforge/BayesForgeEngine';
import { useBayesForgeState } from '@/hooks/useBayesForgeState';
import { IntelligenceSourceSelector } from './IntelligenceSourceSelector';

export const IntelligenceHub = () => {
  const [activeSection, setActiveSection] = useState<string>('flow');
  const bayesForgeState = useBayesForgeState();

  const renderSection = () => {
    switch (activeSection) {
      case 'flow':
        return (
          <BayesForgeEngine
            state={bayesForgeState}
            sourceSelector={
              <IntelligenceSourceSelector
                value={activeSection}
                onValueChange={setActiveSection}
                compact
              />
            }
          />
        );
      case 'market':
        return <MarketIntelligenceWidget />;
      case 'trending':
        return <TrendingCompanies />;
      case 'charts':
        return <TradingViewCharts />;
      case 'archives':
        return <NationalArchivesSection />;
      default:
        return null;
    }
  };

  // Flow embeds the source selector in its header. Other sections get a floating one.
  const showFloatingSelector = activeSection !== 'flow';

  return (
    <div className="flex flex-col gap-3 w-full max-w-full min-h-[520px] relative">
      {showFloatingSelector && (
        <div className="absolute top-2 right-2 z-20">
          <IntelligenceSourceSelector
            value={activeSection}
            onValueChange={setActiveSection}
            compact
          />
        </div>
      )}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex-1 min-h-0 flex flex-col shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.35)]">
        <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-4">{renderSection()}</div>
      </Card>
    </div>
  );
};
