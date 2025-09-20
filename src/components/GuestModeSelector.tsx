import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building2, GraduationCap, TrendingUp, Users, BookOpen } from "lucide-react";

const GuestModeSelector = () => {
  const { setGuestMode } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    setGuestMode(role);
    navigate("/dashboard");
  };

  const roles = [
    {
      id: "startup",
      title: "Startup Founder",
      description: "Access startup roadmap, resources, and connect with mentors and investors",
      icon: Building2,
      color: "text-blue-500"
    },
    {
      id: "student",
      title: "Student",
      description: "Access educational materials and internship opportunities",
      icon: GraduationCap,
      color: "text-green-500"
    },
    {
      id: "investor",
      title: "Investor",
      description: "Discover startups, view company profiles, and investment opportunities",
      icon: TrendingUp,
      color: "text-purple-500"
    },
    {
      id: "mentor",
      title: "Mentor/Advisor",
      description: "Connect with startups, share expertise, and post professional background",
      icon: Users,
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Explore as Guest</h1>
          <p className="text-muted-foreground text-lg">
            Choose your role to explore the platform features without signing up
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="text-center">
                  <Icon className={`w-12 h-12 mx-auto mb-2 ${role.color} group-hover:scale-110 transition-transform`} />
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleRoleSelect(role.id)}
                    className="w-full"
                    variant="hero"
                  >
                    Explore as {role.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Want to save your progress and access all features?
          </p>
          <Button variant="outline" onClick={() => navigate("/auth")}>
            Sign Up for Full Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestModeSelector;