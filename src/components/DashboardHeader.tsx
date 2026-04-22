import { useState } from "react";
import { Home, Brain, User, HelpCircle } from "lucide-react";
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
import { GlobalClock } from "@/components/GlobalClock";
import WalletPasses from "@/components/WalletPasses";
import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [hasNewRecommendations, setHasNewRecommendations] = useState(false);

  const handleRecommendationsLoad = (count: number) => {
    setRecommendationCount(count);
    if (count > 0) {
      setHasNewRecommendations(true);
      setTimeout(() => setHasNewRecommendations(false), 3000);
    }
  };

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

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            data-tour="recommendations-button"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200 relative"
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
          side="bottom"
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

      <WalletPasses className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200" />

      <div data-tour="notifications-button" className="contents">
        <NotificationCenter className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-md hover:scale-110 transition-all duration-200" />
      </div>

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
