// Loads the Investor Priority plan configuration with a static fallback so the
// brochure always renders, even if the database query fails.
import { useEffect, useState } from "react";
import { fetchInvestorPlanConfig } from "../api/investorPlanApi";
import { INVESTOR_BENEFITS } from "../config/benefits";
import type { InvestorPlanConfig } from "../types";

const FALLBACK: InvestorPlanConfig = {
  key: "investor",
  name: "Investor Priority",
  monthly_price_cents: 50000,
  yearly_price_cents: 500000,
  currency: "usd",
  stripe_monthly_price_id: null,
  stripe_yearly_price_id: null,
  entitlements: INVESTOR_BENEFITS,
  is_active: true,
};

/** Formats integer cents as a whole-dollar amount (e.g. 50000 -> "$500"). */
export function formatCents(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function useInvestorPlan() {
  const [config, setConfig] = useState<InvestorPlanConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchInvestorPlanConfig()
      .then((data) => {
        if (cancelled) return;
        const entitlements =
          Array.isArray(data.entitlements) && data.entitlements.length > 0
            ? data.entitlements
            : INVESTOR_BENEFITS;
        setConfig({ ...data, entitlements });
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyEquivalentCents = Math.round(config.yearly_price_cents / 12);
  const yearlySavingsPercent = Math.round(
    (1 - config.yearly_price_cents / (config.monthly_price_cents * 12)) * 100
  );

  return { config, loading, monthlyEquivalentCents, yearlySavingsPercent };
}
