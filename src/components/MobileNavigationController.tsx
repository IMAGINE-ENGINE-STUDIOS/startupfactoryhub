import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Menu,
  MessageCircle,
  Network,
  Map,
  Calendar,
  UserCircle,
  Briefcase,
  GraduationCap,
  BarChart,
  Brain,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  value: string;
  label: string;
  icon: any;
  description: string;
}

const navigationItems: NavigationItem[] = [
  { value: "social", label: "Social", icon: MessageCircle, description: "Community feed & posts" },
  { value: "network", label: "Network", icon: Network, description: "Connect with others" },
  { value: "journey", label: "Journey", icon: Map, description: "Your startup roadmap" },
  { value: "calendar", label: "Calendar", icon: Calendar, description: "Events & sessions" },
  { value: "profile", label: "Profile", icon: UserCircle, description: "Manage your profile" },
  { value: "jobs", label: "Jobs", icon: Briefcase, description: "Browse opportunities" },
  { value: "learn", label: "Learn", icon: GraduationCap, description: "Educational resources" },
  { value: "analytics", label: "Analytics", icon: BarChart, description: "Track your progress" },
  { value: "intelligence", label: "Intelligence", icon: Brain, description: "Market insights" },
  { value: "tools", label: "Tools", icon: Wrench, description: "AI-powered tools" },
];

interface MobileNavigationControllerProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function MobileNavigationController({
  activeTab,
  onTabChange,
}: MobileNavigationControllerProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (value: string) => {
    onTabChange(value);
    setOpen(false);
  };

  const activeItem = navigationItems.find((item) => item.value === activeTab);
  const ActiveIcon = activeItem?.icon || Menu;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Current Section Indicator */}
        <div className="flex items-center gap-2 flex-1">
          <ActiveIcon className="h-5 w-5 text-primary" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{activeItem?.label || "Dashboard"}</span>
            <span className="text-xs text-muted-foreground truncate">{activeItem?.description}</span>
          </div>
        </div>

        {/* Navigation Menu Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Dashboard Navigation</h2>
                <p className="text-sm text-muted-foreground">Select a section to navigate</p>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;

                    return (
                      <button
                        key={item.value}
                        onClick={() => handleNavigate(item.value)}
                        className={cn(
                          "w-full flex items-start gap-4 p-4 rounded-lg border transition-all",
                          isActive
                            ? "bg-primary/10 border-primary shadow-sm"
                            : "bg-background border-border hover:bg-muted"
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                            isActive
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className={cn(
                            "font-semibold mb-1",
                            isActive ? "text-primary" : "text-foreground"
                          )}>
                            {item.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
