import { useState } from "react";
import { Home, Brain, User } from "lucide-react";
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


export function DashboardHeader() {
  const navigate = useNavigate();
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
    <>
      <div className="absolute sm:fixed top-2 sm:top-4 right-2 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="neon-glow hover:scale-110 transition-transform duration-300 h-9 w-9 sm:h-10 sm:w-10"
          title="Home"
        >
          <Home className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard?tab=profile")}
          className="neon-glow hover:scale-110 transition-transform duration-300 h-9 w-9 sm:h-10 sm:w-10"
          title="Profile"
        >
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        <NotificationCenter className="neon-glow hover:scale-110 transition-transform duration-300 h-9 w-9 sm:h-10 sm:w-10" />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="neon-glow hover:scale-110 transition-transform duration-300 relative h-9 w-9 sm:h-10 sm:w-10"
              title="AI Recommendations"
            >
              <Brain className={`h-4 w-4 sm:h-5 sm:w-5 ${hasNewRecommendations ? 'animate-pulse' : ''}`} />
              {recommendationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] sm:text-[10px] flex items-center justify-center text-primary-foreground">
                  {recommendationCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] sm:w-96 p-0" align="center">
            <div className="p-3 sm:p-4 border-b">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base">AI Recommendations</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Personalized suggestions based on your activity
              </p>
            </div>
            <RecommendationPopup onRecommendationsLoad={handleRecommendationsLoad} />
          </PopoverContent>
        </Popover>
        
        
        
        <div className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}