import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Home, 
  Users, 
  Building, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut,
  Search,
  Bell,
  BarChart3,
  Compass,
  Video,
  Sparkles,
  FileText,
  Brain
} from "lucide-react";
import RecommendationPopup from "./RecommendationPopup";

const DashboardNavigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [hasNewRecommendations, setHasNewRecommendations] = useState(false);

  const handleRecommendationsLoad = (count: number) => {
    if (count > 0 && count !== recommendationCount) {
      setHasNewRecommendations(true);
      setRecommendationCount(count);
      setTimeout(() => setHasNewRecommendations(false), 3000);
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
      navigate("/");
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-ocean-border sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img src={logo} alt="Startup Factory Hub" className="w-7 h-7 sm:w-8 sm:h-8 glow-effect" />
              <span className="font-bold text-base sm:text-lg hidden sm:inline">Startup Factory Hub</span>
            </div>

            {/* Navigation Links - Desktop Only */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/dashboard")}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/explore")}
              >
                <Compass className="w-4 h-4" />
                <span>Explore</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/feed")}
              >
                <Users className="w-4 h-4" />
                <span>Community</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/calendar")}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendar</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/analytics")}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytics</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/market-intelligence")}
              >
                <Sparkles className="w-4 h-4" />
                <span>Intelligence</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center space-x-2"
                onClick={() => navigate("/lightpaper")}
              >
                <FileText className="w-4 h-4" />
                <span>LightPaper</span>
              </Button>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Hidden on smallest screens */}
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Search className="w-4 h-4" />
              </Button>

              {/* AI Recommendations */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Brain className={`w-4 h-4 ${hasNewRecommendations ? 'animate-shake' : ''}`} />
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
                      Personalized suggestions for you
                    </p>
                  </div>
                  <RecommendationPopup onRecommendationsLoad={handleRecommendationsLoad} />
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.full_name || user?.email || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile-setup")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-ocean-border pb-safe">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => navigate("/feed")}
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Feed</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => navigate("/calendar")}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Calendar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => navigate("/analytics")}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Stats</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-2"
            onClick={() => navigate("/explore")}
          >
            <Compass className="w-5 h-5" />
            <span className="text-xs">More</span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardNavigation;