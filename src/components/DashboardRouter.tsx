import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Dashboard from "@/pages/Dashboard";
import MentorDashboard from "@/pages/MentorDashboard";
import AdvisorDashboard from "@/pages/AdvisorDashboard";
import InvestorDashboard from "@/pages/InvestorDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import FeedDashboard from "@/pages/FeedDashboard";
import { useNavigate } from "react-router-dom";

interface Profile {
  role: 'startup' | 'advisor' | 'investor' | 'student' | 'mentor';
}

const DashboardRouter = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If no profile exists, redirect to profile setup
        navigate("/profile-setup");
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
      navigate("/profile-setup");
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // Route to appropriate dashboard based on user role
  switch (profile.role) {
    case 'advisor':
      return <AdvisorDashboard />;
    case 'investor':
      return <InvestorDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'mentor':
      return <MentorDashboard />;
    case 'startup':
    default:
      return <Dashboard />;
  }
};

export default DashboardRouter;