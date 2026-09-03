// Loads the Basic Plan configuration from the database and exposes it
// with formatting helpers. Falls back to the seeded defaults on error so
// the simulation page never renders empty.
import { useQuery } from "@tanstack/react-query";
import { fetchBasicPlanConfig, updateBasicPlanConfig } from "../api/basicPlanApi";
import { DEFAULT_ENTITLEMENTS } from "../config/entitlements";
import type { BasicPlanConfig, Entitlement } from "../types";

const FALLBACK: BasicPlanConfig = {
  key: "basic",
  name: "Basic Plan",
  monthly_price_cents: 5000,
  yearly_price_cents: 48000,
  currency: "usd",
  stripe_monthly_price_id: null,
  stripe_yearly_price_id: null,
  entitlements: DEFAULT_ENTITLEMENTS,
  is_active: true,
};

export const formatCents = (cents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function useBasicPlan() {
  const query = useQuery({
    queryKey: ["basic-plan-config"],
    queryFn: fetchBasicPlanConfig,
    staleTime: 60_000,
    retry: 1,
  });

  const plan: BasicPlanConfig = query.data ?? FALLBACK;
  const entitlements: Entitlement[] =
    Array.isArray(plan.entitlements) && plan.entitlements.length > 0
      ? plan.entitlements
      : DEFAULT_ENTITLEMENTS;

  const monthlyEquivalentYearly = plan.yearly_price_cents / 12;
  const savingsPercent =
    plan.monthly_price_cents > 0
      ? Math.round((1 - plan.yearly_price_cents / (plan.monthly_price_cents * 12)) * 100)
      : 0;

  return {
    plan,
    entitlements,
    loading: query.isLoading,
    monthlyLabel: formatCents(plan.monthly_price_cents),
    yearlyLabel: formatCents(plan.yearly_price_cents),
    yearlyMonthlyEquivalentLabel: formatCents(Math.round(monthlyEquivalentYearly)),
    savingsPercent,
    savePrices: updateBasicPlanConfig,
    refetch: query.refetch,
  };
}
