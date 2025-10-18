import { useState } from "react";
import { Home, Brain } from "lucide-react";
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
    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="neon-glow hover:scale-110 transition-transform duration-300"
        title="Home"
      >
        <Home className="h-5 w-5" />
      </Button>
      
      <NotificationCenter className="neon-glow hover:scale-110 transition-transform duration-300" />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="neon-glow hover:scale-110 transition-transform duration-300 relative"
            title="AI Recommendations"
          >
            <Brain className={`h-5 w-5 ${hasNewRecommendations ? 'animate-pulse' : ''}`} />
            {recommendationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                {recommendationCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Recommendations</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalized suggestions based on your activity
            </p>
          </div>
          <RecommendationPopup onRecommendationsLoad={handleRecommendationsLoad} />
        </PopoverContent>
      </Popover>
      
      <ThemeToggle />
    </div>
  );
}
