import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const navigate = useNavigate();

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
      <ThemeToggle />
    </div>
  );
}
