import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AcceleratorResource {
  id: string;
  accelerator_id: string;
  title: string;
  description: string | null;
  resource_type: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  promo_code: string | null;
  discount_details: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cohort_access?: { cohort_id: string; cohort_name: string }[];
}

export interface CreateResourceData {
  title: string;
  description?: string;
  resource_type: string;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  promo_code?: string;
  discount_details?: string;
  cohort_ids?: string[];
}

export const useAcceleratorPrivateResources = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<AcceleratorResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceleratorId, setAcceleratorId] = useState<string | null>(null);

  const fetchAcceleratorId = async () => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('accelerator_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    return data?.id || null;
  };

  const fetchResources = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const accId = await fetchAcceleratorId();
      if (!accId) {
        setLoading(false);
        return;
      }
      setAcceleratorId(accId);

      // Fetch resources
      const { data: resourcesData, error } = await supabase
        .from('accelerator_resources')
        .select('*')
        .eq('accelerator_id', accId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch cohort access for each resource
      const { data: accessData } = await supabase
        .from('cohort_resource_access')
        .select(`
          resource_id,
          cohort_id,
          accelerator_cohorts!inner(name)
        `)
        .in('resource_id', resourcesData?.map(r => r.id) || []);

      // Merge cohort access into resources
      const resourcesWithAccess = resourcesData?.map(resource => ({
        ...resource,
        cohort_access: accessData
          ?.filter(a => a.resource_id === resource.id)
          .map(a => ({
            cohort_id: a.cohort_id,
            cohort_name: (a.accelerator_cohorts as any)?.name || 'Unknown'
          })) || []
      })) || [];

      setResources(resourcesWithAccess);
    } catch (error) {
      console.error('Error fetching private resources:', error);
      toast.error('Failed to load private resources');
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (data: CreateResourceData) => {
    if (!acceleratorId) {
      toast.error('Accelerator profile not found');
      return false;
    }

    try {
      const { data: newResource, error } = await supabase
        .from('accelerator_resources')
        .insert({
          accelerator_id: acceleratorId,
          title: data.title,
          description: data.description,
          resource_type: data.resource_type,
          logo_url: data.logo_url,
          website_url: data.website_url,
          contact_email: data.contact_email,
          promo_code: data.promo_code,
          discount_details: data.discount_details,
        })
        .select()
        .single();

      if (error) throw error;

      // Add cohort access if specified
      if (data.cohort_ids && data.cohort_ids.length > 0) {
        const accessRecords = data.cohort_ids.map(cohort_id => ({
          resource_id: newResource.id,
          cohort_id,
          granted_by: user?.id,
        }));

        await supabase
          .from('cohort_resource_access')
          .insert(accessRecords);
      }

      toast.success('Resource created successfully');
      await fetchResources();
      return true;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to create resource');
      return false;
    }
  };

  const updateResource = async (id: string, data: Partial<CreateResourceData>) => {
    try {
      const { error } = await supabase
        .from('accelerator_resources')
        .update({
          title: data.title,
          description: data.description,
          resource_type: data.resource_type,
          logo_url: data.logo_url,
          website_url: data.website_url,
          contact_email: data.contact_email,
          promo_code: data.promo_code,
          discount_details: data.discount_details,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource updated successfully');
      await fetchResources();
      return true;
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
      return false;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('accelerator_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource deleted successfully');
      await fetchResources();
      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
      return false;
    }
  };

  const updateCohortAccess = async (resourceId: string, cohortIds: string[]) => {
    try {
      // Remove all existing access
      await supabase
        .from('cohort_resource_access')
        .delete()
        .eq('resource_id', resourceId);

      // Add new access
      if (cohortIds.length > 0) {
        const accessRecords = cohortIds.map(cohort_id => ({
          resource_id: resourceId,
          cohort_id,
          granted_by: user?.id,
        }));

        await supabase
          .from('cohort_resource_access')
          .insert(accessRecords);
      }

      toast.success('Cohort access updated');
      await fetchResources();
      return true;
    } catch (error) {
      console.error('Error updating cohort access:', error);
      toast.error('Failed to update cohort access');
      return false;
    }
  };

  useEffect(() => {
    fetchResources();
  }, [user]);

  return {
    resources,
    loading,
    acceleratorId,
    createResource,
    updateResource,
    deleteResource,
    updateCohortAccess,
    refetch: fetchResources,
  };
};
