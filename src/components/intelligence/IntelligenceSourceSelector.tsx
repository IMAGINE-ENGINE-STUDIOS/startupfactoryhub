import {
  TrendingUp,
  BarChart3,
  Sparkles,
  LineChart,
  Landmark,
  Network as NetworkIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface IntelligenceCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

export const intelligenceCards: IntelligenceCard[] = [
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

interface Props {
  value: string;
  onValueChange: (v: string) => void;
  compact?: boolean;
}

export function IntelligenceSourceSelector({ value, onValueChange, compact }: Props) {
  const current = intelligenceCards.find((c) => c.id === value) ?? intelligenceCards[0];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={
          compact
            ? 'w-[180px] sm:w-[210px] h-8 bg-background/60 backdrop-blur border-white/10 text-xs'
            : 'w-[240px] sm:w-[280px] h-10 bg-background/80 backdrop-blur border-border/60'
        }
      >
        <SelectValue>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`p-1 rounded bg-gradient-to-br ${current.color} text-white flex-shrink-0`}
            >
              {current.icon}
            </div>
            <span className="font-semibold text-xs truncate">{current.title}</span>
            {current.badge && (
              <Badge
                variant="secondary"
                className="text-[8px] h-3.5 px-1 flex-shrink-0 ml-auto"
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
                <p className="text-[10px] text-muted-foreground truncate">{card.description}</p>
              </div>
              {value === card.id && (
                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
