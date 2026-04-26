import { useState } from 'react';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import TrendingCompanies from '@/components/TrendingCompanies';
import { TradingViewCharts } from './TradingViewCharts';
import { NationalArchivesSection } from './NationalArchivesSection';
import BayesForgeEngine from '@/components/bayesforge/BayesForgeEngine';
import { useBayesForgeState } from '@/hooks/useBayesForgeState';
import { IntelligenceSourceSelector } from './IntelligenceSourceSelector';
import { FlowPanel } from './FlowPanel';

export const IntelligenceHub = () => {
  const [activeSection, setActiveSection] = useState<string>('flow');
  const bayesForgeState = useBayesForgeState();

  const selector = (
    <IntelligenceSourceSelector
      value={activeSection}
      onValueChange={setActiveSection}
      compact
    />
  );

  // Flow has its own shell with embedded HUD; the selector is rendered inside it.
  if (activeSection === 'flow') {
    return (
      <div className="flex flex-col gap-3 w-full max-w-full min-h-[520px]">
        <BayesForgeEngine
          state={bayesForgeState}
          sourceSelector={selector}
        />
      </div>
    );
  }

  // All other sections share the unified Flow visual shell.
  const namespaceMap: Record<string, string> = {
    market: 'market',
    trending: 'trending',
    charts: 'charts',
    archives: 'archives',
  };

  const renderSection = () => {
    switch (activeSection) {
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

  return (
    <div className="flex flex-col gap-3 w-full max-w-full min-h-[520px]">
      <FlowPanel
        namespace={namespaceMap[activeSection] || activeSection}
        hudRight={selector}
      >
        {renderSection()}
      </FlowPanel>
    </div>
  );
};
