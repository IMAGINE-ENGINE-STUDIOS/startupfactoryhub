import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  calculateAllScores,
  CCFactorScores,
  TractionMetrics,
  ScoreWeights,
  StartupScoreResult
} from '@/lib/startupScoring';

export interface StartupScore {
  id: string;
  company_id: string;
  cohort_startup_id?: string;
  cc_founder_team_quality: number;
  cc_intellectual_property: number;
  cc_product_market_fit: number;
  cc_strategic_partnerships: number;
  cc_exit_environment: number;
  cc_supply_chain_stability: number;
  cc_regulatory_momentum: number;
  cc_capital_efficiency: number;
  cc_recurring_revenue_ratio: number;
  cc_tech_replacement_risk: number;
  ts_revenue_growth: number;
  ts_user_pilot_count: number;
  ts_retention_rate: number;
  ts_sales_cycle_days: number;
  ts_stage: string;
  primary_market: string | null;
  market_ems_score: number;
  company_coefficient: number | null;
  traction_score: number | null;
  core_score: number | null;
  startup_score: number | null;
  weight_alpha: number;
  weight_beta: number;
  weight_gamma: number;
  scored_by: string | null;
  scored_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketTheme {
  id: string;
  name: string;
  description: string | null;
  ems_score: number;
  trend_direction: string;
  last_updated: string;
  created_at: string;
}

export function useStartupScoring(companyId?: string) {
  const { user } = useAuth();
  const [score, setScore] = useState<StartupScore | null>(null);
  const [marketThemes, setMarketThemes] = useState<MarketTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchScore();
    }
    fetchMarketThemes();
  }, [companyId]);

  const fetchScore = async () => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('startup_scores')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setScore(data);
    } catch (error) {
      console.error('Error fetching startup score:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('market_themes')
        .select('*')
        .order('name');

      if (error) throw error;
      setMarketThemes(data || []);
    } catch (error) {
      console.error('Error fetching market themes:', error);
    }
  };

  const saveScore = async (
    ccFactors: Partial<CCFactorScores>,
    tractionMetrics: TractionMetrics,
    primaryMarket: string | null,
    emsScore: number,
    weights: ScoreWeights = { alpha: 0.5, beta: 0.5, gamma: 1.0 },
    notes?: string,
    cohortStartupId?: string
  ) => {
    if (!companyId || !user) {
      toast.error('Unable to save score');
      return null;
    }

    setSaving(true);
    try {
      // Calculate all scores
      const result = calculateAllScores(ccFactors, tractionMetrics, emsScore, weights);

      const scoreData = {
        company_id: companyId,
        cohort_startup_id: cohortStartupId || null,
        cc_founder_team_quality: ccFactors.founder_team_quality ?? 5,
        cc_intellectual_property: ccFactors.intellectual_property ?? 5,
        cc_product_market_fit: ccFactors.product_market_fit ?? 5,
        cc_strategic_partnerships: ccFactors.strategic_partnerships ?? 5,
        cc_exit_environment: ccFactors.exit_environment ?? 5,
        cc_supply_chain_stability: ccFactors.supply_chain_stability ?? 5,
        cc_regulatory_momentum: ccFactors.regulatory_momentum ?? 5,
        cc_capital_efficiency: ccFactors.capital_efficiency ?? 5,
        cc_recurring_revenue_ratio: ccFactors.recurring_revenue_ratio ?? 5,
        cc_tech_replacement_risk: ccFactors.tech_replacement_risk ?? 5,
        ts_revenue_growth: tractionMetrics.revenue_growth,
        ts_user_pilot_count: tractionMetrics.user_pilot_count,
        ts_retention_rate: tractionMetrics.retention_rate,
        ts_sales_cycle_days: tractionMetrics.sales_cycle_days,
        ts_stage: tractionMetrics.stage,
        primary_market: primaryMarket,
        market_ems_score: emsScore,
        company_coefficient: result.companyCoefficient,
        traction_score: result.tractionScore,
        core_score: result.coreScore,
        startup_score: result.startupScore,
        weight_alpha: weights.alpha,
        weight_beta: weights.beta,
        weight_gamma: weights.gamma,
        scored_by: user.id,
        scored_at: new Date().toISOString(),
        notes: notes || null
      };

      // Upsert: update if exists, insert if not
      const { data, error } = await supabase
        .from('startup_scores')
        .upsert(scoreData, { 
          onConflict: 'company_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        // If upsert fails, try insert
        const { data: insertData, error: insertError } = await supabase
          .from('startup_scores')
          .insert(scoreData)
          .select()
          .single();

        if (insertError) throw insertError;
        setScore(insertData);
        toast.success('Startup score saved successfully');
        return insertData;
      }

      setScore(data);
      toast.success('Startup score updated successfully');
      return data;
    } catch (error: any) {
      console.error('Error saving startup score:', error);
      toast.error(error.message || 'Failed to save score');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const getCalculatedScore = (
    ccFactors: Partial<CCFactorScores>,
    tractionMetrics: TractionMetrics,
    emsScore: number,
    weights: ScoreWeights = { alpha: 0.5, beta: 0.5, gamma: 1.0 }
  ): StartupScoreResult => {
    return calculateAllScores(ccFactors, tractionMetrics, emsScore, weights);
  };

  return {
    score,
    marketThemes,
    loading,
    saving,
    saveScore,
    getCalculatedScore,
    refetch: fetchScore
  };
}

export function useAllStartupScores() {
  const [scores, setScores] = useState<StartupScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllScores();
  }, []);

  const fetchAllScores = async () => {
    try {
      const { data, error } = await supabase
        .from('startup_scores')
        .select('*')
        .order('startup_score', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (error) {
      console.error('Error fetching all startup scores:', error);
    } finally {
      setLoading(false);
    }
  };

  return { scores, loading, refetch: fetchAllScores };
}
