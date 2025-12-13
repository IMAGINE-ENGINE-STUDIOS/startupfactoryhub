import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ApiUsageLog {
  id: string;
  service_name: string;
  endpoint: string | null;
  request_count: number | null;
  tokens_used: number | null;
  estimated_cost: number | null;
  created_at: string;
  metadata: any;
}

interface ServiceUsage {
  service: string;
  requests: number;
  tokens: number;
  cost: number;
  remaining?: number;
}

interface MonthlyUsage {
  month: string;
  cost: number;
  requests: number;
}

interface UseApiUsageReturn {
  logs: ApiUsageLog[];
  serviceUsage: ServiceUsage[];
  monthlyUsage: MonthlyUsage[];
  totalCost: number;
  totalRequests: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SERVICE_COSTS: Record<string, { perRequest?: number; perToken?: number }> = {
  whereby: { perRequest: 0.10 },
  webzio: { perRequest: 0.01 },
  gemini: { perToken: 0.0001 },
  resend: { perRequest: 0.001 }
};

export const useApiUsage = (): UseApiUsageReturn => {
  const [logs, setLogs] = useState<ApiUsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (fetchError) throw fetchError;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching API usage:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch API usage'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Calculate service usage
  const serviceUsage: ServiceUsage[] = ['whereby', 'webzio', 'gemini', 'resend'].map(service => {
    const serviceLogs = logs.filter(log => log.service_name.toLowerCase() === service);
    const requests = serviceLogs.reduce((sum, log) => sum + (log.request_count || 1), 0);
    const tokens = serviceLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
    
    const costs = SERVICE_COSTS[service];
    let cost = serviceLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
    
    // If no cost logged, estimate based on usage
    if (cost === 0) {
      if (costs.perRequest) cost = requests * costs.perRequest;
      if (costs.perToken) cost = tokens * costs.perToken;
    }

    return {
      service,
      requests,
      tokens,
      cost
    };
  });

  // Calculate monthly usage
  const monthlyUsage: MonthlyUsage[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    const monthLogs = logs.filter(log => {
      const date = new Date(log.created_at);
      return date >= monthStart && date <= monthEnd;
    });

    monthlyUsage.push({
      month: format(monthDate, 'MMM yyyy'),
      cost: monthLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0),
      requests: monthLogs.reduce((sum, log) => sum + (log.request_count || 1), 0)
    });
  }

  const totalCost = serviceUsage.reduce((sum, s) => sum + s.cost, 0);
  const totalRequests = serviceUsage.reduce((sum, s) => sum + s.requests, 0);

  return {
    logs,
    serviceUsage,
    monthlyUsage,
    totalCost,
    totalRequests,
    loading,
    error,
    refetch: fetchUsage
  };
};

export default useApiUsage;