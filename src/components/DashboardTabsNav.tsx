import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, type LucideIcon } from 'lucide-react';

export interface DashboardTabItem {
  value: string;
  icon: LucideIcon;
  label: string;
  dataTour?: string;
  badge?: number | string;
}

interface DashboardTabsNavProps {
  items: DashboardTabItem[];
  /** Adds the Profile tab pinned to the far right (default on). */
  showProfile?: boolean;
}

const triggerClass = "relative group flex-col items-center justify-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-transparent text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--primary)/0.15)]";

/**
 * Unified glassmorphic tab navigation used across every role's dashboard.
 * Frosted, low-contrast, subtle primary glow on the active item.
 */
export function DashboardTabsNav({ items, showProfile = true }: DashboardTabsNavProps) {
  const all = showProfile && !items.some(i => i.value === 'profile')
    ? [...items, { value: 'profile', icon: User, label: 'Profile', dataTour: 'profile-button', pinRight: true }]
    : items;
  return (
    <div className="relative" data-tour="main-tabs">
      <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0 relative z-10">
        <TabsList className="relative flex w-full whitespace-nowrap items-center gap-1 p-1.5 h-auto bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {all.map(({ value, icon: Icon, label, dataTour, badge, pinRight }: DashboardTabItem & { pinRight?: boolean }) => (
            <TabsTrigger
              key={value}
              value={value}
              data-tour={dataTour}
              className={`${triggerClass} ${pinRight ? 'ml-auto' : ''}`}
            >
              <Icon
                className="h-[18px] w-[18px] transition-all duration-300 group-data-[state=active]:drop-shadow-[0_0_8px_hsl(var(--primary))]"
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
              <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent rounded-full opacity-0 transition-opacity duration-300 group-data-[state=active]:opacity-100" />
            </TabsTrigger>
          ))}

        </TabsList>
      </div>
    </div>
  );
}

export default DashboardTabsNav;
