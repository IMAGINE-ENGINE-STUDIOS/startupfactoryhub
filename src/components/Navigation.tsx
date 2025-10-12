import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b border-ocean-border">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src={logo} alt="Startup Factory Hub" className="w-8 h-8 sm:w-10 sm:h-10 glow-effect" />
            <span className="text-base sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Startup Factory Hub
            </span>
          </div>
          
          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Button variant="hero" size="lg" onClick={async () => {
                await signOut();
                navigate("/");
              }}>Sign Out</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button variant="hero" size="lg" onClick={() => navigate("/auth")}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Right Side */}
          <div className="flex md:hidden items-center space-x-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {user ? (
                    <Button 
                      variant="hero" 
                      className="w-full"
                      onClick={async () => {
                        await signOut();
                        navigate("/");
                        closeMenu();
                      }}
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          navigate("/auth");
                          closeMenu();
                        }}
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="hero" 
                        className="w-full"
                        onClick={() => {
                          navigate("/auth");
                          closeMenu();
                        }}
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
