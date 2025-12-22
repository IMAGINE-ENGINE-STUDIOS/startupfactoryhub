import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AcceleratorProfile {
  id: string;
  user_id: string;
  organization_name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  location: string | null;
  founded_year: number | null;
  total_cohorts: number;
  total_startups_supported: number;
  total_funding_raised: number;
  industries_focus: string[] | null;
  program_duration: string | null;
  equity_percentage: number | null;
  funding_offered: number | null;
  is_accepting_applications: boolean;
  created_at: string;
  updated_at: string;
}

interface Cohort {
  id: string;
  accelerator_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  max_startups: number;
  current_startups: number;
  status: string;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  focus_industries: string[] | null;
  enrollment_fee: number | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CohortApplication {
  id: string;
  cohort_id: string;
  startup_id: string;
  applicant_user_id: string;
  status: string;
  pitch_deck_url: string | null;
  video_pitch_url: string | null;
  application_answers: any;
  reviewer_notes: string | null;
  interview_date: string | null;
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  startup?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
  };
}

interface CohortStartup {
  id: string;
  cohort_id: string;
  company_id: string;
  joined_at: string;
  current_stage: string;
  progress_percentage: number;
  funding_received: number | null;
  equity_given: number | null;
  demo_day_slot: string | null;
  graduation_date: string | null;
  notes: string | null;
  is_manual_entry?: boolean;
  external_company_name?: string | null;
  external_company_industry?: string | null;
  external_company_website?: string | null;
  external_company_logo?: string | null;
  graduation_year?: number | null;
  company?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
    user_id: string;
    website: string | null;
    pitch_deck_url: string | null;
    funding_amount: number | null;
    team_size: number | null;
    founded_year: number | null;
    location: string | null;
  };
  mentor_assignments?: any[];
  advisor_assignments?: any[];
  milestones?: any[];
}

export const useAcceleratorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AcceleratorProfile | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [applications, setApplications] = useState<CohortApplication[]>([]);
  const [portfolioStartups, setPortfolioStartups] = useState<CohortStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error: profileError } = await supabase
        .from('accelerator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching accelerator profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    }
  };

  const fetchCohorts = async () => {
    if (!profile) return;

    try {
      const { data, error: cohortsError } = await supabase
        .from('accelerator_cohorts')
        .select('*')
        .eq('accelerator_id', profile.id)
        .order('created_at', { ascending: false });

      if (cohortsError) throw cohortsError;
      setCohorts(data || []);
    } catch (err) {
      console.error('Error fetching cohorts:', err);
    }
  };

  const fetchApplications = async () => {
    if (!cohorts.length) return;

    try {
      const cohortIds = cohorts.map(c => c.id);
      const { data, error: appsError } = await supabase
        .from('cohort_applications')
        .select(`
          *,
          startup:companies(id, name, description, industry, stage, logo_url)
        `)
        .in('cohort_id', cohortIds)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchPortfolio = async () => {
    if (!cohorts.length) return;

    try {
      const cohortIds = cohorts.map(c => c.id);
      const { data, error: portfolioError } = await supabase
        .from('cohort_startups')
        .select(`
          *,
          company:companies(id, name, description, industry, stage, logo_url, user_id, website, pitch_deck_url, funding_amount, team_size, founded_year, location),
          mentor_assignments:startup_mentor_assignments(*),
          advisor_assignments:startup_advisor_assignments(*),
          milestones:startup_journey_milestones(*)
        `)
        .in('cohort_id', cohortIds)
        .order('joined_at', { ascending: false });

      if (portfolioError) throw portfolioError;
      setPortfolioStartups(data || []);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    }
  };

  const updateProfile = async (updates: Partial<AcceleratorProfile>) => {
    if (!profile) return;

    try {
      const { error: updateError } = await supabase
        .from('accelerator_profiles')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) throw updateError;
      await fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const createCohort = async (cohortData: Partial<Cohort>) => {
    if (!profile) return;

    try {
      const { data, error: createError } = await supabase
        .from('accelerator_cohorts')
        .insert([{ 
          name: cohortData.name || 'New Cohort',
          accelerator_id: profile.id,
          description: cohortData.description,
          start_date: cohortData.start_date,
          end_date: cohortData.end_date,
          application_deadline: cohortData.application_deadline,
          max_startups: cohortData.max_startups,
          funding_per_startup: cohortData.funding_per_startup,
          equity_percentage: cohortData.equity_percentage,
          focus_industries: cohortData.focus_industries,
          status: cohortData.status
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Auto-create a social post announcing the cohort with application URL
      if (data && user) {
        const applicationUrl = `${window.location.origin}/cohorts/${data.id}/apply`;
        await supabase.from('feed_posts').insert({
          user_id: user.id,
          post_type: 'cohort',
          content: `🚀 ${profile.organization_name} is launching ${data.name}! Apply now to join our accelerator program.`,
          cohort_data: {
            cohort_id: data.id,
            name: data.name,
            description: data.description,
            deadline: data.application_deadline,
            funding: data.funding_per_startup,
            equity: data.equity_percentage,
            industries: data.focus_industries,
            accelerator_name: profile.organization_name,
            accelerator_logo: profile.logo_url,
            accelerator_id: profile.id,
            application_url: applicationUrl
          }
        });
      }

      await fetchCohorts();
      return data;
    } catch (err) {
      console.error('Error creating cohort:', err);
      throw err;
    }
  };

  const updateCohort = async (cohortId: string, updates: Partial<Cohort>) => {
    try {
      const { error: updateError } = await supabase
        .from('accelerator_cohorts')
        .update(updates)
        .eq('id', cohortId);

      if (updateError) throw updateError;
      await fetchCohorts();
    } catch (err) {
      console.error('Error updating cohort:', err);
      throw err;
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('cohort_applications')
        .update({
          status,
          reviewer_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;
      await fetchApplications();
    } catch (err) {
      console.error('Error updating application:', err);
      throw err;
    }
  };

  const acceptStartupToCohort = async (application: CohortApplication) => {
    if (!user || !profile) return;

    try {
      // Update application status
      await updateApplicationStatus(application.id, 'accepted');

      // Get cohort funding info
      const cohort = cohorts.find(c => c.id === application.cohort_id);
      const fundingAmount = cohort?.funding_per_startup || 0;
      const enrollmentFee = (cohort as any)?.enrollment_fee || 0;
      const equityPercentage = cohort?.equity_percentage || 0;

      // Determine payment status
      const paymentStatus = enrollmentFee > 0 ? 'pending_payment' : 'not_required';

      // Add startup to cohort
      const { data: cohortStartup, error: insertError } = await supabase
        .from('cohort_startups')
        .insert([{
          cohort_id: application.cohort_id,
          company_id: application.startup_id,
          funding_received: fundingAmount,
          equity_given: equityPercentage,
          payment_status: paymentStatus,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Sync investment to investments table if funding > 0
      if (fundingAmount > 0) {
        await supabase.from('investments').insert({
          investor_id: user.id,
          company_id: application.startup_id,
          amount: fundingAmount,
          equity_percentage: equityPercentage,
          investment_date: new Date().toISOString().split('T')[0],
          investment_round: 'accelerator',
          source: 'accelerator',
          notes: `Cohort: ${cohort?.name}`,
        });

        // Update company funding amount
        const { data: company } = await supabase
          .from('companies')
          .select('funding_amount')
          .eq('id', application.startup_id)
          .single();
        
        await supabase
          .from('companies')
          .update({ 
            funding_amount: (company?.funding_amount || 0) + fundingAmount 
          })
          .eq('id', application.startup_id);
      }

      // If enrollment fee, create Stripe payment
      if (enrollmentFee > 0 && cohortStartup) {
        // Get startup email
        const { data: startupData } = await supabase
          .from('companies')
          .select('name, user_id')
          .eq('id', application.startup_id)
          .single();
        
        const { data: startupUserProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', startupData?.user_id)
          .single();

        // Call payment edge function
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke('cohort-payment', {
          body: {
            cohortStartupId: cohortStartup.id,
            cohortId: application.cohort_id,
            startupEmail: startupUserProfile?.email || application.applicant_user_id,
            startupName: startupData?.name,
            enrollmentFee: enrollmentFee,
            acceleratorName: profile.organization_name,
          }
        });

        if (paymentError) {
          console.error('Payment creation error:', paymentError);
        } else if (paymentData?.url) {
          // Return payment URL for UI to handle
          await fetchPortfolio();
          return { paymentUrl: paymentData.url };
        }
      }

      await fetchPortfolio();
    } catch (err) {
      console.error('Error accepting startup:', err);
      throw err;
    }
  };

  const assignMentor = async (cohortStartupId: string, mentorId: string, focusArea?: string) => {
    if (!user) return;

    try {
      const { error: insertError } = await supabase
        .from('startup_mentor_assignments')
        .insert([{
          cohort_startup_id: cohortStartupId,
          mentor_id: mentorId,
          assigned_by: user.id,
          focus_area: focusArea
        }]);

      if (insertError) throw insertError;
      await fetchPortfolio();
    } catch (err) {
      console.error('Error assigning mentor:', err);
      throw err;
    }
  };

  const assignAdvisor = async (cohortStartupId: string, advisorId: string, expertiseArea?: string) => {
    if (!user) return;

    try {
      const { error: insertError } = await supabase
        .from('startup_advisor_assignments')
        .insert([{
          cohort_startup_id: cohortStartupId,
          advisor_id: advisorId,
          assigned_by: user.id,
          expertise_area: expertiseArea
        }]);

      if (insertError) throw insertError;
      await fetchPortfolio();
    } catch (err) {
      console.error('Error assigning advisor:', err);
      throw err;
    }
  };

  const addMilestone = async (cohortStartupId: string, milestone: any) => {
    try {
      const { error: insertError } = await supabase
        .from('startup_journey_milestones')
        .insert([{ ...milestone, cohort_startup_id: cohortStartupId }]);

      if (insertError) throw insertError;
      await fetchPortfolio();
    } catch (err) {
      console.error('Error adding milestone:', err);
      throw err;
    }
  };

  const updateMilestone = async (milestoneId: string, updates: any) => {
    try {
      const { error: updateError } = await supabase
        .from('startup_journey_milestones')
        .update(updates)
        .eq('id', milestoneId);

      if (updateError) throw updateError;
      await fetchPortfolio();
    } catch (err) {
      console.error('Error updating milestone:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchProfile().finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchCohorts();
    }
  }, [profile]);

  useEffect(() => {
    if (cohorts.length > 0) {
      fetchApplications();
      fetchPortfolio();
    }
  }, [cohorts]);

  return {
    profile,
    cohorts,
    applications,
    portfolioStartups,
    loading,
    error,
    updateProfile,
    createCohort,
    updateCohort,
    updateApplicationStatus,
    acceptStartupToCohort,
    assignMentor,
    assignAdvisor,
    addMilestone,
    updateMilestone,
    refetch: () => {
      fetchProfile();
      fetchCohorts();
      fetchApplications();
      fetchPortfolio();
    }
  };
};
