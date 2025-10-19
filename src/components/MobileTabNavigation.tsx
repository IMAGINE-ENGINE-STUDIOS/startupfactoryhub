import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MobileTabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: Array<{
    value: string;
    icon: LucideIcon;
    label: string;
  }>;
}

export default function MobileTabNavigation({
  activeTab,
  onTabChange,
  tabs,
}: MobileTabNavigationProps) {
  const displayTabs = tabs.slice(0, 6);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-2 py-3">
        {displayTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 transition-all",
                  isActive && "scale-110"
                )} 
              />
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
