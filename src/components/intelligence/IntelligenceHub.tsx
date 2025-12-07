import { useState } from 'react';
import { 
  Brain, 
  Newspaper, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsSection } from './NewsSection';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import TrendingCompanies from '@/components/TrendingCompanies';

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
    id: 'news',
    title: 'Live News Feed',
    description: 'Real-time news from tech, startups & finance',
    icon: <Newspaper className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Webz.io',
  },
  {
    id: 'market',
    title: 'Market Analysis',
    description: 'AI-powered insights on startups & industries',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-500',
    badge: 'AI',
  },
  {
    id: 'trending',
    title: 'Trending Companies',
    description: 'Hot startups and market movers',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
  },
];

export const IntelligenceHub = () => {
  const [activeSection, setActiveSection] = useState<string | null>('news');

  const renderSection = () => {
    switch (activeSection) {
      case 'news':
        return <NewsSection />;
      case 'market':
        return <MarketIntelligenceWidget />;
      case 'trending':
        return <TrendingCompanies />;
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

      {/* Source Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {intelligenceCards.map((card) => (
          <Card
            key={card.id}
            className={`tech-card border-0 p-4 cursor-pointer group ${
              activeSection === card.id 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : ''
            }`}
            onClick={() => setActiveSection(card.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-white`}>
                {card.icon}
              </div>
              {card.badge && (
                <Badge variant="secondary" className="text-[10px]">
                  {card.badge}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              {card.title}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
            
            {activeSection === card.id && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Active Section Content */}
      <div className="min-h-[400px]">
        {renderSection()}
      </div>
    </div>
  );
};
