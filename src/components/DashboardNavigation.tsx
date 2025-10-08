import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Video
} from "lucide-react";

const DashboardNavigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

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
    <nav className="bg-background/80 backdrop-blur-sm border-b border-ocean-border sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Startup Factory</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/explore")}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/feed")}
            >
              <Users className="w-4 h-4" />
              <span>Community</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/events")}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/mentoring-sessions")}
            >
              <Video className="w-4 h-4" />
              <span>Sessions</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate("/analytics")}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Button>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-ocean-primary rounded-full"></span>
            </Button>

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
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
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
  );
};

export default DashboardNavigation;