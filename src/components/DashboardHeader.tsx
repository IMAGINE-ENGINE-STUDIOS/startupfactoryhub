import { Home, User, HelpCircle, Calendar as CalendarIcon, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationCenter from "@/components/NotificationCenter";
import { GlobalClock } from "@/components/GlobalClock";
import WalletPasses from "@/components/WalletPasses";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import AIRecommendationsPopover from "@/components/AIRecommendationsPopover";

export function DashboardHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  // Keep tab navigation on the current dashboard route so each role's
  // profile / calendar tab opens correctly (mentor, investor, advisor, etc.)
  const basePath = location.pathname.startsWith("/") && location.pathname !== "/"
    ? location.pathname
    : "/dashboard";
  const goToTab = (tab: string) => navigate(`${basePath}?tab=${tab}`);

  // Mobile: lay icons out in two rows so all of them stay visible without
  // overlapping the profile / tabs underneath the fixed header.
  if (isMobile) {
    const iconBtnClass =
      "h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300";

    return (
      <div className="fixed top-3 right-3 z-40 flex flex-col items-end gap-1.5">
        {/* Row 1 — primary glanceable items */}
        <div className="flex items-center gap-1.5">
          <GlobalClock />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToTab("calendar")}
            className={iconBtnClass}
            title="Calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          <NotificationCenter
            data-tour="notifications-button"
            className={iconBtnClass}
          />
          <WalletPasses
            data-tour="wallet-button"
            className={iconBtnClass}
          />
        </div>

        {/* Row 2 — secondary / navigation actions */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            data-tour="help-button"
            onClick={() => window.dispatchEvent(new CustomEvent("sfh:start-tour"))}
            className={iconBtnClass}
            title="Take the tour"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <AIRecommendationsPopover className={iconBtnClass} />

          <Button
            variant="ghost"
            size="icon"
            data-tour="profile-button"
            onClick={() => goToTab("profile")}
            className={iconBtnClass}
            title={t("nav.profile")}
          >
            <User className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className={iconBtnClass}
            title={t("nav.home")}
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop: full toolbar.
  return (
    <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-1.5 sm:gap-2">
      <GlobalClock />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => goToTab("calendar")}
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
        title="Calendar"
      >
        <CalendarIcon className="h-4 w-4" />
      </Button>

      <ThemeToggle />

      {/* LightPaper document workspace */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/lightpaper")}
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
        title="LightPaper"
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        data-tour="help-button"
        onClick={() => window.dispatchEvent(new CustomEvent("sfh:start-tour"))}
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
        title="Take the tour"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <AIRecommendationsPopover />

      <WalletPasses
        data-tour="wallet-button"
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
      />

      <NotificationCenter
        data-tour="notifications-button"
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
      />

      <Button
        variant="ghost"
        size="icon"
        data-tour="profile-button"
        onClick={() => goToTab("profile")}
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
        title={t("nav.profile")}
      >
        <User className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300"
        title={t("nav.home")}
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
}
