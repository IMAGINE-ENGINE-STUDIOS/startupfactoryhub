import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "@/pages/Dashboard";
import MentorDashboard from "@/pages/MentorDashboard";
import AdvisorDashboard from "@/pages/AdvisorDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import AcceleratorDashboard from "@/pages/AcceleratorDashboard";
import { useNavigate } from "react-router-dom";

const DashboardRouter = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, error } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && !roleLoading && (!role || error)) {
      navigate("/profile-setup");
    }
  }, [user, authLoading, role, roleLoading, error, navigate]);

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  switch (role) {
    case 'advisor':
      return <AdvisorDashboard />;
    case 'investor':
      return <InvestorDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'accelerator':
      return <AcceleratorDashboard />;
    case 'startup':
    default:
      return <Dashboard />;
  }
};

export default DashboardRouter;
