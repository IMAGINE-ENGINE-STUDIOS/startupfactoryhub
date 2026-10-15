/**
 * Referral programs available to approved referral partners.
 * Each program produces a unique tracked link built from the partner's
 * referral code, and defines the commission the partner earns.
 */

export const MVP_COHORT_ID = "1b95239b-622b-4838-9b63-cfff2c54269e";

export type ReferralProgramId = "mvp_program" | "mentor" | "advisor" | "subscription";

export interface ReferralProgramDefinition {
  id: ReferralProgramId;
  name: string;
  description: string;
  /** Builds the tracked destination for a given referral code. */
  buildUrl: (code: string) => string;
  /** Commission in cents earned per confirmed conversion. 0 = percentage based. */
  commissionCents: number;
  commissionLabel: string;
  /** Value of the referred program, used for context in the dashboard. */
  programValueLabel: string;
}

const BASE = "https://startupfactoryhub.com";

export const REFERRAL_PROGRAMS: ReferralProgramDefinition[] = [
  {
    id: "mvp_program",
    name: "MVP Development Program",
    description:
      "Refer a startup to the MVP Batch. You earn a commission when the referred startup is accepted and pays the program cost.",
    buildUrl: (code) => `${BASE}/cohorts/${MVP_COHORT_ID}/apply?ref=${code}`,
    commissionCents: 50000,
    commissionLabel: "$500 per enrolled startup",
    programValueLabel: "$5,000 program cost",
  },
  {
    id: "mentor",
    name: "Mentor Program",
    description:
      "Refer an experienced operator to join as an official mentor. Commission is paid on their first paid month.",
    buildUrl: (code) => `${BASE}/auth?ref=${code}&program=mentor`,
    commissionCents: 0,
    commissionLabel: "20% of first month",
    programValueLabel: "Mentor membership",
  },
  {
    id: "advisor",
    name: "Advisor Program",
    description:
      "Refer an advisor to the platform. Commission is paid on their first paid month.",
    buildUrl: (code) => `${BASE}/auth?ref=${code}&program=advisor`,
    commissionCents: 0,
    commissionLabel: "20% of first month (25% for Venture Advisor members)",
    programValueLabel: "Venture Advisor membership · $550/mo",
  },
  {
    id: "subscription",
    name: "Membership Referral",
    description:
      "The standard referral link. Earn on any membership started through it.",
    buildUrl: (code) => `${BASE}/ref/${code}`,
    commissionCents: 0,
    commissionLabel: "20% of first month",
    programValueLabel: "Startup membership from $350/mo",
  },
];

export const PROGRAM_LABELS: Record<string, string> = {
  mvp_program: "MVP Program",
  mentor: "Mentor",
  advisor: "Advisor",
  subscription: "Membership",
};
