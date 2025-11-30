import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor';

interface ProfileWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
  role: AppRole | null;
}

export const useProfileWithRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfileWithRole = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch role using the secure function
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { _user_id: user.id });

        if (roleError) {
          console.error('Error fetching role:', roleError);
        }

        setProfile({
          ...profileData,
          role: roleData as AppRole,
        });
      } catch (err) {
        console.error('Error fetching profile with role:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfileWithRole();
  }, [user]);

  return { profile, loading, error };
};
