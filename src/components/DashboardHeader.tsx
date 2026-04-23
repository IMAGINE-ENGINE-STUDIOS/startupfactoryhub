import { Home, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "@/components/NotificationCenter";
import { GlobalClock } from "@/components/GlobalClock";
import WalletPasses from "@/components/WalletPasses";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // Mobile: lay icons out in two rows so all of them stay visible without
  // overlapping the profile / tabs underneath the fixed header.
  if (isMobile) {
    const iconBtnClass =
      "h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200";

    return (
      <div className="fixed top-3 right-3 z-40 flex flex-col items-end gap-1.5">
        {/* Row 1 — primary glanceable items */}
        <div className="flex items-center gap-1.5">
          <GlobalClock />
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

          {/* AI Recommendations are surfaced through the Genius Sphere — no button here */}

          <Button
            variant="ghost"
            size="icon"
            data-tour="profile-button"
            onClick={() => navigate("/dashboard?tab=profile")}
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

      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        data-tour="help-button"
        onClick={() => window.dispatchEvent(new CustomEvent("sfh:start-tour"))}
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200"
        title="Take the tour"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* AI Recommendations are surfaced through the Genius Sphere — no button here */}

      <WalletPasses
        data-tour="wallet-button"
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200"
      />

      <NotificationCenter
        data-tour="notifications-button"
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200"
      />

      <Button
        variant="ghost"
        size="icon"
        data-tour="profile-button"
        onClick={() => navigate("/dashboard?tab=profile")}
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200"
        title={t("nav.profile")}
      >
        <User className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200"
        title={t("nav.home")}
      >
        <Home className="h-4 w-4" />
      </Button>
    </div>
  );
}
