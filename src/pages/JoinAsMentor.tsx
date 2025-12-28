import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { GraduationCap, Home, Sparkles, Users, Lightbulb } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import sfhLogo from "@/assets/sfh-logo-sphere.png";

export default function JoinAsMentor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setLoading(true);

    const { error } = await signUp(email, password, fullName, "mentor");

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to the Mentor Program! Please check your email to verify your account.");
      navigate("/auth");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <MatrixBackground />
      
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="hover-glow"
        >
          <Home className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="tech-card p-8 rounded-2xl border border-primary/20 backdrop-blur-xl bg-background/80">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={sfhLogo} 
                  alt="Startup Factory Hub" 
                  className="h-20 w-20 object-contain neon-glow"
                />
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl -z-10" />
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Mentor</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Join as a Mentor
            </h1>

            {/* Welcome Message */}
            <p className="text-center text-muted-foreground mb-8 text-sm">
              Share your expertise and guide the next generation of entrepreneurs. 
              Help startups grow and make a lasting impact.
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary/5">
                <Users className="h-5 w-5 text-emerald-400 mb-1" />
                <span className="text-xs text-muted-foreground">Connect with Startups</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary/5">
                <Lightbulb className="h-5 w-5 text-teal-400 mb-1" />
                <span className="text-xs text-muted-foreground">Share Expertise</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary/5">
                <Sparkles className="h-5 w-5 text-cyan-400 mb-1" />
                <span className="text-xs text-muted-foreground">Make Impact</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6 rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Join as Mentor
                  </div>
                )}
              </Button>
            </form>

            {/* Already have account */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
