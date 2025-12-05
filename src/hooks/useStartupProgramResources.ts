import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProgramResource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  promo_code: string | null;
  discount_details: string | null;
  accelerator_name: string;
  accelerator_logo: string | null;
  cohort_name: string;
}

export const useStartupProgramResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<ProgramResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEnrollments, setHasEnrollments] = useState(false);

  const fetchResources = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // First get the user's company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setLoading(false);
        return;
      }

      // Get cohorts the company is enrolled in
      const { data: enrollments } = await supabase
        .from('cohort_startups')
        .select(`
          cohort_id,
          accelerator_cohorts!inner(
            id,
            name,
            accelerator_id,
            accelerator_profiles!inner(
              organization_name,
              logo_url
            )
          )
        `)
        .eq('company_id', company.id);

      if (!enrollments || enrollments.length === 0) {
        setHasEnrollments(false);
        setLoading(false);
        return;
      }

      setHasEnrollments(true);
      const cohortIds = enrollments.map(e => e.cohort_id);

      // Get resources accessible through these cohorts
      const { data: accessData } = await supabase
        .from('cohort_resource_access')
        .select(`
          cohort_id,
          accelerator_resources!inner(
            id,
            title,
            description,
            resource_type,
            logo_url,
            website_url,
            contact_email,
            promo_code,
            discount_details,
            is_active
          )
        `)
        .in('cohort_id', cohortIds);

      if (!accessData) {
        setLoading(false);
        return;
      }

      // Map resources with accelerator info
      const resourcesMap = new Map<string, ProgramResource>();

      accessData.forEach(access => {
        const resource = access.accelerator_resources as any;
        if (!resource.is_active) return;

        const enrollment = enrollments.find(e => e.cohort_id === access.cohort_id);
        const cohort = enrollment?.accelerator_cohorts as any;
        const accelerator = cohort?.accelerator_profiles;

        if (!resourcesMap.has(resource.id)) {
          resourcesMap.set(resource.id, {
            id: resource.id,
            title: resource.title,
            description: resource.description,
            resource_type: resource.resource_type,
            logo_url: resource.logo_url,
            website_url: resource.website_url,
            contact_email: resource.contact_email,
            promo_code: resource.promo_code,
            discount_details: resource.discount_details,
            accelerator_name: accelerator?.organization_name || 'Unknown',
            accelerator_logo: accelerator?.logo_url,
            cohort_name: cohort?.name || 'Unknown',
          });
        }
      });

      setResources(Array.from(resourcesMap.values()));
    } catch (error) {
      console.error('Error fetching program resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user]);

  return {
    resources,
    loading,
    hasEnrollments,
    refetch: fetchResources,
  };
};
