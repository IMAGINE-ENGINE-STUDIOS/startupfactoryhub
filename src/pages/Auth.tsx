import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Mail, Lock, User, Building, GraduationCap, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement Supabase signup
    setTimeout(() => {
      setIsLoading(false);
      if (userRole === "startup") {
        navigate("/profile-setup");
      } else {
        navigate("/mentor-setup");
      }
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement Supabase login and check user role
    setTimeout(() => {
      setIsLoading(false);
      // For demo purposes, navigate based on userRole or default to startup dashboard
      navigate("/dashboard");
    }, 1000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "startup": return <Rocket className="w-5 h-5" />;
      case "mentor": return <Users className="w-5 h-5" />;
      case "investor": return <DollarSign className="w-5 h-5" />;
      case "student": return <GraduationCap className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Join Startup Factory</h1>
          <p className="text-muted-foreground mt-2">Connect with mentors, investors, and fellow founders</p>
        </div>

        <Card className="glass-morphism border-ocean-border">
          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>

            <TabsContent value="signup">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription>Start your startup journey today</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="userRole">I am a...</Label>
                    <Select value={userRole} onValueChange={setUserRole}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="startup">
                          <div className="flex items-center space-x-2">
                            <Rocket className="w-4 h-4" />
                            <span>Startup Founder</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="mentor">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>Mentor/Advisor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="investor">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>Investor</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="student">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>Student/Intern</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" placeholder="John" className="pl-10" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="lastName" placeholder="Doe" className="pl-10" required />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="john@example.com" className="pl-10" required />
                    </div>
                  </div>
                  
                  {userRole === "startup" && (
                    <div>
                      <Label htmlFor="company">Company Name</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="company" placeholder="Your Startup" className="pl-10" required />
                      </div>
                    </div>
                  )}
                  
                  {userRole === "mentor" && (
                    <div>
                      <Label htmlFor="currentCompany">Current Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="currentCompany" placeholder="Ex-Google, Current Advisor" className="pl-10" />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="password" type="password" placeholder="••••••••" className="pl-10" required />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" variant="hero" disabled={isLoading || !userRole}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="login">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="loginEmail" type="email" placeholder="john@example.com" className="pl-10" required />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="loginPassword" type="password" placeholder="••••••••" className="pl-10" required />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;