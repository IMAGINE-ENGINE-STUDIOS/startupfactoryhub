export const GENIUS_PLANS = {
  free: {
    key: "free",
    name: "Free",
    price: 0,
    turns: 50,
    product_id: null as string | null,
    price_id: null as string | null,
    allowance: "50 turns/mo, cheaper model only",
    features: ["50 Genius AI turns per month", "Standard (fast) model only", "Community support"],
  },
  starter: {
    key: "starter",
    name: "Starter",
    price: 9,
    turns: 1000,
    product_id: "prod_UyMR3vZjOO9AGS" as string | null,
    price_id: "price_1TyPiMK5N1RcUVuYQk1w5Az9" as string | null,
    allowance: "1,000 turns or $5 token equivalent",
    features: ["1,000 Genius AI turns per month", "≈ $5 token equivalent", "Standard model, full tool access"],
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: 29,
    turns: 5000,
    product_id: "prod_UyMS4Bfe7DgCzR" as string | null,
    price_id: "price_1TyPjmK5N1RcUVuYQQeU2piq" as string | null,
    allowance: "5,000 turns + premium models",
    features: ["5,000 Genius AI turns per month", "Premium models", "Priority throughput"],
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: null as number | null,
    turns: 1000000,
    product_id: null as string | null,
    price_id: null as string | null,
    allowance: "Volume + dedicated capacity",
    features: ["Volume pricing", "Dedicated capacity", "Custom models & SLA"],
  },
} as const;

export type GeniusPlanKey = keyof typeof GENIUS_PLANS;

export const GENIUS_PLAN_ORDER: GeniusPlanKey[] = ["free", "starter", "pro", "enterprise"];

export const getGeniusPlan = (plan: string) =>
  GENIUS_PLANS[(plan as GeniusPlanKey)] ?? GENIUS_PLANS.free;
