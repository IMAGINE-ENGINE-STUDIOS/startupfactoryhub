// Pre-built proposal templates for the manual Invoice/Proposal builder.
// Each bullet/feature is its own line item so the proposal lists everything separately.
// The plan price is on the main row; included features are $0 line items.

export type TemplateBilling = "one_time" | "monthly" | "yearly";

export interface TemplateItem {
  description: string;
  quantity: number;
  unit_price: number;
  billing: TemplateBilling;
  kind?: "item" | "note";
}

export interface ProposalTemplate {
  id: string;
  group: string;
  name: string;
  title: string;
  description: string;
  notes?: string;
  terms?: string;
  items: TemplateItem[];
}

const standardTerms =
  "This proposal is valid for 30 days from the issue date. Subscription fees are billed in advance and renew automatically until cancelled. One-time setup fees are due upon acceptance.";

// Helper: build a plan template where the first row carries the price and each
// included feature is its own $0 line item (so it shows individually in the PDF).
const planTemplate = (opts: {
  id: string;
  group: string;
  name: string;
  title: string;
  description: string;
  planLabel: string;
  price: number;
  billing: TemplateBilling;
  features: string[];
}): ProposalTemplate => ({
  id: opts.id,
  group: opts.group,
  name: opts.name,
  title: opts.title,
  description: opts.description,
  terms: standardTerms,
  items: [
    {
      description: opts.planLabel,
      quantity: 1,
      unit_price: opts.price,
      billing: opts.billing,
    },
    ...opts.features.map<TemplateItem>((f) => ({
      description: f,
      quantity: 1,
      unit_price: 0,
      billing: opts.billing,
    })),
  ],
});

const COMMUNITY_FEATURES = [
  "Full digital platform access",
  "Virtual events & workshops",
  "Community & mentor interactions",
  "Full resource library access",
  "AI tools (limited)",
  "Local Startup Factory HUB coworking access (1 country)",
];

const SELF_PACED_FEATURES = [
  "All Community features included",
  "Local Startup Factory HUB coworking access (1 country)",
  "Earth Intelligence satellite data access",
  "Eligible for Accelerated Tier",
];

const GLOBAL_ACCESS_FEATURES = [
  "All platform features included",
  "Global office access across Startup Factory Hub network",
  "130+ countries, 5,600+ sites",
  "Mentor + event access",
  "Earth Intelligence satellite data access",
  "Eligible for Accelerated Tier",
];

const CORPORATE_FEATURES = [
  "All Global Access features included",
  "Team dashboard & management",
  "Unlimited travel (11 countries)",
  "Global coworking access",
  "Accelerated Tier if eligible",
];

const COHORT_FEATURES = [
  "All platform features included",
  "Direct investor introductions",
  "Accelerated tier access",
  "Demo day participation",
  "Full mentor network access",
  "Priority deal flow visibility",
];

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  // ───────── MEMBERSHIP — MONTHLY ─────────
  planTemplate({
    id: "community-monthly",
    group: "Membership – Monthly",
    name: "Community – Monthly ($350/mo)",
    title: "Community Membership — Monthly",
    description: "Entry-level digital access for early MVP-stage founders.",
    planLabel: "Community Membership (Monthly)",
    price: 350,
    billing: "monthly",
    features: COMMUNITY_FEATURES,
  }),
  planTemplate({
    id: "self-paced-office-monthly",
    group: "Membership – Monthly",
    name: "Self-Paced + Office – Monthly ($550/mo)",
    title: "Self-Paced + Office Membership — Monthly",
    description: "Flexible workspace + virtual resources.",
    planLabel: "Self-Paced + Office Membership (Monthly)",
    price: 550,
    billing: "monthly",
    features: SELF_PACED_FEATURES,
  }),
  planTemplate({
    id: "global-access-monthly",
    group: "Membership – Monthly",
    name: "Global Access – Monthly ($950/mo)",
    title: "Global Access Membership — Monthly",
    description: "Unlimited Global office access across 130+ countries.",
    planLabel: "Global Access Membership (Monthly)",
    price: 950,
    billing: "monthly",
    features: GLOBAL_ACCESS_FEATURES,
  }),
  planTemplate({
    id: "corporate-monthly",
    group: "Membership – Monthly",
    name: "Corporate – Monthly ($1,500/mo)",
    title: "Corporate Membership — Monthly",
    description: "Scale-ups and corporate venture units.",
    planLabel: "Corporate Membership (Monthly)",
    price: 1500,
    billing: "monthly",
    features: CORPORATE_FEATURES,
  }),

  // ───────── MEMBERSHIP — YEARLY (Save 10%) ─────────
  planTemplate({
    id: "community-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Community – Yearly ($3,780/yr)",
    title: "Community Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    planLabel: "Community Membership (Annual — Save 10%)",
    price: 3780,
    billing: "yearly",
    features: COMMUNITY_FEATURES,
  }),
  planTemplate({
    id: "self-paced-office-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Self-Paced + Office – Yearly ($5,940/yr)",
    title: "Self-Paced + Office Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    planLabel: "Self-Paced + Office Membership (Annual — Save 10%)",
    price: 5940,
    billing: "yearly",
    features: SELF_PACED_FEATURES,
  }),
  planTemplate({
    id: "global-access-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Global Access – Yearly ($10,260/yr)",
    title: "Global Access Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    planLabel: "Global Access Membership (Annual — Save 10%)",
    price: 10260,
    billing: "yearly",
    features: GLOBAL_ACCESS_FEATURES,
  }),
  planTemplate({
    id: "corporate-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Corporate – Yearly ($16,200/yr)",
    title: "Corporate Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    planLabel: "Corporate Membership (Annual — Save 10%)",
    price: 16200,
    billing: "yearly",
    features: CORPORATE_FEATURES,
  }),

  // ───────── PROGRAMS & ADD-ONS ─────────
  {
    id: "soft-landing-addon",
    group: "Programs & Add-ons",
    name: "Soft Landing Add-on ($5,000 one-time)",
    title: "Soft Landing — Market Entry Support",
    description: "Optional add-on for Corporate members entering a new market.",
    terms: standardTerms,
    items: [
      { description: "Soft Landing Package (One-time)", quantity: 1, unit_price: 5000, billing: "one_time" },
      { description: "Local market entry advisory", quantity: 1, unit_price: 0, billing: "one_time" },
      { description: "Legal & regulatory introductions", quantity: 1, unit_price: 0, billing: "one_time" },
      { description: "Hub onboarding & local network access", quantity: 1, unit_price: 0, billing: "one_time" },
      { description: "Dedicated landing manager (90 days)", quantity: 1, unit_price: 0, billing: "one_time" },
    ],
  },
  {
    id: "in-person-cohort",
    group: "Programs & Add-ons",
    name: "In-Person Cohort (No Fee – selected)",
    title: "In-Person Cohort — Accelerator Participation",
    description:
      "No-fee accelerator placement for selected deep-tech startups. Use this template to formalize selection.",
    notes:
      "This proposal confirms selection into the In-Person Cohort. No fees apply. Equity / SAFE terms (if any) are addressed in a separate agreement.",
    terms:
      "Participation is conditional on signing the cohort participation agreement and meeting program milestones.",
    items: [
      { description: "In-Person Cohort Placement (No Fee)", quantity: 1, unit_price: 0, billing: "one_time" },
      ...COHORT_FEATURES.map<TemplateItem>((f) => ({
        description: f,
        quantity: 1,
        unit_price: 0,
        billing: "one_time",
      })),
      {
        description: "Selected startup — no monetary fee. See cohort agreement for equity/SAFE terms.",
        quantity: 0,
        unit_price: 0,
        billing: "one_time",
        kind: "note",
      },
    ],
  },

  // ───────── SERVICES ─────────
  {
    id: "custom-services",
    group: "Custom Services",
    name: "Blank — Custom Services",
    title: "Custom Services Proposal",
    description: "Empty template — add your own scope, items and pricing.",
    terms: standardTerms,
    items: [
      { description: "Service / deliverable description", quantity: 1, unit_price: 0, billing: "one_time" },
    ],
  },
];

export const TEMPLATE_GROUPS = Array.from(
  new Set(PROPOSAL_TEMPLATES.map((t) => t.group))
);
