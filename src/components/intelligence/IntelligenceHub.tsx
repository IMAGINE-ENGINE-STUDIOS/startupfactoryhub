import { useState } from 'react';
import {
  Brain,
  Newspaper,
  TrendingUp,
  BarChart3,
  Sparkles,
  ChevronRight,
  LineChart,
  Landmark,
  Search,
  Building2,
  Globe,
  Briefcase,
  Kanban,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import TrendingCompanies from '@/components/TrendingCompanies';
import { TradingViewCharts } from './TradingViewCharts';
import { NationalArchivesSection } from './NationalArchivesSection';
import CRMBoard from '@/components/CRMBoard';

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
    id: 'market',
    title: 'Market Analysis',
    description: 'AI-powered insights on startups & industries',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-500',
    badge: 'AI',
  },
  {
    id: 'charts',
    title: 'Live Market Charts',
    description: 'Real-time indices, forex, futures & bonds',
    icon: <LineChart className="w-6 h-6" />,
    color: 'from-amber-500 to-orange-500',
    badge: 'Live',
  },
  {
    id: 'trending',
    title: 'Trending Companies',
    description: 'Hot startups and market movers',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'archives',
    title: 'National Archives',
    description: 'Search millions of U.S. historical records & documents',
    icon: <Landmark className="w-6 h-6" />,
    color: 'from-violet-500 to-purple-600',
    badge: 'Live',
  },
  {
    id: 'crm',
    title: 'CRM Board',
    description: 'Manage leads, contacts, and deals',
    icon: <Kanban className="w-6 h-6" />,
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'news',
    title: 'Live News Feed',
    description: 'Real-time news from tech, startups & finance',
    icon: <Newspaper className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Coming Soon',
  },
];

export const IntelligenceHub = () => {
  const [activeSection, setActiveSection] = useState<string | null>('market');

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
      case 'news':
        return (
          <div className="tech-card border-0 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                <Newspaper className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-semibold">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                Live News Feed is coming soon! Stay tuned for real-time tech, startup & finance news powered by advanced APIs.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Market Intelligence Hub</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered insights from multiple data sources
          </p>
        </div>
      </div>

      {/* Unified Container: Source Cards + Content */}
      <Card className="tech-card border-0 overflow-hidden">
        {/* Source Cards - Horizontal scrollable strip */}
        <div className="border-b border-border/50 p-4 bg-muted/20">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {intelligenceCards.map((card) => (
              <button
                key={card.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl min-w-[200px] transition-all ${
                  activeSection === card.id 
                    ? 'bg-background shadow-md ring-1 ring-primary/30' 
                    : 'bg-background/50 hover:bg-background/80'
                }`}
                onClick={() => setActiveSection(card.id)}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white flex-shrink-0`}>
                  {card.icon}
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{card.title}</span>
                    {card.badge && (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {card.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {card.description}
                  </p>
                </div>
                {activeSection === card.id && (
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active Section Content */}
        <div className="p-4 sm:p-6 min-h-[400px]">
          {renderSection()}
        </div>
      </Card>
    </div>
  );
};
