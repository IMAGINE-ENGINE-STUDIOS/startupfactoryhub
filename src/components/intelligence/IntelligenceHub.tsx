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

  // For non-Flow sections we still need a way to switch sources. Show a small floating selector.
  const showFloatingSelector = activeSection !== 'flow';

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-180px)] min-h-[600px] relative">
      {showFloatingSelector && (
        <div className="absolute top-2 right-2 z-20">
          <IntelligenceSourceSelector
            value={activeSection}
            onValueChange={setActiveSection}
            compact
          />
        </div>
      )}
      <Card className="tech-card border-0 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-5">{renderSection()}</div>
      </Card>
    </div>
  );
};
