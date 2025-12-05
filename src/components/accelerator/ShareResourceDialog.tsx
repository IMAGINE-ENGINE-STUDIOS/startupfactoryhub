import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAcceleratorPrivateResources, AcceleratorResource } from '@/hooks/useAcceleratorPrivateResources';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Share2 } from 'lucide-react';

interface ShareResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: AcceleratorResource | null;
}

export const ShareResourceDialog = ({
  open,
  onOpenChange,
  resource,
}: ShareResourceDialogProps) => {
  const { user } = useAuth();
  const { updateCohortAccess } = useAcceleratorPrivateResources();
  const [loading, setLoading] = useState(false);
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);

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

  useEffect(() => {
    if (resource) {
      setSelectedCohorts(resource.cohort_access?.map(a => a.cohort_id) || []);
    }
  }, [resource]);

  const toggleCohort = (cohortId: string) => {
    setSelectedCohorts(prev =>
      prev.includes(cohortId)
        ? prev.filter(id => id !== cohortId)
        : [...prev, cohortId]
    );
  };

  const selectAll = () => {
    setSelectedCohorts(cohorts.map(c => c.id));
  };

  const deselectAll = () => {
    setSelectedCohorts([]);
  };

  const handleSave = async () => {
    if (!resource) return;
    
    setLoading(true);
    try {
      await updateCohortAccess(resource.id, selectedCohorts);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-400" />
            Share Resource
          </DialogTitle>
          <DialogDescription>
            Select which cohorts can access "{resource?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedCohorts.length} of {cohorts.length} cohorts selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={selectAll}>
                Select All
              </Button>
              <Button size="sm" variant="ghost" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
            {cohorts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No cohorts available. Create a cohort first.
              </p>
            ) : (
              cohorts.map(cohort => (
                <div
                  key={cohort.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleCohort(cohort.id)}
                >
                  <Checkbox
                    id={`share-${cohort.id}`}
                    checked={selectedCohorts.includes(cohort.id)}
                    onCheckedChange={() => toggleCohort(cohort.id)}
                  />
                  <label
                    htmlFor={`share-${cohort.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {cohort.name}
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Access'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
