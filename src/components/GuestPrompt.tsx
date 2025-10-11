import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";

interface GuestPromptProps {
  feature?: string;
  description?: string;
}

export default function GuestPrompt({ 
  feature = "this feature",
  description = "Sign in to access all features and personalize your experience"
}: GuestPromptProps) {
  const navigate = useNavigate();

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Sign In to Use {feature}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button onClick={() => navigate("/auth")} className="flex-1">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <Button onClick={() => navigate("/auth")} variant="outline" className="flex-1">
          <UserPlus className="h-4 w-4 mr-2" />
          Register
        </Button>
      </CardContent>
    </Card>
  );
}
