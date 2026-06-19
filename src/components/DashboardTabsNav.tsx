import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

export interface DashboardTabItem {
  value: string;
  icon: LucideIcon;
  label: string;
  dataTour?: string;
  badge?: number | string;
}

interface DashboardTabsNavProps {
  items: DashboardTabItem[];
}


/**
 * Unified "Luminous HUD Glass Control Deck" tab navigation
 * used across every role's dashboard for a consistent modern look.
 */
export function DashboardTabsNav({ items }: DashboardTabsNavProps) {
  return (
    <div className="relative" data-tour="main-tabs">
      <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0 relative z-10">
        <TabsList className="relative flex w-full whitespace-nowrap items-center gap-1 p-1.5 h-auto bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--neon-green)_/_0.25)] rounded-2xl shadow-[0_0_40px_hsl(var(--neon-green)_/_0.12),0_0_80px_hsl(var(--neon-green)_/_0.06),inset_0_0_30px_hsl(var(--neon-green)_/_0.04),var(--shadow-card)]">
          {items.map(({ value, icon: Icon, label, dataTour, badge }) => (
            <TabsTrigger
              key={value}
              value={value}
              data-tour={dataTour}
              className="relative group flex-col items-center justify-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-transparent text-muted-foreground transition-all duration-500 hover:text-foreground hover:bg-primary/10 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]"
            >
              <Icon
                className="h-[18px] w-[18px] transition-all duration-300 group-data-[state=active]:drop-shadow-[0_0_10px_hsl(var(--neon-green))]"
                strokeWidth={1.5}
              />
              <span className="text-[10px] sm:text-[11px] font-medium tracking-[0.15em] uppercase leading-none">
                {label}
              </span>
              {badge !== undefined && badge !== 0 && badge !== '' && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-emerald-500">
                  {badge}
                </Badge>
              )}
              <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--neon-green))] to-transparent rounded-full shadow-[0_0_12px_hsl(var(--neon-green))] opacity-0 transition-opacity duration-500 group-data-[state=active]:opacity-100" />
            </TabsTrigger>
          ))}

        </TabsList>
      </div>
    </div>
  );
}

export default DashboardTabsNav;
