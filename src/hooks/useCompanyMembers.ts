import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MemberSeniority = 'cofounder' | 'lead' | 'member';
export type MemberStatus = 'pending' | 'approved' | 'rejected';

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  title: string | null;
  seniority: MemberSeniority;
  status: MemberStatus;
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data:
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    description: string | null;
  } | null;
  profile?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

/** Memberships for the current user across all companies. */
export const useMyMemberships = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('company_members')
      .select(`
        *,
        company:companies(id, name, logo_url, industry, description)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setMemberships((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
    if (!user) return;
    const channel = supabase
      .channel(`my-memberships-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_members', filter: `user_id=eq.${user.id}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  return { memberships, loading, refetch };
};

/** Team rows for one company (used by founders + public team display). */
export const useCompanyTeam = (companyId: string | null | undefined, opts?: { onlyApproved?: boolean }) => {
  const [team, setTeam] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!companyId) {
      setTeam([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = supabase
      .from('company_members')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (opts?.onlyApproved) q = q.eq('status', 'approved');

    const { data, error } = await q;
    if (error || !data) {
      setTeam([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for each member separately (no FK relation)
    const userIds = [...new Set(data.map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url, bio')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const enriched = data.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) || null,
    })) as CompanyMember[];

    setTeam(enriched);
    setLoading(false);
  }, [companyId, opts?.onlyApproved]);

  useEffect(() => {
    refetch();
    if (!companyId) return;
    const channel = supabase
      .channel(`company-team-${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_members', filter: `company_id=eq.${companyId}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, refetch]);

  return { team, loading, refetch };
};

/** Mutations for team membership. */
export const useTeamMutations = () => {
  const { user } = useAuth();

  const requestJoin = async (companyId: string, title: string, message?: string) => {
    if (!user) throw new Error('Not signed in');
    const { error } = await supabase.from('company_members').insert({
      company_id: companyId,
      user_id: user.id,
      title: title || null,
      message: message || null,
      status: 'pending',
      seniority: 'member',
    });
    if (error) throw error;
  };

  const approveRequest = async (memberId: string) => {
    if (!user) throw new Error('Not signed in');
    const { error } = await supabase
      .from('company_members')
      .update({ status: 'approved', responded_at: new Date().toISOString(), responded_by: user.id })
      .eq('id', memberId);
    if (error) throw error;
  };

  const rejectRequest = async (memberId: string) => {
    if (!user) throw new Error('Not signed in');
    const { error } = await supabase
      .from('company_members')
      .update({ status: 'rejected', responded_at: new Date().toISOString(), responded_by: user.id })
      .eq('id', memberId);
    if (error) throw error;
  };

  const updateMember = async (memberId: string, patch: { title?: string; seniority?: MemberSeniority }) => {
    const { error } = await supabase.from('company_members').update(patch).eq('id', memberId);
    if (error) throw error;
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from('company_members').delete().eq('id', memberId);
    if (error) throw error;
  };

  return { requestJoin, approveRequest, rejectRequest, updateMember, removeMember };
};
