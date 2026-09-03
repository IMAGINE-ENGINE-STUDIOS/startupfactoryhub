// Fallback benefit definitions for the Investor Priority membership.
// public.subscription_plan_config (key = 'investor') is the live source of
// truth; these constants cover the page when that query fails.
import type { InvestorBenefit } from "../types";

export const INVESTOR_BENEFITS: InvestorBenefit[] = [
  {
    key: "unique_dealflow",
    label: "Proprietary Dealflow",
    description:
      "Curated access to vetted startups sourced across the Startup Factory Hub network before they reach the open market",
    icon: "Radar",
    actionLabel: "Browse dealflow",
  },
  {
    key: "early_access",
    label: "Early Investment Windows",
    description:
      "Priority allocation windows on rounds opening inside the platform, ahead of general members",
    icon: "Timer",
    actionLabel: "See open rounds",
  },
  {
    key: "shared_risk",
    label: "Shared-Risk Syndication",
    description:
      "Co-invest alongside other Investor Priority members and distribute exposure across tickets",
    icon: "Users",
    actionLabel: "Join a syndicate",
  },
  {
    key: "exclusive_programs",
    label: "Exclusive Investment Programs",
    description:
      "Access to structured investment programs designed and operated by Startup Factory Hub",
    icon: "Landmark",
    actionLabel: "View programs",
  },
  {
    key: "batch_participation",
    label: "Batch Participation",
    description:
      "Sit inside the accelerator Batches as an investing partner, from selection to Demo Day",
    icon: "Rocket",
    actionLabel: "See the Batch",
  },
  {
    key: "due_diligence",
    label: "Diligence Intelligence",
    description:
      "Signal Score analytics, market intelligence and AI-assisted diligence briefs on every company",
    icon: "LineChart",
    actionLabel: "Open intelligence",
  },
  {
    key: "founder_access",
    label: "Direct Founder Access",
    description:
      "Priority meeting requests with founders, with guaranteed placement in their pitch calendars",
    icon: "CalendarClock",
    actionLabel: "Book a pitch",
  },
  {
    key: "portfolio_tools",
    label: "Portfolio Command Center",
    description:
      "Track positions, valuations and follow-on opportunities across your portfolio in one dashboard",
    icon: "Briefcase",
    actionLabel: "Open portfolio",
  },
  {
    key: "private_events",
    label: "Private Investor Events",
    description:
      "Closed-door pitch nights, LP roundtables and Demo Days reserved for priority investors",
    icon: "Ticket",
    actionLabel: "View calendar",
  },
  {
    key: "coinvestor_network",
    label: "Co-Investor Network",
    description:
      "Direct messaging with funds, family offices and angels active in the Startup Factory Hub ecosystem",
    icon: "Network",
    actionLabel: "Meet co-investors",
  },
];
