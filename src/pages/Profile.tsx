import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyProfileManager from "@/components/CompanyProfileManager";
import ProfilePostsMosaic from "@/components/ProfilePostsMosaic";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <CompanyProfileManager />
        
        {user && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Posts</h3>
            <ProfilePostsMosaic userId={user.id} isOwnProfile />
          </div>
        )}
      </div>
    </div>
  );
}
