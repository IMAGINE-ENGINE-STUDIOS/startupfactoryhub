import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Emergency = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="tech-card border-0 p-8 max-w-md text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
          <h1 className="text-xl font-semibold">Restricted Access</h1>
          <p className="text-sm text-muted-foreground">
            The Emergency Operations console is restricted to platform administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <GlobalResourcesMap emergencyMode />
    </div>
  );
};

export default Emergency;
