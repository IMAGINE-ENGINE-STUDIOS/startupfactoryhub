import {
  TrendingUp,
  BarChart3,
  LineChart,
  Landmark,
  Network as NetworkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

/**
 * Glassmorphic segmented selector — matches the Flow internal tab style so
 * every Intelligence section feature is recognizable. Shows icon + title.
 */
export function IntelligenceSourceSelector({ value, onValueChange }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-background/50 backdrop-blur-xl p-1 shadow-[0_4px_24px_-8px_hsl(var(--primary)/0.4)]"
        role="tablist"
        aria-label="Intelligence sources"
      >
        {intelligenceCards.map((card) => {
          const active = value === card.id;
          return (
            <Tooltip key={card.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={card.title}
                  onClick={() => onValueChange(card.id)}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-mono uppercase tracking-[0.18em] transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-violet-500/25 to-cyan-500/25 text-foreground border border-violet-400/30 shadow-[0_0_15px_-5px_hsl(263_70%_60%)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/10 border border-transparent'
                  )}
                >
                  <span className="shrink-0">{card.icon}</span>
                  <span className="hidden md:inline whitespace-nowrap normal-case tracking-normal text-xs font-sans">
                    {card.title}
                  </span>
                  {card.badge && (
                    <span className="hidden lg:inline text-[9px] px-1 rounded bg-primary/20 text-primary uppercase tracking-wider">
                      {card.badge}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs md:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">{card.title}</span>
                  {card.badge && (
                    <span className="text-[9px] px-1 rounded bg-primary/20 text-primary uppercase tracking-wider">
                      {card.badge}
                    </span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
