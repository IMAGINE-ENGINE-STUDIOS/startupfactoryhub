// AI credit plans. 1 credit = 1 build generation = 5 quick chat/tweak messages.
// Monthly credits roll over (unused credits stay in your balance).
export const GENIUS_PLANS = {
  free: {
    key: "free",
    name: "Free",
    price: 0 as number | null,
    credits: 0,
    product_id: null as string | null,
    price_id: null as string | null,
    allowance: "100 welcome credits + 5 free credits every day",
    features: ["100 one-time welcome credits", "5 free credits every day", "Manual visual editing is always free", "Undo, redo and version restores free"],
  },
  starter: {
    key: "starter",
    name: "Imagine Starter",
    price: 9 as number | null,
    credits: 180,
    product_id: "prod_VO19wW9Qe9JhxQ" as string | null,
    price_id: "price_1UNF7bK5N1RcUVuYHlnpmkkA" as string | null,
    allowance: "180 credits / month + 5 daily",
    features: ["180 AI credits every month", "Unused credits roll over", "Plus 5 free credits every day", "All builder tools"],
  },
  pro: {
    key: "pro",
    name: "Imagine Pro",
    price: 29 as number | null,
    credits: 600,
    product_id: "prod_VO1AspAEw0Txl0" as string | null,
    price_id: "price_1UNF7vK5N1RcUVuY121ICYxa" as string | null,
    allowance: "600 credits / month + 5 daily",
    features: ["600 AI credits every month", "Unused credits roll over", "Plus 5 free credits every day", "Priority generation"],
  },
  studio: {
    key: "studio",
    name: "Imagine Studio",
    price: 79 as number | null,
    credits: 1600,
    product_id: "prod_VNHFv9mfca4xTZ" as string | null,
    price_id: "price_1UMWhHK5N1RcUVuY1bB3pmLA" as string | null,
    allowance: "1,600 credits / month + 5 daily",
    features: ["1,600 AI credits every month", "Unused credits roll over", "Plus 5 free credits every day", "Best value per credit"],
  },
} as const;

export type GeniusPlanKey = keyof typeof GENIUS_PLANS;

export const GENIUS_PLAN_ORDER: GeniusPlanKey[] = ["free", "starter", "pro", "studio"];

/** Maps the server plan name (incl. legacy plans) to the plan card it matches. */
export const SERVER_PLAN_TO_KEY: Record<string, GeniusPlanKey> = {
  free: "free",
  imagine_starter: "starter",
  imagine_pro: "pro",
  imagine_studio: "studio",
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  imagine_starter: "Imagine Starter",
  imagine_pro: "Imagine Pro",
  imagine_studio: "Imagine Studio",
  starter: "Genius Starter (legacy)",
  pro: "Genius Pro (legacy)",
  members_club: "Members Club",
};

export const getGeniusPlan = (plan: string) =>
  GENIUS_PLANS[(SERVER_PLAN_TO_KEY[plan] ?? plan) as GeniusPlanKey] ?? GENIUS_PLANS.free;
