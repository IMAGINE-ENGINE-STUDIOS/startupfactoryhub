// Shared types for the Basic Plan simulation feature.

/** Billing interval the visitor is previewing or buying. */
export type BillingCycle = "monthly" | "yearly";

/** One unlocked service bundled with the Basic Plan. */
export interface Entitlement {
  /** Stable machine key, used for future gating across the app. */
  key: string;
  label: string;
  description: string;
  /** Lucide icon name rendered by EntitlementTile. */
  icon: string;
  /** CTA label shown when the entitlement is unlocked. */
  actionLabel: string;
}

/** Row shape of public.subscription_plan_config for the `basic` plan. */
export interface BasicPlanConfig {
  key: string;
  name: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  currency: string;
  stripe_monthly_price_id: string | null;
  stripe_yearly_price_id: string | null;
  entitlements: Entitlement[];
  is_active: boolean;
}

