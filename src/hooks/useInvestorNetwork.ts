import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NetworkStartup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  logo_url?: string;
  pitch_deck_url?: string;
  website?: string;
  location?: string;
  team_size?: number;
  funding_amount?: number;
  looking_for?: string[];
  connection_type: 'invested' | 'interested' | 'available';
}

export function useInvestorNetwork(userId: string | undefined) {
  const [startups, setStartups] = useState<NetworkStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userId) {
      fetchNetworkStartups();
    }
  }, [userId]);

  const fetchNetworkStartups = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel for better performance
      const [investmentsResult, interestsResult, companiesResult] = await Promise.all([
        // Get invested companies
        supabase
          .from('investments')
          .select('company_id')
          .eq('investor_id', userId)
          .eq('status', 'active'),
        
        // Get interested companies
        supabase
          .from('investment_interests')
          .select('company_id')
          .eq('investor_id', userId)
          .in('status', ['interested', 'due_diligence']),
        
        // Get all companies in one query
        supabase
          .from('companies')
          .select(`
            id,
            name,
            description,
            stage,
            industry,
            logo_url,
            pitch_deck_url,
            website,
            location,
            team_size,
            funding_amount,
            looking_for
          `)
          .order('created_at', { ascending: false })
      ]);

      const investedIds = new Set((investmentsResult.data || []).map(i => i.company_id));
      const interestedIds = new Set((interestsResult.data || []).map(i => i.company_id));
      const allCompanies = companiesResult.data || [];

      // Map companies to network startups with connection type
      const networkStartups: NetworkStartup[] = allCompanies.map(company => {
        let connection_type: NetworkStartup['connection_type'] = 'available';
        
        if (investedIds.has(company.id)) {
          connection_type = 'invested';
        } else if (interestedIds.has(company.id)) {
          connection_type = 'interested';
        }

        return {
          id: company.id,
          name: company.name,
          description: company.description || '',
          stage: company.stage || 'Unknown',
          industry: company.industry || 'General',
          logo_url: company.logo_url,
          pitch_deck_url: company.pitch_deck_url,
          website: company.website,
          location: company.location,
          team_size: company.team_size,
          funding_amount: company.funding_amount,
          looking_for: company.looking_for,
          connection_type,
        };
      });

      // Sort by connection type (invested first, then interested, then available)
      networkStartups.sort((a, b) => {
        const order = { invested: 0, interested: 1, available: 2 };
        return order[a.connection_type] - order[b.connection_type];
      });

      setStartups(networkStartups);
    } catch (err) {
      console.error('Error fetching network startups:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch network startups'));
    } finally {
      setLoading(false);
    }
  };

  return { startups, loading, error, refetch: fetchNetworkStartups };
}
