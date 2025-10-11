import { useAuth } from '@/contexts/AuthContext';
import DashboardNavigation from '@/components/DashboardNavigation';
import MessagingInterface from '@/components/MessagingInterface';
import GuestPrompt from '@/components/GuestPrompt';

export default function Messages() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <div className="container mx-auto px-4 py-6">
          <GuestPrompt 
            feature="Messaging"
            description="Sign in to connect and chat with mentors, investors, and fellow entrepreneurs."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-6">
        <MessagingInterface />
      </div>
    </div>
  );
}
