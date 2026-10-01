export interface Partner {
  name: string;
  logo: string;
  tier: string;
}

export const PARTNERS: Partner[] = [
  { name: "NASA", logo: "/partners/nasa-logo.png", tier: "Space Agency" },
  { name: "NASA Technology Transfer Program (T2)", logo: "/partners/nasa-t2-logo.webp", tier: "Commercialization" },
  { name: "UK Space Agency", logo: "/partners/uksa-logo.png", tier: "Space Agency" },
  { name: "APEX Accelerators", logo: "/partners/apex-accelerators-logo.png", tier: "Accelerator" },
  { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png", tier: "Cloud" },
  { name: "Nasdaq", logo: "/nasdaq-logo.png", tier: "Entrepreneurship" },
  { name: "F6S", logo: "/partners/f6s-logo.png", tier: "Startup" },
  { name: "TradingView", logo: "https://www.tradingview.com/static/images/logo-tradingview.svg", tier: "Finance" },
  { name: "IWG", logo: "/partners/iwg-logo.png", tier: "Workspace" },
  { name: "Startup Factory Hub", logo: "/partners/regus-logo.png", tier: "Workspace" },
  { name: "HQ", logo: "/partners/hq-logo.png", tier: "Workspace" },
  { name: "Signature by Regus", logo: "/partners/signature-regus-logo.png", tier: "Workspace" },
  { name: "Spaces", logo: "/partners/spaces-logo.png", tier: "Workspace" },
  { name: "Foxtail Coffee Co.", logo: "/partners/foxtail-coffee-logo.png", tier: "Hospitality" },
  { name: "HSBC Innovation Banking", logo: "/partners/hsbc-logo.png", tier: "Banking" },
  { name: "Advantary Capital Partners", logo: "/partners/advantary-logo.jpg", tier: "Investment" },
  { name: "Lehigh University", logo: "/lehigh-university-logo.png", tier: "Academic" },
  { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png", tier: "Marketing" },
  { name: "GitHub", logo: "/github-logo.png", tier: "Developer" },
  { name: "MongoDB", logo: "/mongodb-logo.webp", tier: "Infrastructure" },
  { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png", tier: "Technology" },
  { name: "Lovable", logo: "/partners/lovable-logo.png", tier: "Technology" },
  { name: "Decahedron Ventures", logo: "/partners/decahedron-ventures-logo.jpg", tier: "Investment" },
  { name: "Flusso Capital", logo: "/partners/flusso-capital-logo.png", tier: "Investment" },
  { name: "LivePlan", logo: "/partners/liveplan-logo.png", tier: "Accelerator" },
  { name: "UK Venture Partners", logo: "/partners/uk-venture-logo.jpg", tier: "Investment" },
  { name: "Flippa", logo: "/partners/flippa-logo.png", tier: "Marketplace" },
  { name: "Ducere University", logo: "/partners/ducere-logo.png", tier: "Academic" },
  { name: "HackerEarth", logo: "/partners/hackerearth-logo.png", tier: "Technology" },
  { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png", tier: "Community" },
  { name: "Grupo Incostas", logo: "/partners/incostas-logo.png", tier: "Business" },
  { name: "Nouel Consult", logo: "/partners/nouel-logo.png", tier: "Legal" },
  { name: "PitchPerfecter.AI", logo: "/partners/pitchperfecter-logo.png", tier: "Startup" },
  { name: "LOT Network", logo: "/partners/lotnetwork-logo.png", tier: "Legal" },
  { name: "NVIDIA Inception", logo: "/partners/nvidia-inception-logo.png", tier: "Technology" },
  { name: "WorkingAdvantage", logo: "/working-advantage-logo.png", tier: "Perks" },
  { name: "Notion", logo: "/partners/notion-logo.png", tier: "Productivity" },
  { name: "Moonshot.nx", logo: "/partners/moonshot-nx-logo.png", tier: "Innovation" },
  { name: "National Archives", logo: "/partners/national-archives-logo.webp", tier: "Government" },
  { name: "Deep Checks", logo: "/partners/deepchecks-logo.png", tier: "Technology" },
  { name: "Chase", logo: "/partners/chase-logo.png", tier: "Banking" },
];

/** Partners shown only on the pitch deck, hidden from website carousels. */
const DECK_ONLY = new Set(["UK Space Agency", "APEX Accelerators"]);
export const WEBSITE_PARTNERS: Partner[] = PARTNERS.filter(p => !DECK_ONLY.has(p.name));
