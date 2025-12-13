import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin';

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
  bio: string | null;
  location: string | null;
}

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalPosts: number;
  totalEvents: number;
  totalJobs: number;
  totalResources: number;
  activeUsers: number;
  userGrowthRate: number;
}

interface AdminData {
  users: UserWithProfile[];
  companies: any[];
  accelerators: any[];
  events: any[];
  jobs: any[];
  resources: any[];
  posts: any[];
  stats: PlatformStats;
  loading: boolean;
  error: Error | null;
}

export const useAdminData = () => {
  const { toast } = useToast();
  const [data, setData] = useState<AdminData>({
    users: [],
    companies: [],
    accelerators: [],
    events: [],
    jobs: [],
    resources: [],
    posts: [],
    stats: {
      totalUsers: 0,
      totalCompanies: 0,
      totalPosts: 0,
      totalEvents: 0,
      totalJobs: 0,
      totalResources: 0,
      activeUsers: 0,
      userGrowthRate: 0
    },
    loading: true,
    error: null
  });

  const fetchAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch all data in parallel
      const [
        profilesResult,
        companiesResult,
        acceleratorsResult,
        eventsResult,
        jobsResult,
        resourcesResult,
        postsResult,
        rolesResult,
        { count: activeUsersCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('companies').select('*, profiles:user_id(full_name, email)').order('created_at', { ascending: false }),
        supabase.from('accelerator_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('start_date', { ascending: false }),
        supabase.from('jobs').select('*, companies(name, logo_url)').order('created_at', { ascending: false }),
        supabase.from('resources').select('*').order('created_at', { ascending: false }),
        supabase.from('feed_posts').select('*, profiles:user_id(full_name, avatar_url)').order('created_at', { ascending: false }).limit(100),
        supabase.rpc('get_user_roles_batch', { user_ids: [] }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true)
      ]);

      // Handle errors
      if (profilesResult.error) throw profilesResult.error;
      if (companiesResult.error) throw companiesResult.error;

      // Get roles for all users
      const userIds = profilesResult.data?.map(p => p.user_id) || [];
      const { data: roles } = await supabase.rpc('get_user_roles_batch', { user_ids: userIds });
      const roleMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);

      // Map users with roles
      const usersWithRoles: UserWithProfile[] = (profilesResult.data || []).map(p => ({
        id: p.user_id,
        email: p.email || '',
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: roleMap.get(p.user_id) as AppRole || null,
        is_online: p.is_online || false,
        last_seen: p.last_seen,
        created_at: p.created_at,
        bio: p.bio,
        location: p.location
      }));

      // Calculate growth rate (mock - would need historical data)
      const totalUsers = usersWithRoles.length;
      const growthRate = 12.5; // Mock value

      setData({
        users: usersWithRoles,
        companies: companiesResult.data || [],
        accelerators: acceleratorsResult.data || [],
        events: eventsResult.data || [],
        jobs: jobsResult.data || [],
        resources: resourcesResult.data || [],
        posts: postsResult.data || [],
        stats: {
          totalUsers,
          totalCompanies: companiesResult.data?.length || 0,
          totalPosts: postsResult.data?.length || 0,
          totalEvents: eventsResult.data?.length || 0,
          totalJobs: jobsResult.data?.length || 0,
          totalResources: resourcesResult.data?.length || 0,
          activeUsers: activeUsersCount || 0,
          userGrowthRate: growthRate
        },
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch data')
      }));
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Set up real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase.channel('admin-profiles').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchAllData()
      ).subscribe(),
      
      supabase.channel('admin-companies').on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => fetchAllData()
      ).subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchAllData]);

  return {
    ...data,
    refetch: fetchAllData
  };
};

export default useAdminData;