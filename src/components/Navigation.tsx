import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";
import GlobalSearch from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
const Navigation = () => {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuth();
  return <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-ocean-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Startup Factory Hub" className="w-10 h-10 glow-effect" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Startup Factory Hub
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <button onClick={() => navigate("/feed")} className="text-muted-foreground hover:text-foreground transition-colors">
              Community
            </button>
            <button onClick={() => navigate("/events")} className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </button>
            <a href="#resources" className="text-muted-foreground hover:text-foreground transition-colors">
              Resources
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <GlobalSearch />
                <NotificationCenter />
              </>
            )}
            <ThemeToggle />
            {user ? <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>Dashboard</Button>
                <Button variant="hero" size="lg" onClick={async () => {
              await signOut();
              navigate("/");
            }}>Sign Out</Button>
              </> : <>
                
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>Get Started</Button>
              </>}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navigation;