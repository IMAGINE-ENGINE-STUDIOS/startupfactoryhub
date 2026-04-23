import { useState } from 'react';
import {
  Brain,
  TrendingUp,
  BarChart3,
  Sparkles,
  LineChart,
  Landmark,
  Network as NetworkIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import TrendingCompanies from '@/components/TrendingCompanies';
import { TradingViewCharts } from './TradingViewCharts';
import { NationalArchivesSection } from './NationalArchivesSection';
import BayesForgeEngine from '@/components/bayesforge/BayesForgeEngine';
import { useBayesForgeState } from '@/hooks/useBayesForgeState';

interface IntelligenceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

const intelligenceCards: IntelligenceCard[] = [
  {
    id: 'flow',
    title: 'Flow',
    description: 'Probabilistic startup modeling & AI reasoning engine',
    icon: <NetworkIcon className="w-4 h-4" />,
    color: 'from-indigo-500 to-violet-600',
    badge: 'AI',
  },
  {
    id: 'market',
    title: 'Market Analysis',
    description: 'AI-powered insights on startups & industries',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'from-emerald-500 to-teal-500',
    badge: 'AI',
  },
  {
    id: 'charts',
    title: 'Live Market Charts',
    description: 'Real-time indices, forex, futures & bonds',
    icon: <LineChart className="w-4 h-4" />,
    color: 'from-amber-500 to-orange-500',
    badge: 'Live',
  },
  {
    id: 'trending',
    title: 'Trending Companies',
    description: 'Hot startups and market movers',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'archives',
    title: 'National Archives',
    description: 'Search millions of U.S. historical records & documents',
    icon: <Landmark className="w-4 h-4" />,
    color: 'from-violet-500 to-purple-600',
    badge: 'Live',
  },
];

export const IntelligenceHub = () => {
  const [activeSection, setActiveSection] = useState<string>('flow');
  const bayesForgeState = useBayesForgeState();

  const current = intelligenceCards.find((c) => c.id === activeSection) ?? intelligenceCards[0];

  const renderSection = () => {
    switch (activeSection) {
      case 'flow':
        return <BayesForgeEngine state={bayesForgeState} />;
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
    // Fill all available vertical space up to the parent's bounds.
    // Parent dashboard tab content provides the top boundary (the dashboard tab bar).
    <div className="flex flex-col gap-3 h-[calc(100vh-180px)] min-h-[600px]">
      {/* Compact header with inline source dropdown */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">
              Market Intelligence Hub
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              AI-powered insights from multiple data sources
            </p>
          </div>
        </div>

        {/* Source selector dropdown */}
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Source
          </span>
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="w-[240px] sm:w-[280px] h-10 bg-background/80 backdrop-blur border-border/60">
              <SelectValue>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`p-1.5 rounded-md bg-gradient-to-br ${current.color} text-white flex-shrink-0`}
                  >
                    {current.icon}
                  </div>
                  <span className="font-semibold text-sm truncate">{current.title}</span>
                  {current.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4 px-1.5 flex-shrink-0 ml-auto"
                    >
                      {current.badge}
                    </Badge>
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-[320px]">
              {intelligenceCards.map((card) => (
                <SelectItem key={card.id} value={card.id} className="py-2">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`p-1.5 rounded-md bg-gradient-to-br ${card.color} text-white flex-shrink-0`}
                    >
                      {card.icon}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{card.title}</span>
                        {card.badge && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 flex-shrink-0">
                            {card.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {card.description}
                      </p>
                    </div>
                    {activeSection === card.id && (
                      <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content fills remaining space */}
      <Card className="tech-card border-0 overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-5">
          {renderSection()}
        </div>
      </Card>
    </div>
  );
};
