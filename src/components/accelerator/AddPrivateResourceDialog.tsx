import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAcceleratorPrivateResources, AcceleratorResource } from '@/hooks/useAcceleratorPrivateResources';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddPrivateResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editResource?: AcceleratorResource | null;
}

const resourceTypes = [
  { value: 'perk', label: 'Perk / Discount' },
  { value: 'tool', label: 'Tool / Software' },
  { value: 'service', label: 'Service' },
  { value: 'credit', label: 'Credits / Funds' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'other', label: 'Other' },
];

export const AddPrivateResourceDialog = ({
  open,
  onOpenChange,
  editResource,
}: AddPrivateResourceDialogProps) => {
  const { user } = useAuth();
  const { createResource, updateResource } = useAcceleratorPrivateResources();
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: 'perk',
    logo_url: '',
    website_url: '',
    contact_email: '',
    promo_code: '',
    discount_details: '',
    cohort_ids: [] as string[],
  });

  useEffect(() => {
    if (editResource) {
      setFormData({
        title: editResource.title,
        description: editResource.description || '',
        resource_type: editResource.resource_type,
        logo_url: editResource.logo_url || '',
        website_url: editResource.website_url || '',
        contact_email: editResource.contact_email || '',
        promo_code: editResource.promo_code || '',
        discount_details: editResource.discount_details || '',
        cohort_ids: editResource.cohort_access?.map(a => a.cohort_id) || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        resource_type: 'perk',
        logo_url: '',
        website_url: '',
        contact_email: '',
        promo_code: '',
        discount_details: '',
        cohort_ids: [],
      });
    }
  }, [editResource, open]);

  useEffect(() => {
    const fetchCohorts = async () => {
      if (!user) return;
      
      const { data: accProfile } = await supabase
        .from('accelerator_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (accProfile) {
        const { data: cohortsData } = await supabase
          .from('accelerator_cohorts')
          .select('id, name')
          .eq('accelerator_id', accProfile.id)
          .order('created_at', { ascending: false });

        setCohorts(cohortsData || []);
      }
    };

    if (open) {
      fetchCohorts();
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editResource) {
        await updateResource(editResource.id, formData);
      } else {
        await createResource(formData);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleCohort = (cohortId: string) => {
    setFormData(prev => ({
      ...prev,
      cohort_ids: prev.cohort_ids.includes(cohortId)
        ? prev.cohort_ids.filter(id => id !== cohortId)
        : [...prev.cohort_ids, cohortId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editResource ? 'Edit Resource' : 'Add Private Resource'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., AWS Activate Credits"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this resource offers..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource_type">Type</Label>
              <Select
                value={formData.resource_type}
                onValueChange={value => setFormData(prev => ({ ...prev, resource_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo_code">Promo Code</Label>
              <Input
                id="promo_code"
                value={formData.promo_code}
                onChange={e => setFormData(prev => ({ ...prev, promo_code: e.target.value }))}
                placeholder="ACCEL2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_details">Discount Details</Label>
            <Input
              id="discount_details"
              value={formData.discount_details}
              onChange={e => setFormData(prev => ({ ...prev, discount_details: e.target.value }))}
              placeholder="e.g., $10,000 in credits for 12 months"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={e => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={e => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={e => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="partner@company.com"
            />
          </div>

          {/* Cohort Selection */}
          <div className="space-y-2">
            <Label>Share with Cohorts</Label>
            <div className="border border-border rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
              {cohorts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cohorts available</p>
              ) : (
                cohorts.map(cohort => (
                  <div key={cohort.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={cohort.id}
                      checked={formData.cohort_ids.includes(cohort.id)}
                      onCheckedChange={() => toggleCohort(cohort.id)}
                    />
                    <label
                      htmlFor={cohort.id}
                      className="text-sm cursor-pointer"
                    >
                      {cohort.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? 'Saving...' : editResource ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
