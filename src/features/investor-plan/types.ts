// Shared types for the Investor Priority membership feature.

/** Billing interval the visitor is previewing or buying. */
export type InvestorBillingCycle = "monthly" | "yearly";

/** One privilege unlocked with the Investor Priority membership. */
export interface InvestorBenefit {
  /** Stable machine key, used for gating across the app. */
  key: string;
  label: string;
  description: string;
  /** Lucide icon name rendered by the benefit tile. */
  icon: string;
  actionLabel: string;
}

/** Row shape of public.subscription_plan_config for the `investor` plan. */
export interface InvestorPlanConfig {
  key: string;
  name: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  currency: string;
  stripe_monthly_price_id: string | null;
  stripe_yearly_price_id: string | null;
  entitlements: InvestorBenefit[];
  is_active: boolean;
}
