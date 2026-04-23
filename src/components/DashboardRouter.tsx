import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
// Dashboard Router - Routes users to their role-specific dashboard
import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "@/pages/Dashboard";
import MentorDashboard from "@/pages/MentorDashboard";
import AdvisorDashboard from "@/pages/AdvisorDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import AcceleratorDashboard from "@/pages/AcceleratorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import MemberDashboard from "@/pages/MemberDashboard";
import { useNavigate } from "react-router-dom";

const DashboardRouter = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, error, refetch } = useUserRole();
  const navigate = useNavigate();
  const [hasCheckedRole, setHasCheckedRole] = useState(false);

  useEffect(() => {
    // Only redirect to profile-setup if:
    // 1. Auth is done loading
    // 2. User exists
    // 3. Role loading is complete
    // 4. Role is explicitly null (not just an error)
    // 5. We've actually checked (to prevent premature redirects)
    if (!authLoading && user && !roleLoading) {
      setHasCheckedRole(true);
      
      // Only redirect if role is null AND there's no error (genuine no-role state)
      // If there's an error, we'll show an error state instead of redirecting
      if (role === null && !error) {
        navigate("/profile-setup");
      }
    }
  }, [user, authLoading, role, roleLoading, error, navigate]);

  // Show loading while auth or role is loading
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

  // Guest mode - redirect to auth
  if (!user) {
    navigate("/auth");
    return null;
  }

  // If there was an error fetching the role, show error state with retry option
  if (error && !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Having trouble loading your profile...</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role (secured via user_roles table)
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
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
    case 'member':
      return <MemberDashboard />;
    case 'startup':
    default:
      return <Dashboard />;
  }
};

export default DashboardRouter;