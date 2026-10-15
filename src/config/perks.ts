/**
 * Founder perks offered in the Tools tab and the APEX brochure.
 * Credits: Imagine Engine Studios Corp.
 */
export interface Perk {
  name: string;
  description: string;
  badge: string;
  href: string;
  accent: string;
  glow: string;
  domain: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export const PERKS: Perk[] = [
  {
    name: "Flippa",
    description: "Buy & sell digital businesses, apps and online assets.",
    badge: "Marketplace",
    href: "https://flippa.com/",
    accent: "from-emerald-500 to-lime-600",
    glow: "hsl(140 80% 45%)",
    domain: "flippa.com",
  },
  {
    name: "Regus Office Spaces",
    description: "Discounted private offices and coworking in 3,000+ locations.",
    badge: "Workspace",
    href: "https://events.iwgplc.com/startupfactoryhub",
    accent: "from-blue-600 to-indigo-700",
    glow: "hsl(220 80% 55%)",
    domain: "regus.com",
  },
  {
    name: "TradingView",
    description: "Track markets and analyze charts — official affiliate link.",
    badge: "Finance",
    href: "https://www.tradingview.com/?aff_id=162505",
    accent: "from-blue-500 to-cyan-500",
    glow: "hsl(200 85% 55%)",
    domain: "tradingview.com",
  },
  {
    name: "PitchPerfecter",
    description: "AI-powered pitch deck coaching for founders.",
    badge: "Fundraising",
    href: "https://pitchperfecter.ai/",
    accent: "from-purple-500 to-fuchsia-600",
    glow: "hsl(290 80% 60%)",
    domain: "pitchperfecter.ai",
  },
  {
    name: "Pump",
    description: "Save up to 60% on AWS costs with automated optimization.",
    badge: "Cloud Savings",
    href: "https://www.pump.co/",
    accent: "from-orange-500 to-red-500",
    glow: "hsl(15 85% 55%)",
    domain: "pump.co",
  },
  {
    name: "HeyBoss",
    description: "AI agent that builds your website, app or store in minutes.",
    badge: "Builder",
    href: "https://www.heyboss.xyz/",
    accent: "from-rose-500 to-pink-600",
    glow: "hsl(340 80% 60%)",
    domain: "heyboss.xyz",
  },
  {
    name: "LivePlan",
    description: "Business planning, forecasting and pitch tools for startups.",
    badge: "Planning",
    href: "https://refer.liveplan.com/mzYpVYw",
    accent: "from-teal-500 to-emerald-600",
    glow: "hsl(170 75% 45%)",
    domain: "liveplan.com",
  },
  {
    name: "Folk CRM",
    description: "The CRM that feels like a personal network — clean & fast.",
    badge: "CRM",
    href: "https://www.folk.app/",
    accent: "from-violet-500 to-indigo-600",
    glow: "hsl(260 80% 65%)",
    domain: "folk.app",
  },
  {
    name: "Hostinger",
    description: "Affordable hosting, domains and VPS for early-stage builds.",
    badge: "Hosting",
    href: "https://www.hostinger.com/es?REFERRALCODE=starthub1",
    accent: "from-indigo-500 to-purple-600",
    glow: "hsl(250 75% 60%)",
    domain: "hostinger.com",
  },
  {
    name: "Notion for Startups",
    description: "6 months free on the Business plan with Notion AI included.",
    badge: "Productivity",
    href: "https://www.notion.com/startups?utm_medium=partner&utm_source=startup_partner&utm_campaign=startup-program-partner-startupfactoryhub&partner=STARTUP%20FACTORY%20HUB%20&partnerKey=STARTUP4110P85657",
    accent: "from-slate-600 to-slate-800",
    glow: "hsl(220 10% 50%)",
    domain: "notion.com",
  },
  {
    name: "Lovable",
    description: "Build apps and websites by chatting with AI.",
    badge: "Builder",
    href: "https://lovable.dev/invite/ZTRY5P6",
    accent: "from-pink-500 to-orange-500",
    glow: "hsl(10 85% 60%)",
    domain: "lovable.dev",
  },
  {
    name: "Papermark",
    description: "Open-source document sharing with page-by-page analytics for pitch decks and data rooms.",
    badge: "Documents",
    href: "https://refer.papermark.com/startupfactoryhub",
    accent: "from-zinc-700 to-zinc-900",
    glow: "hsl(0 0% 45%)",
    domain: "papermark.com",
  },
  {
    name: "Airtable",
    description: "Build flexible databases, workflows and apps to organize your startup's operations.",
    badge: "Productivity",
    href: "https://airtable.com/invite/r/dbKEIlnq",
    accent: "from-amber-400 to-sky-500",
    glow: "hsl(200 90% 55%)",
    domain: "airtable.com",
  },
  {
    name: "Working Advantage",
    description: "Use code STARTUPPERKS for exclusive lifestyle benefits.",
    badge: "Lifestyle",
    href: "https://www.workingadvantage.com/?tab=h",
    accent: "from-amber-500 to-orange-500",
    glow: "hsl(35 95% 55%)",
    domain: "workingadvantage.com",
  },
  {
    name: "GitHub for Startups",
    description: "Free GitHub Enterprise + Advanced Security for eligible startups. Includes co-marketing support and visibility through GitHub channels.",
    badge: "Developer",
    href: "https://resources.github.com/startups/?pid=ImagineEngineStudios",
    accent: "from-slate-700 to-slate-900",
    glow: "hsl(220 15% 35%)",
    domain: "github.com",
  },
  {
    name: "HubSpot for Startups",
    description: "Up to 75% off HubSpot's CRM, Marketing, Sales and Service hubs for eligible startups. Sign up with our partner code or book a 1:1 demo.",
    badge: "CRM",
    href: "https://app.hubspot.com/signup-hubspot/hubspot-for-startups?partner-code=oM6XbSiB9yc5&program=startups",
    secondaryHref: "https://meetings.hubspot.com/brie-perry/demo",
    secondaryLabel: "Book demo",
    accent: "from-orange-500 to-amber-600",
    glow: "hsl(25 95% 55%)",
    domain: "hubspot.com",
  },
  {
    name: "MongoDB for Startups",
    description: "Up to $5,000 in Atlas credits + expert technical advice.",
    badge: "Database",
    href: "https://www.mongodb.com/lp/solutions/startups/partners?utm_campaign=startups-partners&utm_source=startup%20factory%20hub&utm_medium=referral&utm_content=startups",
    accent: "from-green-600 to-emerald-700",
    glow: "hsl(150 80% 40%)",
    domain: "mongodb.com",
  },
  {
    name: "10 Credits on Lovable",
    description: "Bonus credits to ship your next idea on Lovable.",
    badge: "AI Credits",
    href: "https://lovable.dev/",
    accent: "from-pink-500 via-fuchsia-500 to-violet-500",
    glow: "hsl(310 85% 60%)",
    domain: "lovable.dev",
  },
];
