import { useState, useEffect, useRef } from "react";
import { Home, Brain, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "@/components/NotificationCenter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RecommendationPopup from "@/components/RecommendationPopup";
import { StartupPerksButton } from "@/components/StartupPerksButton";
import { GlobalClock } from "@/components/GlobalClock";
import WalletPasses from "@/components/WalletPasses";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import sfhLogo from "@/assets/sfh-logo-sphere.png";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [hasNewRecommendations, setHasNewRecommendations] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRecommendationsLoad = (count: number) => {
    setRecommendationCount(count);
    if (count > 0) {
      setHasNewRecommendations(true);
      setTimeout(() => setHasNewRecommendations(false), 3000);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isExpanded) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isExpanded]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // The action items that will fan out from the sphere
  const actionItems = [
    {
      key: "theme",
      render: () => (
        <div className="h-10 w-10 flex items-center justify-center">
          <ThemeToggle />
        </div>
      ),
    },
    {
      key: "language",
      render: () => <LanguageSwitcher />,
    },
    {
      key: "perks",
      render: () => <StartupPerksButton />,
    },
    {
      key: "recommendations",
      render: () => (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:scale-110 transition-all duration-200 relative"
              title={t("header.recommendations")}
            >
              <Brain className={`h-4 w-4 ${hasNewRecommendations ? "animate-pulse" : ""}`} />
              {recommendationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] flex items-center justify-center text-primary-foreground">
                  {recommendationCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[calc(100vw-2rem)] sm:w-96 p-0 bg-background border-border backdrop-blur-none"
            align="end"
            side="left"
          >
            <div className="p-3 sm:p-4 border-b">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base">{t("header.recommendations")}</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("header.recommendations.desc")}</p>
            </div>
            <RecommendationPopup onRecommendationsLoad={handleRecommendationsLoad} />
          </PopoverContent>
        </Popover>
      ),
    },
    {
      key: "wallet",
      render: () => (
        <WalletPasses className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:scale-110 transition-all duration-200" />
      ),
    },
    {
      key: "notifications",
      render: () => (
        <NotificationCenter className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:scale-110 transition-all duration-200" />
      ),
    },
    {
      key: "profile",
      render: () => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            navigate("/dashboard?tab=profile");
            setIsExpanded(false);
          }}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:scale-110 transition-all duration-200"
          title={t("nav.profile")}
        >
          <User className="h-4 w-4" />
        </Button>
      ),
    },
    {
      key: "home",
      render: () => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            navigate("/");
            setIsExpanded(false);
          }}
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:scale-110 transition-all duration-200"
          title={t("nav.home")}
        >
          <Home className="h-4 w-4" />
        </Button>
      ),
    },
    {
      key: "clock",
      render: () => <GlobalClock />,
    },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40" style={{ pointerEvents: 'auto' }}>
      {/* Fan-out items — positioned above the sphere, going upward */}
      {/* Desktop: vertical column going up. Mobile: horizontal row going left */}
      <div
        className={cn(
          "absolute flex gap-2 transition-all duration-500 ease-out",
          // Mobile: horizontal row going left from the sphere
          "flex-row-reverse bottom-0 right-[calc(100%+0.75rem)]",
          "sm:flex-col-reverse sm:bottom-[calc(100%+0.75rem)] sm:right-0 sm:left-auto",
          isExpanded
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        style={{
          // Mobile: horizontal scrollable
        }}
      >
        {/* Mobile: wrap in scrollable container */}
        <div className={cn(
          "flex gap-2",
          "flex-row-reverse sm:flex-col-reverse",
          "items-center",
          // On mobile, allow horizontal scroll if too many items
          "max-w-[calc(100vw-6rem)] sm:max-w-none overflow-x-auto sm:overflow-visible scrollbar-hide",
          "sm:max-h-[calc(100vh-10rem)] sm:overflow-y-auto sm:scrollbar-hide"
        )}>
          {actionItems.map((item, index) => (
            <div
              key={item.key}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                isExpanded
                  ? "translate-y-0 sm:translate-y-0 translate-x-0 opacity-100 scale-100"
                  : "sm:translate-y-8 translate-x-8 sm:translate-x-0 opacity-0 scale-75"
              )}
              style={{
                transitionDelay: isExpanded ? `${index * 40}ms` : `${(actionItems.length - index) * 20}ms`,
              }}
            >
              {item.render()}
            </div>
          ))}
        </div>
      </div>

      {/* Main sphere trigger — sits above the Genius orb (which is at bottom-4 right-4 too but with z-50) */}
      {/* We offset upward by placing this 64px above the Genius AI orb */}
      <div className="relative" style={{ marginBottom: '4rem' }}>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "h-11 w-11 sm:h-12 sm:w-12 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 p-0 overflow-hidden border-2",
            isExpanded
              ? "bg-background border-primary/50 hover:bg-accent scale-110 rotate-180"
              : "bg-gradient-to-br from-background to-accent border-border/50 hover:scale-110"
          )}
          size="icon"
          title="Quick Actions"
        >
          {isExpanded ? (
            <X className="h-5 w-5 text-foreground transition-transform duration-300" />
          ) : (
            <img
              src={sfhLogo}
              alt="Quick Actions"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover"
            />
          )}
        </Button>

        {/* Pulse ring when collapsed */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
        )}
      </div>
    </div>
  );
}
