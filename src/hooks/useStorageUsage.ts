import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STORAGE_PLANS, StoragePlanKey, getPlanByKey } from '@/lib/storage-plans';

export interface StorageUsageData {
  totalBytesUsed: number;
  storagePlan: StoragePlanKey;
  planLimitBytes: number;
  percentUsed: number;
  isOverLimit: boolean;
  overageGb: number;
}

export const useStorageUsage = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<StorageUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from('user_storage_usage' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) { setLoading(false); return; }

      if (!data) {
        // No row yet — user has 0 usage on free plan
        setUsage({
          totalBytesUsed: 0,
          storagePlan: 'free',
          planLimitBytes: STORAGE_PLANS.free.limit_bytes,
          percentUsed: 0,
          isOverLimit: false,
          overageGb: 0,
        });
      } else {
        const d = data as any;
        const plan = getPlanByKey(d.storage_plan);
        const pct = plan.limit_bytes > 0 ? (d.total_bytes_used / plan.limit_bytes) * 100 : 0;
        const overBytes = Math.max(0, d.total_bytes_used - plan.limit_bytes);
        setUsage({
          totalBytesUsed: d.total_bytes_used,
          storagePlan: d.storage_plan as StoragePlanKey,
          planLimitBytes: plan.limit_bytes,
          percentUsed: Math.min(pct, 100),
          isOverLimit: d.total_bytes_used > plan.limit_bytes,
          overageGb: Math.ceil(overBytes / 1_073_741_824),
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  return { usage, loading, refetch: fetchUsage };
};
