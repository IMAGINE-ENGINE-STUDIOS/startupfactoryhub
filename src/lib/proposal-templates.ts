// Pre-built proposal templates for the manual Invoice/Proposal builder.
// Each template seeds the proposal title, line items (description, qty, unit price, billing)
// and optional notes/terms. Users can still add/edit items after applying a template.

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

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  // ───────── MEMBERSHIP — MONTHLY ─────────
  {
    id: "community-monthly",
    group: "Membership – Monthly",
    name: "Community – Monthly ($350/mo)",
    title: "Community Membership — Monthly",
    description: "Entry-level digital access for early MVP-stage founders.",
    terms: standardTerms,
    items: [
      {
        description:
          "Community Membership (Monthly)\n• Full digital platform access\n• Virtual events & workshops\n• Community & mentor interactions\n• Full resource library access\n• AI tools (limited)\n• Local Startup Factory HUB coworking access (1 country)",
        quantity: 1,
        unit_price: 350,
        billing: "monthly",
      },
    ],
  },
  {
    id: "self-paced-office-monthly",
    group: "Membership – Monthly",
    name: "Self-Paced + Office – Monthly ($550/mo)",
    title: "Self-Paced + Office Membership — Monthly",
    description: "Flexible workspace + virtual resources.",
    terms: standardTerms,
    items: [
      {
        description:
          "Self-Paced + Office Membership (Monthly)\n• All Community features\n• Local Startup Factory HUB coworking access (1 country)\n• Earth Intelligence satellite data access\n• Eligible for Accelerated Tier",
        quantity: 1,
        unit_price: 550,
        billing: "monthly",
      },
    ],
  },
  {
    id: "global-access-monthly",
    group: "Membership – Monthly",
    name: "Global Access – Monthly ($950/mo)",
    title: "Global Access Membership — Monthly",
    description: "Unlimited Global office access across 130+ countries.",
    terms: standardTerms,
    items: [
      {
        description:
          "Global Access Membership (Monthly)\n• All platform features\n• Global office access across Startup Factory Hub network\n• 130+ countries, 5,600+ sites\n• Mentor + event access\n• Earth Intelligence satellite data access\n• Eligible for Accelerated Tier",
        quantity: 1,
        unit_price: 950,
        billing: "monthly",
      },
    ],
  },
  {
    id: "corporate-monthly",
    group: "Membership – Monthly",
    name: "Corporate – Monthly ($1,500/mo)",
    title: "Corporate Membership — Monthly",
    description: "Scale-ups and corporate venture units.",
    terms: standardTerms,
    items: [
      {
        description:
          "Corporate Membership (Monthly)\n• All Global Access features\n• Team dashboard & management\n• Unlimited travel (11 countries)\n• Global coworking access\n• Accelerated Tier if eligible",
        quantity: 1,
        unit_price: 1500,
        billing: "monthly",
      },
    ],
  },

  // ───────── MEMBERSHIP — YEARLY (10% off) ─────────
  {
    id: "community-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Community – Yearly ($3,780/yr)",
    title: "Community Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    terms: standardTerms,
    items: [
      {
        description:
          "Community Membership (Annual — Save 10%)\n• Full digital platform access\n• Virtual events & workshops\n• Community & mentor interactions\n• Full resource library access\n• AI tools (limited)\n• Local Startup Factory HUB coworking access (1 country)",
        quantity: 1,
        unit_price: 3780,
        billing: "yearly",
      },
    ],
  },
  {
    id: "self-paced-office-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Self-Paced + Office – Yearly ($5,940/yr)",
    title: "Self-Paced + Office Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    terms: standardTerms,
    items: [
      {
        description:
          "Self-Paced + Office Membership (Annual — Save 10%)\n• All Community features\n• Local Startup Factory HUB coworking access (1 country)\n• Earth Intelligence satellite data access\n• Eligible for Accelerated Tier",
        quantity: 1,
        unit_price: 5940,
        billing: "yearly",
      },
    ],
  },
  {
    id: "global-access-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Global Access – Yearly ($10,260/yr)",
    title: "Global Access Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    terms: standardTerms,
    items: [
      {
        description:
          "Global Access Membership (Annual — Save 10%)\n• All platform features\n• Global office access across Startup Factory Hub network\n• 130+ countries, 5,600+ sites\n• Mentor + event access\n• Earth Intelligence satellite data access\n• Eligible for Accelerated Tier",
        quantity: 1,
        unit_price: 10260,
        billing: "yearly",
      },
    ],
  },
  {
    id: "corporate-yearly",
    group: "Membership – Yearly (Save 10%)",
    name: "Corporate – Yearly ($16,200/yr)",
    title: "Corporate Membership — Annual",
    description: "Annual plan, billed yearly. Save 10% vs monthly.",
    terms: standardTerms,
    items: [
      {
        description:
          "Corporate Membership (Annual — Save 10%)\n• All Global Access features\n• Team dashboard & management\n• Unlimited travel (11 countries)\n• Global coworking access\n• Accelerated Tier if eligible",
        quantity: 1,
        unit_price: 16200,
        billing: "yearly",
      },
    ],
  },

  // ───────── PROGRAMS & ADD-ONS ─────────
  {
    id: "soft-landing-addon",
    group: "Programs & Add-ons",
    name: "Soft Landing Add-on ($5,000 one-time)",
    title: "Soft Landing — Market Entry Support",
    description: "Optional add-on for Corporate members entering a new market.",
    terms: standardTerms,
    items: [
      {
        description:
          "Soft Landing Package (One-time)\n• Local market entry advisory\n• Legal & regulatory introductions\n• Hub onboarding & local network access\n• Dedicated landing manager (90 days)",
        quantity: 1,
        unit_price: 5000,
        billing: "one_time",
      },
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
      {
        description:
          "In-Person Cohort Placement (No Fee)\n• All platform features included\n• Direct investor introductions\n• Accelerated tier access\n• Demo day participation\n• Full mentor network access\n• Priority deal flow visibility",
        quantity: 1,
        unit_price: 0,
        billing: "one_time",
      },
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
      {
        description: "Service / deliverable description",
        quantity: 1,
        unit_price: 0,
        billing: "one_time",
      },
    ],
  },
];

export const TEMPLATE_GROUPS = Array.from(
  new Set(PROPOSAL_TEMPLATES.map((t) => t.group))
);
