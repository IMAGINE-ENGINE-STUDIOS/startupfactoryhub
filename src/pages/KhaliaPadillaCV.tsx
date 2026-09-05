import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Linkedin,
  Languages,
  Briefcase,
  GraduationCap,
  Sparkles,
  Rocket,
  Zap,
  Brain,
  Globe2,
  Building2,
  Cpu,
  Award,
  Crown,
  Download,
  Loader2,
  Printer,
  Palette,
  Music,
  
  Dna,
  ShieldCheck,
  Radio,
  Atom,
  Mic,
  Landmark,
  Handshake,
  Flag,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import portrait from "@/assets/khalia-padilla-portrait.png";
import designThinkingBadge from "@/assets/khalia-design-thinking-badge.jpg";
import nasdaqFeature from "@/assets/khalia-nasdaq-feature.jpg";

// Ordered chronologically — most recent first
const experiences = [
  {
    period: "Mar 2025 — Present",
    role: "Co-Founder & Managing Partner",
    org: "Decahedron Ventures",
    location: "United States",
    desc: "Currently building an emerging venture fund from the ground up — architecting investment theses across aerospace, quantum computing, energy, smart cities and sustainable infrastructure. Developing a proprietary mathematical portfolio-construction formula based on Golden Ratio (φ) allocation to size positions, stage exposure and risk weighting. Structuring the fund framework, cultivating LP relationships and refining the deal-flow pipeline in preparation for first close and active capital deployment.",
    icon: Rocket,
    metrics: [
      { k: "Status", v: "Emerging Fund" },
      { k: "Thesis Verticals", v: "5 Frontier Sectors" },
      { k: "Allocation Model", v: "φ Golden Ratio" },
    ],
  },
  {
    period: "Apr 2026 — Present",
    role: "Co-Founder & Chief Strategy Officer",
    org: "Gold Arrow",
    location: "United States",
    desc: "Leading the development and execution of a global strategy for a regulated platform focused on tokenized securities and cross-border asset trading. Driving partnerships with governments, regulators, and institutional stakeholders to establish compliant frameworks for digital asset issuance, security standards, and international trade enablement. Overseeing market expansion, policy alignment, and strategic initiatives that accelerate adoption of tokenized real-world assets, ensuring the platform operates at the intersection of financial innovation, regulatory integrity, and global economic growth.",
    icon: Landmark,
    metrics: [
      { k: "Focus", v: "Tokenized Securities" },
      { k: "Scope", v: "Cross-Border Trading" },
      { k: "Partners", v: "Gov + Institutional" },
    ],
  },
  {
    period: "Jan 2025 — Present",
    role: "Chief Executive Officer",
    org: "Imagine Engine",
    location: "United States",
    desc: "Run a private space agency and venture studio integrating research, engineering, commercialization and capital formation under one operating model — across aerospace, quantum, photonics, telecom, AI and deep-tech engineering. Secured active NASA research contracts in quantum, anchoring the studio's quantum stack with federally-funded R&D and positioning Imagine Engine as a sovereign-grade partner for institutional space and defense programs.",
    icon: Sparkles,
    metrics: [
      { k: "Active NASA Contracts", v: "Quantum R&D" },
      { k: "Technology Verticals", v: "6 Deep-Tech" },
      { k: "Operating Model", v: "Studio + Agency" },
    ],
  },
  {
    period: "Jul 2025 — Present",
    role: "Startup Mentor",
    org: "Nasdaq Entrepreneurial Center",
    location: "United States",
    desc: "Selected mentor at the Nasdaq Entrepreneurial Center — accelerating high-potential founders on technology strategy, partnerships and investor readiness inside one of the world's most visible entrepreneurship platforms.",
    icon: Award,
  },
  {
    period: "Aug 2025 — Present",
    role: "Founder",
    org: "Wonderlands World",
    location: "Orlando, FL",
    desc: "Founded a vertically integrated platform for patio and outdoor experiences powered by proprietary configure-and-quote technology — collapsing a fragmented buying journey into a single real-time customer flow from design to fulfillment.",
    icon: Building2,
    metrics: [
      { k: "First 5 Months Revenue", v: "$500K" },
      { k: "Profit Margin Lift", v: "+10%" },
      { k: "Driver", v: "Automation Tech" },
    ],
  },
  {
    period: "Mar 2024 — Present",
    role: "CEO & Managing Partner · Co-Founder",
    org: "Startup Factory Hub",
    location: "United States",
    desc: "Built and run a global accelerator and venture builder graduating 40+ ventures from ideation through Series A–C across software, robotics, IoT, aerospace and deep tech. Capital and partnership engine: 12+ VC firms and family offices, 50+ institutional partnerships, and active alliances with two NASA labs (dual-use commercialization), the APEX Accelerator network (federal contracting), and Lehigh and Princeton (research, talent, tech transfer). Architected a proprietary deep-tech predictive analytics platform that reads TRL (Technology Readiness Levels 1–9) on every startup, scores investment readiness and surfaces strategic insight so investors can make better-informed capital decisions — combining investor criteria with startup readiness signals through a machine-learning matching algorithm that lifted investor–startup match accuracy by 75%. Also run the demo-day, investor and ecosystem cadence end to end.",
    icon: Rocket,
    metrics: [
      { k: "Ventures Graduated", v: "40+" },
      { k: "Institutional Partnerships", v: "50+" },
      { k: "ML Matching Lift", v: "+75%" },
      { k: "Readiness Signal", v: "TRL 1–9 Scoring" },
    ],
  },
  {
    period: "Jan 2024 — Present",
    role: "CEO & Co-Founder",
    org: "Lightware Technologies",
    location: "Orlando, FL",
    desc: "Lead a NASA-backed photonics venture that has already validated 80 Tbps across an end-to-end modular optical network spanning terrestrial telecom, AI data centers and space-based links. The Lightband Network replaces electronic bottlenecks with light-speed data and optical energy transfer; NASA backing positions the platform as institutional, defense and space-grade infrastructure. Recipient of the Global Recognition Award — Innovation Category — for advancing optical communications.",
    icon: Zap,
    metrics: [
      { k: "Network Domains", v: "Terrestrial · Data Center · Orbital" },
      { k: "Recognition", v: "Global Innovation Award" },
    ],
  },
  {
    period: "Oct 2016 — Mar 2026",
    role: "Chief Technology Officer",
    org: "Gala Goods",
    location: "United States",
    desc: "Set the technology direction for a multi-industry logistics and commerce platform serving restaurants, supermarkets, pharmacies, distributors and parcel services. Delivered supply-chain automation, fleet integrations, AI decision-support tooling and TPV synchronization between online and physical sales — co-founder of the project from Oct 2022 to Mar 2024.",
    icon: Globe2,
  },
  {
    period: "Sep 2025 — Mar 2026",
    role: "Partner",
    org: "Spacely Chile",
    location: "Chile",
    desc: "Partner in a founding company of the National Space Consortium of Chile, operating as a private space agency that bridges government and industry on national space infrastructure programs.",
    icon: Sparkles,
  },
  {
    period: "Dec 2023 — Mar 2026",
    role: "Co-Founder & COO",
    org: "Tech Terra Corp",
    location: "United States",
    desc: "Owned daily operations of a general contracting firm specializing in urban redevelopment. Scaled concurrent project capacity, cut delivery timelines 15% by re-engineering subcontractor workflows, and rolled out digital monitoring across construction, procurement, scheduling and compliance.",
    icon: Building2,
    metrics: [
      { k: "Delivery Timeline Reduction", v: "−15%" },
      { k: "Operating Domains", v: "4 (Construction · Procurement · Scheduling · Compliance)" },
      { k: "Focus", v: "Urban Redevelopment" },
    ],
  },
  {
    period: "Oct 2023 — Present",
    role: "Advisor — Strategic Advisory, Technology Implementation & Business Development",
    org: "Startupbootcamp",
    location: "Remote",
    desc: "Advise early-stage founders across one of the world's leading global accelerator networks on strategic advisory, technology implementation and business development. Helped a portfolio startup refine its model and close a material funding round; route founders into investor and industry partnerships, run workshops and networking programs, and deliver market and competitive research that drives positioning and growth decisions.",
    icon: Award,
  },
  {
    period: "Jan 2025 — Jan 2026",
    role: "Partner & Advisor",
    org: "Korb Satellite Systems LLC",
    location: "United States",
    desc: "Advisory partner to a Nobel-laureate-founded space technology company building satellite design, manufacturing and tracking software for surveillance and security — guiding strategy, capital and commercialization at the intersection of frontier science and defense markets.",
    icon: Cpu,
  },
  {
    period: "Jan 2025 — Jan 2026",
    role: "Partner",
    org: "Copernic Space",
    location: "Los Angeles, CA",
    desc: "Partner in the world's first marketplace for space assets — enabling fractional ownership of satellites and spacecraft and orbital art launches, opening retail and institutional access to a previously closed asset class.",
    icon: Sparkles,
  },
  {
    period: "Nov 2024 — Present",
    role: "Startup Mentor | Alliander Power Program",
    org: "Alliander",
    location: "Netherlands / Remote",
    desc: "Mentor energy-sector startups inside the Alliander Power Program on technology strategy, ESG-aligned product positioning and international scaling — sharpening business models to land strategic partnerships across the European energy market.",
    icon: Zap,
  },
  {
    period: "Oct 2024 — Present",
    role: "Advisor to the Board",
    org: "Woman Aero STEM (part of UNOOSA)",
    location: "Latin America / Global",
    desc: "Board advisor to a women-led aerospace and STEM organization operating as part of UNOOSA (United Nations Office for Outer Space Affairs) and expanding across Latin America. Shape long-term strategy, plan women-led analog missions, and structure academic, industry and government partnerships that build the next generation of aerospace talent.",
    icon: Rocket,
  },
  {
    period: "Jan 2022 — Dec 2024",
    role: "Co-Founder & Chief Technology Officer",
    org: "Imagine Engine Studios",
    location: "Windermere, FL",
    desc: "Owned the technology roadmap across VR, AR, blockchain, computing hardware, AI, logistics and data platforms — prioritizing R&D against business objectives, shipping client-facing implementations, and translating frontier technology into commercial outcomes for clients and stakeholders.",
    icon: Brain,
  },
  {
    period: "Jan 2021 — Mar 2024",
    role: "Founder",
    org: "Genomas",
    location: "United States",
    desc: "Founded a bioinformatics company turning DNA data into interactive 3D human avatars. Directed sequencing research, phenotypic recognition models and the design of a fully digital species with synthetic DNA and an AI neural network — democratizing access to the human genome through the EnGene community.",
    icon: Cpu,
  },
  {
    period: "Feb 2023 — Dec 2023",
    role: "Artificial Intelligence Researcher & Developer",
    org: "Byte A.I.",
    location: "United States",
    desc: "Architected and shipped a next-generation autonomous call-center system on NVIDIA's AI stack (NeMo, Riva, CUDA, GPU acceleration) — delivering sub-second conversational AI across thousands of concurrent interactions in production.",
    icon: Brain,
  },
  {
    period: "Sep 2022 — Mar 2023",
    role: "Angel Investor",
    org: "Deltafood",
    location: "Camarles, Tarragona",
    desc: "Angel-invested in a food-tech accelerator combining QFRO (Quick-Fresh Ready-to-Order) technology with a scalable host-kitchen model — reaching 200,000+ people across El Delta del Ebro and recognized as Most Innovative Company.",
    icon: Globe2,
    metrics: [
      { k: "Capital Invested", v: "€40,000" },
      { k: "Revenue Generated (2 yrs)", v: "€837,555" },
      { k: "Community Served", v: "200,000+" },
    ],
  },
  {
    period: "May 2022 — Mar 2023",
    role: "Co-Founder",
    org: "Cocoa & Blues",
    location: "Camarles, Catalonia, Spain",
    desc: "Co-founded and operated a family coffee bar and restaurant with premium grilled meats and a live performance stage. Owned P&L, hiring, training, scheduling and quality assurance — earned the Best Dish Award (Professional Category).",
    icon: Sparkles,
    metrics: [
      { k: "Capital Invested", v: "€23,000" },
      { k: "Year-1 Revenue", v: "€225,300" },
      { k: "Recognition", v: "Best Dish Award" },
    ],
  },
  {
    period: "Oct 2016 — Feb 2017",
    role: "Corporate Sales Specialist",
    org: "T-Mobile",
    location: "Greater Orlando",
    desc: "B2B corporate sales across Greater Orlando — owned end-to-end sales cycles for SMB wireless and connectivity, consistently exceeded monthly quota, and closed multi-line deals across retail, logistics and healthcare. Drove a 25% team revenue increase by selling T-Mobile technology products and enterprise solutions directly to business clients.",
    icon: Briefcase,
    metrics: [
      { k: "Team Revenue Lift", v: "+25%" },
      { k: "Product Focus", v: "Tech → Business" },
      { k: "Sales Model", v: "B2B Corporate" },
    ],
  },
  {
    period: "Jan 2012 — Mar 2016",
    role: "Project Manager · Civil Engineering",
    org: "CDD 995 CA — CISNE & Refit Group",
    location: "Caracas, Venezuela",
    desc: "Promoted from Administrative Assistant to Project Manager, delivering civil-engineering and public-infrastructure projects for BBVA, Mercantil, Banesco, PDVSA and Telesur — including parks, bank branches and facility upgrades across Venezuela.",
    icon: Building2,
  },
];

const certifications: {
  title: string;
  issuer: string;
  issued: string;
  expires?: string;
  credentialId?: string;
  skills?: string[];
  note?: string;
}[] = [
  {
    title: "Fundamentals of Remote Sensing",
    issuer: "NASA — National Aeronautics and Space Administration",
    issued: "Jan 2026",
    credentialId: "3730896757KP",
    skills: ["Remote Sensing", "Satellite Imagery"],
    note: "The Applied Remote Sensing Training (ARSET)",
  },
  {
    title: "Milestone Circles",
    issuer: "Nasdaq Entrepreneurial Center",
    issued: "Nov 2025",
    skills: ["Entrepreneurship", "Entrepreneurship Development"],
  },
  {
    title: "Training on Conflict of Interest: Conducting Research with Federal Funding",
    issuer: "CITI Program",
    issued: "Feb 2025",
    expires: "Feb 2029",
    skills: ["Research", "Research and Development (R&D)"],
    note: "Certificate of Completion",
  },
  {
    title: "Researcher",
    issuer: "U.S. National Archives and Records Administration",
    issued: "Aug 2024",
    note: "Certification",
  },
  {
    title: "SAP Certified Associate — Design Thinking",
    issuer: "University of South Florida · Muma College of Business",
    issued: "Mar 2024",
    note: "Program Advisory Badge",
  },
  {
    title: "Internet of Things",
    issuer: "Spin Technologies",
    issued: "Dec 2023",
    skills: ["Internet of Things (IoT)"],
    note: "Diploma",
  },
  {
    title: "Certified Instructor",
    issuer: "The Florida Department of Education",
    issued: "Nov 2023",
    skills: ["Educational Leadership", "Higher Education"],
    note: "Adult Learning Certificate",
  },
  {
    title: "Revit",
    issuer: "Autodesk",
    issued: "Aug 2015",
    skills: ["AutoCAD Architecture", "CAD/CAM Software"],
    note: "Certificate",
  },
  {
    title: "AutoCAD 2D",
    issuer: "Autodesk",
    issued: "Jul 2015",
    note: "Certificate",
  },
  {
    title: "AutoCAD 3D",
    issuer: "Autodesk",
    issued: "Jun 2015",
    note: "Certificate",
  },
];

const honors = [
  "Global Recognition Award — Innovation Category, Lightware Technologies (optical communications)",
  "Best Dish Award — Professional Category, with Cocoa & Blues",
  "Most Innovative Company — with DeltaFood",
  "Grant Winner — with Lightware Technologies",
  "Featured on the Nasdaq Tower — with Startup Factory Hub",
];

// Institutional competency taxonomy — board, capital, frontier-tech and governance
const competencies: { title: string; items: string[] }[] = [
  {
    title: "Investment & Capital",
    items: [
      "Investment Strategy",
      "Institutional Capital Formation",
      "Portfolio Development",
      "Infrastructure Investment",
      "Venture Ecosystems",
      "Cross-Border Transactions",
    ],
  },
  {
    title: "Frontier Technology Domains",
    items: [
      "Space Economy",
      "Frontier Technologies",
      "Emerging Technology Markets",
      "Photonics & Optical Networks",
      "Quantum & AI Strategy",
    ],
  },
  {
    title: "Governance & Sovereign Relations",
    items: [
      "Board Governance",
      "Sovereign Relations",
      "Strategic Partnerships",
      "Policy & Regulatory Strategy",
      "International Negotiations",
    ],
  },
];

// Board, advisory and council positions
const advisoryPositions: { role: string; org: string; scope: string }[] = [
  {
    role: "Advisor to the Board",
    org: "Woman Aero STEM (part of UNOOSA)",
    scope: "Long-horizon strategy, analog-mission planning and tri-sector partnership architecture across Latin America, operating under the UNOOSA umbrella.",
  },
  {
    role: "Advisor — Strategic Advisory, Technology Implementation & Business Development",
    org: "Startupbootcamp",
    scope: "Strategic advisory, technology implementation and business development for early-stage founders inside one of the world's leading accelerator networks.",
  },
  {
    role: "Partner & Advisor",
    org: "Korb Satellite Systems LLC",
    scope: "Strategic and capital guidance to a Nobel-laureate-founded satellite manufacturing and tracking platform.",
  },
  {
    role: "Startup Mentor",
    org: "Nasdaq Entrepreneurial Center",
    scope: "Selected mentor advancing high-potential founders on partnerships, governance and institutional readiness.",
  },
  {
    role: "Mentor — Power Program",
    org: "Alliander",
    scope: "Energy-sector strategy, ESG-aligned positioning and European market scaling for portfolio companies.",
  },
  {
    role: "Founder",
    org: "National Space Consortium of Chile",
    scope: "Founding mandate uniting government, industry and academia under a single national space framework.",
  },
];

// Global presence — institutional, sovereign and ecosystem footprint
const skillCategories: { title: string; items: string[] }[] = [
  {
    title: "Leadership & Strategy",
    items: [
      "Innovation",
      "Leadership",
      "Strategic Vision",
      "Strategic Planning",
      "Strategic Innovation",
      "Technology Strategy",
      "Technology Leadership",
      "Team Leadership",
      "Team Coordination",
      "Digital Transformation",
      "Innovative Thinking",
      "Analytical Thinking",
      "Problem-solving",
    ],
  },
  {
    title: "Business & Operations",
    items: [
      "Business Development",
      "Strategic Partnerships",
      "Operational Efficiency",
      "Process Optimization",
      "Project Management",
      "Project Planning",
      "Recruitment",
      "Marketing Strategy",
      "Market Research",
      "Customer Experience",
      "Product Development",
      "Research and Development",
    ],
  },
  {
    title: "Emerging Technologies",
    items: [
      "Artificial Intelligence",
      "Machine Learning",
      "Cloud Computing",
      "Big Data",
      "Internet of Things",
      "Virtual Reality",
      "3D Animation",
      "Emerging Technologies",
      "Technical Expertise",
      "User Experience Design",
    ],
  },
  {
    title: "Engineering & Web",
    items: [
      "APIs",
      "Web & Mobile Applications",
      "E-commerce",
      "Data Technologies",
    ],
  },
  {
    title: "Tools & Software",
    items: [
      "Unreal Engine",
      "Unity",
      "Omniverse",
      "AutoCAD",
      "Revit",
      "Photoshop",
      "PowerPoint",
      "Excel",
      "Word",
      "Shopify",
      "GoDaddy",
      "MongoDB",
      "MySQL",
      "C++",
      "Design Thinking",
    ],
  },
];

const researchProjects = [
  {
    title: "Genomas Engine",
    tagline: "Organic molecule simulator for bioinformatics & biomedical research",
    desc: "A groundbreaking organic molecule simulator built to advance research in bioinformatics, genetics and biomedical sciences. Through a highly detailed and interactive 3D environment, the platform gives researchers an innovative tool to study and manipulate DNA and other organic molecules.",
    icon: Dna,
    tags: ["Bioinformatics", "Genomics", "3D Simulation", "DNA Modeling"],
  },
  {
    title: "Cypher Link",
    tagline: "Hardware + AI cybersecurity through electromagnetic behavior analysis",
    desc: "A hardware and AI software platform that recognizes and neutralizes cyberattacks by analyzing electromagnetic behavior. Cypher Link combines custom modulator hardware with AI-driven analytics to detect anomalies, deploy real-time response mechanisms and form a holistic defense framework before threats compromise systems.",
    icon: ShieldCheck,
    tags: [
      "Cyber Threat Detection",
      "Real-Time Neutralization",
      "AI Analytics",
      "Custom Hardware",
    ],
  },
  {
    title: "LightNet",
    tagline: "Hybrid optical & RF telecom for near-unlimited data transmission",
    desc: "A new telecommunication network powered by hybrid optical and radio-frequency systems, engineered for high-speed and near-unlimited data transmission across terrestrial and orbital environments.",
    icon: Radio,
    tags: ["Optical Networks", "RF Systems", "High-Speed Telecom"],
  },
  {
    title: "QuantumNet",
    tagline: "Quantum internet via entangled photons & fiber optic networks",
    desc: "A revolutionary quantum internet system built on the principles of quantum entanglement and Bell-state mechanics. QuantumNet harnesses entangled photons over fiber-optic networks to enable ultra-secure, ultra-efficient information exchange across vast distances — laying the foundation for next-generation quantum communication infrastructure.",
    icon: Atom,
    tags: ["Quantum Entanglement", "Bell State", "Photonics", "Secure Comms"],
  },
];

const interviews = [
  {
    title: "The optical future of space communications",
    outlet: "N2K Networks",
    type: "Podcast Interview",
  },
  {
    title: "All change at the top for NASA",
    outlet: "N2K Networks",
    type: "Podcast Interview",
  },
  {
    title: "Haciendo Negocios — Featured Twice",
    outlet: "Haciendo Negocios",
    type: "Television Feature (2x)",
  },
  {
    title: "Breakthrough Innovation",
    outlet: "Centered",
    type: "Feature Interview",
  },
];

const passions = [
  "Arabic Dance",
  "Flamenco Dance",
  "Piano · Orchestra Performance",
  "Multidisciplinary Art",
];

// Government, space-agency and ecosystem relationships built across 4 continents
const ecosystemNetwork: { region: string; entities: string[] }[] = [
  {
    region: "United States",
    entities: [
      "Space Florida",
      "NASA Kennedy Space Center",
      "NASA Glenn Research Center",
    ],
  },
  {
    region: "Japan",
    entities: [
      "Ministry of Economy, Trade and Industry (METI)",
      "Ministry of Trade — Government of Japan",
      "Startup Factory Hub Tokyo — Space Investment Acceleration",
    ],
  },
  {
    region: "United Kingdom",
    entities: ["UK Space Agency"],
  },
  {
    region: "Asia-Pacific & Indian Ocean",
    entities: [
      "Malaysian Space Agency (MYSA)",
      "Maldives Space Agency",
      "National Innovation Office of Thailand (NIA)",
    ],
  },
  {
    region: "Latin America",
    entities: [
      "National Space Consortium of Chile",
      "Government of Magallanes",
      "Chilean Space Force",
      "Government of Honduras — Strategic Engagement",
      "Government of Uruguay — Strategic Engagement",
      "Government of Dominican Republic — Strategic Engagement",
    ],
  },
];

// Academic and research university network
const universityNetwork: string[] = [
  "Ohio State University",
  "University of Central Florida (UCF)",
  "University of Florida (UF)",
  "Lehigh University",
  "Princeton University",
  "APT Community",
];

// Diplomatic delegate work and bilateral engagements
const diplomaticEngagements: {
  title: string;
  counterpart: string;
  role: string;
  desc: string;
}[] = [
  {
    title: "US–Japan 2024 Fast Track Dialogue",
    counterpart: "United States ↔ Japan",
    role: "U.S. Representative · Delegate",
    desc: "Represented the United States in bilateral fast-track dialogue with the Government of Japan — advancing cross-border technology, capital and policy coordination across the space, deep-tech and frontier-innovation agenda.",
  },
  {
    title: "Startup Factory Hub Tokyo — Japan Space Investment Acceleration",
    counterpart: "Japan · Government Engagement",
    role: "CEO & Lead Delegate",
    desc: "Direct engagement with Japanese government stakeholders to accelerate space-sector investment in Japan — establishing accelerator infrastructure, deal flow channels and public–private capital pipelines for U.S.–Japan space ventures.",
  },
  {
    title: "National Space Consortium of Chile",
    counterpart: "Chile · Founding Mandate",
    role: "Founder",
    desc: "Founded the national consortium aligning Chilean government, industry and academic stakeholders around a unified space strategy — establishing the country's institutional platform for sovereign and commercial space activity.",
  },
  {
    title: "Bilateral Government Engagements — LATAM",
    counterpart: "Honduras · Uruguay",
    role: "Strategic Delegate",
    desc: "Direct engagement with the Governments of Honduras and Uruguay on space-economy frameworks, innovation policy and cross-border investment positioning for sovereign-level frontier-technology programs.",
  },
];


export default function KhaliaPadillaCV() {
  const cvRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = "Khalia Padilla — Executive Resume | Chair · Space Economy & Frontier Capital";
    const meta = document.querySelector('meta[name="description"]');
    const content =
      "Khalia Padilla — Board Chair candidate for institutional space-economy funds. Capital allocator, fiduciary leader and operating executive directing investment, governance and global commercialization across the space, photonics, quantum and AI value chain.";
    if (meta) meta.setAttribute("content", content);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!cvRef.current || isExporting) return;
    const initialScrollY = window.scrollY;
    const pendingWindow = window.open("", "_blank", "noopener,noreferrer");
    if (pendingWindow) {
      pendingWindow.document.title = "Preparing PDF…";
      pendingWindow.document.body.innerHTML = "<p style=\"font-family: Inter, system-ui, sans-serif; padding: 24px; color: #0d1321;\">Preparing dossier PDF…</p>";
    }
    setIsExporting(true);

    const overrideStyle = document.createElement("style");
    overrideStyle.id = "pdf-export-overrides";
    overrideStyle.textContent = `
      .pdf-exporting * {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .pdf-exporting .bg-clip-text.text-transparent {
        -webkit-background-clip: initial !important;
        background-clip: initial !important;
        -webkit-text-fill-color: hsl(var(--foreground)) !important;
        color: hsl(var(--foreground)) !important;
        background: none !important;
      }
      .pdf-exporting .kp-grid-bg,
      .pdf-exporting .kp-line-anim,
      .pdf-exporting img:not([src]),
      .pdf-exporting img[src=""] {
        display: none !important;
      }
      /* Neutralize decorative absolute backgrounds during export to avoid overlaps */
      .pdf-exporting [data-pdf-block] .absolute.inset-0 {
        display: none !important;
      }
      /* Tighten oversized hero/section padding so blocks measure cleanly */
      .pdf-exporting [data-pdf-block-type="hero"] {
        padding-top: 1.5rem !important;
        padding-bottom: 1.5rem !important;
      }
      .pdf-exporting [data-pdf-block-type="banner"] {
        padding-top: 1rem !important;
        padding-bottom: 0.5rem !important;
      }
      .pdf-exporting [data-pdf-block-type="summary"] {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
      }
      /* Reduce header bottom margin so it sits closer to its content block,
         add top padding so the gradient line + uppercase label aren't clipped */
      .pdf-exporting [data-pdf-block-type="header"] {
        margin-bottom: 0.5rem !important;
        padding-top: 0.75rem !important;
        padding-bottom: 0.25rem !important;
      }
      /* Hide the experience timeline rail so it doesn't bleed across sliced cards */
      .pdf-exporting [data-pdf-block-type="experience"] > .absolute,
      .pdf-exporting [data-pdf-block-type="experience"] ~ .absolute {
        display: none !important;
      }
      /* Force every captured block to have solid background and clip its overflow */
      .pdf-exporting [data-pdf-block] {
        overflow: hidden !important;
        break-inside: avoid !important;
      }
      /* Keep certification + skill + research row pairs as 2-up grids during PDF capture */
      .pdf-exporting [data-pdf-block-type="cert-row"],
      .pdf-exporting [data-pdf-block-type="skill-row"],
      .pdf-exporting [data-pdf-block-type="research-row"],
      .pdf-exporting [data-pdf-block-type="interview-row"] {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 1rem !important;
        page-break-inside: avoid !important;
      }
    `;
    document.head.appendChild(overrideStyle);
    cvRef.current.classList.add("pdf-exporting");

    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Use the institutional ivory background defined in the scoped wrapper
      const [bgR, bgG, bgB] = [246, 243, 236];
      const bgHex = "#f6f3ec";

      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginMM = 10;
      const contentWidth = pdfWidth - marginMM * 2;
      const contentHeight = pdfHeight - marginMM * 2;
      const blockGap = 4;
      const maxExperiencePerPage = 5;

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });

      const fillPageBg = () => {
        pdf.setFillColor(bgR, bgG, bgB);
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      };

      const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
        Promise.race<T>([
          promise,
          new Promise<T>((_, reject) =>
            window.setTimeout(() => reject(new Error(`Capture timed out after ${ms}ms`)), ms)
          ),
        ]);

      const waitForImages = async (root: HTMLElement) => {
        const images = Array.from(root.querySelectorAll("img"));
        await Promise.all(
          images.map(
            (img) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalWidth > 0) {
                  resolve();
                  return;
                }

                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
                window.setTimeout(done, 1500);
              })
          )
        );
      };

      // Capture a single block (HTMLElement) -> { canvas, heightMM }
      const captureBlock = async (el: HTMLElement) => {
        await waitForImages(el);
        // Cap scale so resulting canvas never exceeds browser limits (~16384px)
        const targetW = el.scrollWidth || el.offsetWidth || 800;
        const targetH = el.scrollHeight || el.offsetHeight || 100;
        const maxDim = 14000;
        const maxPixels = 8_000_000;
        const pixelScaleCap = Math.sqrt(maxPixels / Math.max(targetW * targetH, 1));
        const preferredScale = el.dataset.pdfBlockType === "hero" ? 1 : 1.25;
        const maxScale = Math.min(preferredScale, maxDim / targetW, maxDim / targetH, pixelScaleCap);
        const scale = Math.max(0.9, Math.min(preferredScale, maxScale));
        const canvas = await html2canvas(el, {
          scale,
          useCORS: true,
          logging: false,
          imageTimeout: 2000,
          backgroundColor: bgHex,
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: Math.max(document.documentElement.scrollWidth, el.scrollWidth, el.offsetWidth),
          windowHeight: Math.max(document.documentElement.scrollHeight, el.scrollHeight, el.offsetHeight),
          ignoreElements: (node) =>
            node instanceof HTMLElement && node.dataset.pdfIgnore === "true",
        });
        const heightMM = (canvas.height * contentWidth) / canvas.width;
        return { canvas, heightMM };
      };

      const allBlocks = Array.from(
        cvRef.current.querySelectorAll<HTMLElement>("[data-pdf-block]")
      );
      // Filter out parents that contain other [data-pdf-block] children to avoid
      // capturing the same content twice (which causes overlaps).
      const blocks = allBlocks.filter(
        (el) => !el.querySelector("[data-pdf-block]")
      );

      // Pre-capture every block once so we have accurate heights for pagination
      const captured: { canvas: HTMLCanvasElement; heightMM: number; type: string; isExperience: boolean; isHeader: boolean }[] = [];
      for (const el of blocks) {
        const type = el.getAttribute("data-pdf-block-type") || "";
        // Skip blocks with zero dimensions (html2canvas throws on createPattern
        // when source canvas has width or height of 0)
        if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;
        try {
          const timeoutMs = type === "hero" ? 7000 : 5000;
          const { canvas, heightMM } = await withTimeout(captureBlock(el), timeoutMs);
          if (!canvas.width || !canvas.height) continue;
          captured.push({
            canvas,
            heightMM,
            type,
            isExperience: type === "experience",
            isHeader: type === "header",
          });
        } catch (err) {
          console.warn("[PDF] skipped block due to capture error", type, err);
        }
      }

      let currentY = marginMM;
      let experienceOnPage = 0;
      fillPageBg();

      const newPage = () => {
        pdf.addPage();
        fillPageBg();
        currentY = marginMM;
        experienceOnPage = 0;
      };

      for (let i = 0; i < captured.length; i++) {
        const { canvas, heightMM, isExperience, isHeader } = captured[i];

         // Oversized or first-page hero block -> slice across pages in smaller chunks
         if (heightMM > contentHeight || (i === 0 && heightMM > contentHeight * 0.82)) {
          if (currentY > marginMM) newPage();
          const pxPerMM = canvas.width / contentWidth;
           const maxSliceHeightMM = i === 0 ? Math.min(contentHeight * 0.82, 230) : contentHeight;
           const pageSlicePx = maxSliceHeightMM * pxPerMM;
          let offsetPx = 0;
          let firstSlice = true;
          while (offsetPx < canvas.height) {
            const sliceHeightPx = Math.min(pageSlicePx, canvas.height - offsetPx);
            const slice = document.createElement("canvas");
            slice.width = canvas.width;
            slice.height = sliceHeightPx;
            const ctx = slice.getContext("2d");
            if (ctx) {
              ctx.fillStyle = bgHex;
              ctx.fillRect(0, 0, slice.width, slice.height);
              ctx.drawImage(
                canvas,
                0, offsetPx, canvas.width, sliceHeightPx,
                0, 0, canvas.width, sliceHeightPx
              );
            }
            if (!firstSlice) newPage();
            const sliceMM = (sliceHeightPx * contentWidth) / canvas.width;
            pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", marginMM, currentY, contentWidth, sliceMM);
            currentY += sliceMM;
            offsetPx += sliceHeightPx;
            firstSlice = false;
          }
          currentY += blockGap;
          continue;
        }

        let needsNewPage = false;
        const remaining = pdfHeight - marginMM - currentY;
        if (heightMM > remaining) needsNewPage = true;
        if (isExperience && experienceOnPage >= maxExperiencePerPage) needsNewPage = true;

        // Avoid orphaned header: if a header fits but its next block doesn't,
        // push both to a new page using the accurate pre-captured height.
        if (!needsNewPage && isHeader && i + 1 < captured.length) {
          const nextH = captured[i + 1].heightMM;
          if (heightMM + blockGap + nextH > remaining) needsNewPage = true;
        }

        if (needsNewPage && currentY > marginMM) {
          newPage();
        }

        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", marginMM, currentY, contentWidth, heightMM);
        currentY += heightMM + blockGap;
        if (isExperience) experienceOnPage++;
      }

      const filename = "Khalia-Padilla-Board-Chair-Resume-Space-Fund.pdf";
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.location.href = url;
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (pendingWindow && !pendingWindow.closed) pendingWindow.close();
      console.error("[PDF] generation failed", err);
      alert("PDF generation failed. Falling back to browser print — use 'Save as PDF' in the print dialog.\n\n" + (err instanceof Error ? err.message : String(err)));
      window.print();
    } finally {
      window.scrollTo({ top: initialScrollY, left: 0, behavior: "auto" });
      cvRef.current?.classList.remove("pdf-exporting");
      document.getElementById("pdf-export-overrides")?.remove();
      setIsExporting(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="kp-institutional min-h-screen">
      {/* Scoped institutional design system — light, editorial, sovereign-wealth-grade */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .kp-institutional {
          --ink: #0d1321;
          --ink-soft: #3b4252;
          --ink-mute: #6b7280;
          --paper: #f6f3ec;
          --paper-2: #efeae0;
          --rule: #d9d3c4;
          --navy: #1c2e4a;
          --navy-2: #2a426b;
          --gold: #a0813b;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', system-ui, sans-serif;
          font-feature-settings: 'ss01','cv11';
          letter-spacing: -0.005em;
        }
        .kp-institutional .kp-display { font-family: 'Cormorant Garamond', 'Times New Roman', serif; font-weight: 500; letter-spacing: -0.02em; color: var(--ink); }
        .kp-institutional .kp-mono { font-family: 'JetBrains Mono', monospace; }
        .kp-institutional .kp-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--navy); }
        .kp-institutional .kp-rule { height: 1px; background: var(--rule); }
        .kp-institutional .kp-rule-strong { height: 1px; background: var(--ink); }
        .kp-institutional .kp-card { background: #fdfbf6; border: 1px solid var(--rule); border-radius: 2px; }
        .kp-institutional .kp-section-num { font-family: 'JetBrains Mono', monospace; color: var(--gold); font-size: 11px; letter-spacing: 0.2em; }
        .kp-institutional .kp-link { color: var(--navy); text-decoration: underline; text-decoration-color: var(--rule); text-underline-offset: 3px; }
        .kp-institutional .kp-link:hover { text-decoration-color: var(--navy); }
        .kp-institutional .kp-tag { display: inline-block; padding: 4px 10px; border: 1px solid var(--rule); background: #fdfbf6; font-size: 11px; letter-spacing: 0.05em; color: var(--ink-soft); border-radius: 1px; }
        .kp-institutional .kp-grid-bg { background-image: linear-gradient(to right, rgba(28,46,74,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,46,74,0.04) 1px, transparent 1px); background-size: 48px 48px; }
        .kp-institutional .kp-tick-anim { animation: kp-tick 6s linear infinite; }
        @keyframes kp-tick { 0%,100% { opacity: 0.25 } 50% { opacity: 0.9 } }
        .kp-institutional .kp-line-anim { background: linear-gradient(90deg, transparent, var(--navy) 50%, transparent); background-size: 200% 100%; animation: kp-shift 8s linear infinite; }
        @keyframes kp-shift { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
        .kp-institutional [data-pdf-block] { background: var(--paper); }
        .kp-institutional .kp-card[data-pdf-block] { background: #fdfbf6; }
      `}</style>

      <Navigation />

      {/* Floating PDF action — restrained, dark navy */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handlePrintPDF}
          disabled={isExporting}
          size="lg"
          variant="outline"
          style={{ background: "#fdfbf6", color: "#1c2e4a", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, padding: "0 22px", height: 48, border: "1px solid #d9d3c4" }}
          className="hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4 mr-2" />Print / Save PDF
        </Button>
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          size="lg"
          style={{ background: "#1c2e4a", color: "#f6f3ec", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, padding: "0 22px", height: 48, border: "1px solid #2a426b" }}
          className="hover:opacity-90 transition-opacity"
        >
          {isExporting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PDF</>
          ) : (
            <><Download className="w-4 h-4 mr-2" />Download PDF</>
          )}
        </Button>
      </div>

      <div ref={cvRef}>
        {/* ── 01 EXECUTIVE HERO ───────────────────────────────────────────── */}
        <header data-pdf-block data-pdf-block-type="hero" className="relative pt-24 pb-16 overflow-hidden">
          {!isExporting && <div className="absolute inset-0 kp-grid-bg opacity-60 pointer-events-none" />}
          {!isExporting && <div className="absolute top-0 left-0 right-0 h-px kp-line-anim opacity-40 pointer-events-none" />}

          <div className="container mx-auto px-6 lg:px-10 relative">
            <div className="max-w-6xl mx-auto">

              {/* Top meta-bar */}
              <div className="flex items-center justify-between mb-12 pb-4" style={{ borderBottom: "1px solid var(--rule)" }}>
                <div className="kp-eyebrow">Executive Dossier · Confidential</div>
                <div className="kp-eyebrow hidden sm:block">REF / KP-2026 · BOARD &amp; INVESTMENT</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 kp-tick-anim" />
                  <span className="kp-eyebrow">Available · Q2 2026</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-end">
                <div>
                  <div className="kp-eyebrow mb-6">Khalia Padilla · Managing Partner · Decahedron</div>

                  <h1 className="kp-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.98] mb-8" style={{ color: "var(--ink)" }}>
                    Board &amp; Investment Leader<br/>
                    in the <em style={{ fontStyle: "italic", color: "var(--navy)" }}>Space Economy</em>,<br/>
                    Frontier Technology &amp;<br/>
                    Institutional Strategy.
                  </h1>

                  <p className="text-lg sm:text-xl leading-relaxed max-w-3xl" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>
                    Operating at the intersection of institutional capital, sovereign partnerships,
                    SpaceTech innovation and global infrastructure strategy.
                  </p>

                  <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 kp-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                    <span><span style={{ color: "var(--gold)" }}>◆</span>&nbsp; Decahedron Ventures</span>
                    <span><span style={{ color: "var(--gold)" }}>◆</span>&nbsp; Imagine Engine</span>
                    <span><span style={{ color: "var(--gold)" }}>◆</span>&nbsp; Lightware Technologies</span>
                    <span><span style={{ color: "var(--gold)" }}>◆</span>&nbsp; Startup Factory Hub</span>
                  </div>
                </div>

                {/* Portrait + frame */}
                <div className="relative shrink-0 mx-auto lg:mx-0">
                  <div className="relative" style={{ padding: 6, border: "1px solid var(--rule)", background: "#fdfbf6" }}>
                    <div className="relative overflow-hidden" style={{ width: 240, height: 300, background: "var(--paper-2)" }}>
                      <img src={portrait} alt="Khalia Padilla — executive portrait" className="w-full h-full object-cover" style={{ filter: isExporting ? "none" : "grayscale(0.85) contrast(1.05)" }} />
                    </div>
                    <div className="mt-3 px-1 flex items-center justify-between">
                      <span className="kp-mono text-[10px]" style={{ color: "var(--ink-mute)" }}>PORTRAIT · 2026</span>
                      <span className="kp-mono text-[10px]" style={{ color: "var(--gold)" }}>KP / 01</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero footer — credentials strip */}
              <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
                {[
                  { k: "Mandates", v: "Board · Investment · Advisory" },
                  { k: "Geographies", v: "US · EU · LATAM · Asia-Pacific" },
                  { k: "Sectors", v: "Space · Photonics · Quantum · AI" },
                  { k: "Languages", v: "English · Spanish" },
                ].map((c) => (
                  <div key={c.k} className="px-5 py-4" style={{ background: "#fdfbf6" }}>
                    <div className="kp-eyebrow mb-1.5">{c.k}</div>
                    <div className="text-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>{c.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ── 02 EXECUTIVE SUMMARY ────────────────────────────────────────── */}
        <Section num="02" title="Executive Summary" subtitle="Strategic biography &amp; investment posture">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
              <div>
                <div className="kp-eyebrow mb-3">Profile</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  Strategic investment leader and operating executive cultivating institutional relationships across the global space economy and frontier-technology sectors.
                </p>
              </div>
              <div className="space-y-6 text-base sm:text-lg leading-[1.75]" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>
                <p>
                  Khalia Padilla operates at the convergence of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>institutional capital, sovereign partnerships and frontier-technology commercialization</strong>. As Managing Partner of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Decahedron Ventures</strong> — an emerging institutional investment platform focused on SpaceTech, infrastructure and frontier innovation ecosystems — she leads investment thesis development, strategic diligence and partnership structuring across aerospace, photonics, quantum and sustainable infrastructure.
                </p>
                <p>
                  Decahedron is actively engaged in discussions with institutional limited partners, family offices and strategic capital sources, supporting investment-pipeline development and advancing strategic partnerships across cross-border corridors. The platform is developing investment frameworks anchored in a proprietary portfolio-construction methodology rooted in Golden Ratio (φ) allocation — a quantitative discipline for sizing positions, stage exposure and risk weighting across venture, growth and infrastructure stages.
                </p>
                <p>
                  Beyond capital, Ms. Padilla directs <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Imagine Engine</strong>, a private space agency and venture studio with active NASA research contracts, and serves as CEO of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Lightware Technologies</strong>, a NASA-backed photonics venture. Her institutional reach extends to a working network of space agencies, ministries and innovation councils across four continents — including service as <strong style={{ color: "var(--ink)", fontWeight: 500 }}>U.S. Delegate to the US–Japan 2024 Fast Track Dialogue</strong>.
                </p>
                <p>
                  She is positioned to chair institutional investment vehicles, sovereign councils and frontier-technology boards — bringing fiduciary discipline, governance literacy and a globally credible operating posture suited to the standards of public-market, sovereign-wealth and pension-grade institutional environments.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 01b COVER LETTER ────────────────────────────────────────────── */}
        <Section num="01b" title="Cover Letter" subtitle="Executive introduction &amp; strategic intent">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="space-y-6 text-base sm:text-lg leading-[1.75]" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>
              <p>
                I am writing to express my interest in advancing strategic, capital and governance mandates at the intersection of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>institutional investment, sovereign partnership and frontier-technology commercialization</strong>. My operating history spans venture formation, board governance, federal R&amp;D engagement and cross-border capital structuring across four continents — with active relationships spanning NASA, space agencies, ministries of economy and trade, and institutional limited partners.
              </p>
              <p>
                As Co-Founder &amp; Managing Partner of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Decahedron Ventures</strong>, I am building an emerging investment platform anchored in a proprietary φ-based portfolio construction methodology, targeting aerospace, quantum computing, energy, smart cities and sustainable infrastructure. As CEO of <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Imagine Engine</strong> and <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Lightware Technologies</strong>, I hold active NASA research contracts and lead photonics and space-technology programs — positioning these ventures as sovereign-grade partners for defense, space and institutional infrastructure programs.
              </p>
              <p>
                My governance footprint includes advisory and board mandates with Nobel-laureate-founded ventures, women-led aerospace organizations and national space consortia. I have served as <strong style={{ color: "var(--ink)", fontWeight: 500 }}>U.S. Delegate to the US–Japan 2024 Fast Track Dialogue</strong>, and maintain active bilateral relationships across Latin America, Asia-Pacific and Europe — including collaborations with 900 ecosystem partners in Venezuela focused on energy and investment mobilization.
              </p>
              <p>
                I am prepared to chair institutional investment vehicles, sovereign councils and frontier-technology boards — bringing fiduciary discipline, quantitative rigor and a globally credible operating posture suited to public-market, sovereign-wealth and pension-grade institutional environments. I welcome the opportunity to discuss how my capital-formation, partnership-architecture and governance capabilities can advance your strategic objectives.
              </p>
              <div className="pt-6" style={{ borderTop: "1px solid var(--rule)" }}>
                <p className="kp-mono text-sm" style={{ color: "var(--ink-mute)" }}>
                  Sincerely,
                </p>
                <p className="kp-display text-xl mt-2" style={{ color: "var(--ink)" }}>
                  Khalia Padilla
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 02b QUANTIFIED IMPACT ───────────────────────────────────────── */}
        <Section num="02b" title="Quantified Impact" subtitle="Capital deployed, revenue generated, communities reached">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {[
              {
                v: "40+",
                k: "Ventures Graduated",
                d: "Startups accelerated through the Startup Factory Hub across software, robotics, IoT, aerospace and deep tech.",
              },
              {
                v: "$1.56M",
                k: "Revenue Generated (Portfolio)",
                d: "Combined first-year and multi-year revenue across portfolio companies including Wonderlands World and Deltafood.",
              },
              {
                v: "6",
                k: "Deep-Tech Verticals",
                d: "Active technology domains spanning aerospace, quantum, photonics, telecom, AI and space systems.",
              },
              {
                v: "50+",
                k: "Institutional Partnerships",
                d: "Alliances with NASA labs, APEX Accelerator, Princeton, Lehigh, and sovereign space agencies.",
              },
              {
                v: "4",
                k: "Continents of Operation",
                d: "Active mandates across North America, Europe, Asia-Pacific and Latin America.",
              },
              {
                v: "+75%",
                k: "ML Matching Accuracy Lift",
                d: "Proprietary machine-learning algorithm increased investor-startup match accuracy by 75%.",
              },
            ].map((m) => (
              <div key={m.k} className="px-5 py-7" style={{ background: "#fdfbf6" }}>
                <div className="kp-display text-4xl sm:text-5xl" style={{ color: "var(--navy)", lineHeight: 1 }}>{m.v}</div>
                <div className="kp-mono text-[10px] mt-3" style={{ color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{m.k}</div>
                <p className="text-xs leading-relaxed mt-2" style={{ color: "var(--ink-soft)" }}>{m.d}</p>
              </div>
            ))}
          </div>
        </Section>


        {/* ── 03 KEY COMPETENCIES ─────────────────────────────────────────── */}
        <Section num="03" title="Key Competencies" subtitle="Institutional, investment &amp; governance taxonomy">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {[
              { t: "Investment Strategy", group: "Investment & Capital" },
              { t: "Space Economy", group: "Frontier Domains" },
              { t: "Frontier Technologies", group: "Frontier Domains" },
              { t: "Institutional Capital Formation", group: "Investment & Capital" },
              { t: "Strategic Partnerships", group: "Governance" },
              { t: "Infrastructure Investment", group: "Investment & Capital" },
              { t: "Board Governance", group: "Governance" },
              { t: "Sovereign Relations", group: "Governance" },
              { t: "Venture Ecosystems", group: "Investment & Capital" },
              { t: "International Negotiations", group: "Governance" },
              { t: "Policy & Regulatory Strategy", group: "Governance" },
              { t: "Portfolio Development", group: "Investment & Capital" },
              { t: "Cross-Border Transactions", group: "Investment & Capital" },
              { t: "Emerging Technology Markets", group: "Frontier Domains" },
            ].map((c, i) => (
              <div key={c.t} className="px-6 py-7" style={{ background: "#fdfbf6" }}>
                <div className="kp-mono text-[10px] mb-2" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")} · {c.group}</div>
                <div className="kp-display text-xl" style={{ color: "var(--ink)" }}>{c.t}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 04 INSTITUTIONAL INVESTMENT & GOVERNANCE ────────────────────── */}
        <Section num="04" title="Institutional Investment &amp; Governance" subtitle="Capital, diligence, partnership architecture">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {[
                { t: "Investment Sourcing", d: "Proprietary deal flow originated through a global network of accelerators, sovereign innovation offices and university research corridors." },
                { t: "Strategic Diligence", d: "Technical, commercial and policy diligence across SpaceTech, photonics, quantum and infrastructure transactions — including NASA-backed and dual-use programs." },
                { t: "Partnership Structuring", d: "Architects bilateral and tri-sector partnerships connecting institutional capital with sovereign stakeholders, research institutions and strategic corporates." },
                { t: "Portfolio Strategy", d: "Theme-led portfolio construction across venture, growth and infrastructure stages, anchored in a proprietary φ-based allocation framework." },
                { t: "Board Engagement", d: "Active board and advisory mandates spanning Nobel-laureate-founded ventures, women-led aerospace organizations and sovereign consortia." },
                { t: "Capital Formation", d: "Cultivating institutional, family-office and strategic-LP relationships; supporting investment-pipeline development for emerging space-economy vehicles." },
                { t: "Sovereign Collaboration", d: "Direct working channels with NASA, UK Space Agency, MYSA, Maldives Space Agency, METI and the National Space Consortium of Chile." },
                { t: "Infrastructure Investment Themes", d: "Energy, smart cities, satellite networks, optical communications and sustainable infrastructure — investable across institutional risk profiles." },
                { t: "SpaceTech Market Development", d: "Building accelerator infrastructure and capital pipelines that translate frontier research into commercial, defense and dual-use markets." },
                { t: "Cross-Border Strategic Initiatives", d: "Bilateral programs across US–Japan, US–Chile and emerging Asia-Pacific corridors structuring co-investment and policy alignment." },
              ].map((b, i) => (
                <div key={b.t} className="relative">
                  <div className="kp-mono text-xs mb-2" style={{ color: "var(--gold)" }}>0{i < 9 ? i + 1 : i + 1}</div>
                  <h3 className="kp-display text-2xl mb-2" style={{ color: "var(--ink)" }}>{b.t}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{b.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── 05 CAREER EXPERIENCE ────────────────────────────────────────── */}
        <Section num="05" title="Career Experience" subtitle="Operating, investment and governance mandates">
          <div className="space-y-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {experiences.map((exp, i) => (
              <div key={i} data-pdf-block data-pdf-block-type="experience" className="px-6 sm:px-10 py-8" style={{ background: "#fdfbf6" }}>
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 md:gap-10">
                  <div>
                    <div className="kp-mono text-[11px]" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</div>
                    <div className="kp-mono text-xs mt-2" style={{ color: "var(--ink-mute)" }}>{exp.period}</div>
                    <div className="kp-mono text-xs mt-1" style={{ color: "var(--ink-mute)" }}>{exp.location}</div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                      <h3 className="kp-display text-2xl sm:text-3xl" style={{ color: "var(--ink)" }}>{exp.role}</h3>
                      <span className="text-sm kp-mono" style={{ color: "var(--navy)", letterSpacing: "0.08em" }}>— {exp.org}</span>
                    </div>
                    <p className="text-base leading-[1.75]" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>{exp.desc}</p>
                    {(exp as any).metrics && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(exp as any).metrics.map((m: { k: string; v: string }, mi: number) => (
                          <div key={mi} className="px-4 py-4" style={{ background: "var(--navy)", border: "1px solid var(--navy-2)" }}>
                            <div className="kp-display text-2xl sm:text-3xl" style={{ color: "#f6f3ec", lineHeight: 1 }}>{m.v}</div>
                            <div className="kp-mono text-[9px] mt-2" style={{ color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{m.k}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 06 BOARD & ADVISORY LEADERSHIP ──────────────────────────────── */}
        <Section num="06" title="Board &amp; Advisory Leadership" subtitle="Council, governance and ecosystem mandates">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {advisoryPositions.map((a, i) => (
              <div key={i} className="px-6 py-7" style={{ background: "#fdfbf6" }}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="kp-mono text-[10px]" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="kp-display text-xl" style={{ color: "var(--ink)" }}>{a.role}</h3>
                </div>
                <div className="kp-mono text-[11px] mb-3" style={{ color: "var(--navy)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{a.org}</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{a.scope}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 07b PARTNERS & COLLABORATORS ────────────────────────────────── */}
        <Section num="07b" title="Partners &amp; Collaborators" subtitle="Institutional, agency &amp; research alliances">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
              {[
                { name: "NASA", sub: "National Aeronautics and Space Administration", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" },
                { name: "NASA Technology Transfer Program", sub: "T2 · Commercialization & dual-use", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" },
                { name: "NASA Kennedy Space Center", sub: "Florida · Launch & ground systems", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" },
                { name: "NASA Glenn Research Center", sub: "Ohio · Propulsion & comms research", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg" },
                { name: "UK Space Agency", sub: "United Kingdom", logo: "" },
                { name: "MYSA — Malaysian Space Agency", sub: "Malaysia", logo: "" },
                { name: "Maldives Space Agency", sub: "Indian Ocean", logo: "" },
                { name: "METI — Government of Japan", sub: "Ministry of Economy, Trade & Industry", logo: "" },
                { name: "National Space Consortium of Chile", sub: "Latin America", logo: "" },
                { name: "Venezuela", sub: "900 ecosystem partners · Energy & Investment", logo: "" },
                { name: "Space Florida", sub: "State spaceport authority", logo: "" },
                { name: "APEX Federal Network", sub: "U.S. federal contracting", logo: "" },
                { name: "Princeton · Lehigh", sub: "Research & tech transfer", logo: "" },
              ].map((p) => {
                const hasLogo = typeof p.logo === "string" && p.logo.trim().length > 0;

                return (
                  <div key={p.name} className="px-5 py-6 flex flex-col items-center justify-center text-center gap-3 min-h-[150px]" style={{ background: "#fdfbf6" }}>
                    {hasLogo ? (
                      <img
                        src={p.logo}
                        alt={`${p.name} logo`}
                        crossOrigin="anonymous"
                        data-pdf-ignore="true"
                        className="h-12 w-auto object-contain"
                        style={{ filter: "grayscale(0.2)" }}
                      />
                    ) : (
                      <div className="h-12 flex items-center justify-center">
                        <span className="kp-display text-lg" style={{ color: "var(--navy)" }}>{p.name.split(" ")[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="kp-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ink)" }}>{p.name}</div>
                      <div className="kp-mono text-[9px] mt-1" style={{ color: "var(--ink-mute)" }}>{p.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="kp-mono text-[10px] mt-6" style={{ color: "var(--ink-mute)" }}>
              Logos shown for identification purposes; partnerships described reflect direct engagements, contracts, mentor/advisor roles or active collaborations across the entities listed.
            </p>
          </div>
        </Section>

        {/* ── 08 DIPLOMATIC ENGAGEMENTS ───────────────────────────────────── */}

        <Section num="08" title="Diplomatic &amp; Sovereign Engagements" subtitle="Bilateral and multilateral counterpart authority">
          <div data-pdf-block data-pdf-block-type="summary" className="space-y-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {diplomaticEngagements.map((d, i) => (
              <div key={i} className="px-6 sm:px-10 py-7" style={{ background: "#fdfbf6" }}>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
                  <div>
                    <div className="kp-mono text-[10px] mb-2" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</div>
                    <h3 className="kp-display text-2xl" style={{ color: "var(--ink)" }}>{d.title}</h3>
                    <div className="kp-mono text-[11px] mt-2" style={{ color: "var(--navy)", letterSpacing: "0.1em" }}>{d.role}</div>
                    <div className="kp-mono text-[11px] mt-1" style={{ color: "var(--ink-mute)" }}>{d.counterpart}</div>
                  </div>
                  <p className="text-base leading-relaxed" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 09 RESEARCH PLATFORMS ───────────────────────────────────────── */}
        <Section num="09" title="Research Platforms" subtitle="Frontier-technology programs led or originated">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            {researchProjects.map((p, i) => (
              <div key={p.title} className="px-6 sm:px-8 py-7" style={{ background: "#fdfbf6" }}>
                <div className="kp-mono text-[10px] mb-2" style={{ color: "var(--gold)" }}>R&amp;D · {String(i + 1).padStart(2, "0")}</div>
                <h3 className="kp-display text-2xl mb-1" style={{ color: "var(--ink)" }}>{p.title}</h3>
                <div className="kp-mono text-[11px] mb-4" style={{ color: "var(--navy)", letterSpacing: "0.05em" }}>{p.tagline}</div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>{p.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t) => <span key={t} className="kp-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 10 MEDIA & RECOGNITION ──────────────────────────────────────── */}
        <Section num="10" title="Media &amp; Recognition" subtitle="Featured engagements and institutional collaborations">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="kp-card p-8">
              <div className="kp-eyebrow mb-5">Featured Engagements</div>
              <ul className="space-y-5">
                {interviews.map((i, idx) => (
                  <li key={i.title} className="grid grid-cols-[40px_1fr] gap-3 pb-4" style={{ borderBottom: idx < interviews.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <div className="kp-mono text-[10px] pt-1" style={{ color: "var(--gold)" }}>{String(idx + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="kp-display text-lg leading-tight" style={{ color: "var(--ink)" }}>{i.title}</div>
                      <div className="kp-mono text-[11px] mt-1" style={{ color: "var(--navy)" }}>{i.outlet}</div>
                      <div className="kp-mono text-[10px] mt-0.5" style={{ color: "var(--ink-mute)" }}>{i.type}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="kp-card p-8">
              <div className="kp-eyebrow mb-5">Honors &amp; Distinctions</div>
              <ul className="space-y-4">
                {honors.map((h, i) => (
                  <li key={i} className="grid grid-cols-[40px_1fr] gap-3 pb-4" style={{ borderBottom: i < honors.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <div className="kp-mono text-[10px] pt-1" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{h}</div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 flex items-center gap-4" style={{ borderTop: "1px solid var(--rule)" }}>
                <img src={designThinkingBadge} alt="USF Muma — Design Thinking Program Advisor" className="w-16 h-16 object-contain" style={{ filter: "grayscale(0.7)" }} crossOrigin="anonymous" />
                <div>
                  <div className="kp-eyebrow">Program Advisor</div>
                  <div className="kp-display text-base" style={{ color: "var(--ink)" }}>USF Muma · Design Thinking</div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 11 CERTIFICATIONS & EDUCATION ───────────────────────────────── */}
        <Section num="11" title="Credentials &amp; Education" subtitle="Compliance, research and academic posture">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-px" style={{ background: "var(--rule)", border: "1px solid var(--rule)" }}>
            <div className="px-6 sm:px-8 py-7" style={{ background: "#fdfbf6" }}>
              <div className="kp-eyebrow mb-5">Certifications</div>
              <div className="space-y-5">
                {certifications.map((c, i) => (
                  <div key={i} className="pb-4" style={{ borderBottom: i < certifications.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <h4 className="kp-display text-lg" style={{ color: "var(--ink)" }}>{c.title}</h4>
                      <span className="kp-mono text-[10px] shrink-0" style={{ color: "var(--ink-mute)" }}>{c.issued}</span>
                    </div>
                    <div className="kp-mono text-[11px]" style={{ color: "var(--navy)" }}>{c.issuer}</div>
                    {c.note && <div className="text-xs mt-1 italic" style={{ color: "var(--ink-mute)" }}>{c.note}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 sm:px-8 py-7" style={{ background: "#fdfbf6" }}>
              <div className="kp-eyebrow mb-5">Education</div>
              <div className="space-y-5">
                <div>
                  <div className="kp-mono text-[10px]" style={{ color: "var(--ink-mute)" }}>2015 — 2016</div>
                  <h4 className="kp-display text-xl mt-1" style={{ color: "var(--ink)" }}>Associate of Arts — Journalism</h4>
                  <div className="kp-mono text-[11px] mt-1" style={{ color: "var(--navy)" }}>Valencia College</div>
                </div>
                <div className="pt-5" style={{ borderTop: "1px solid var(--rule)" }}>
                  <div className="kp-mono text-[10px]" style={{ color: "var(--ink-mute)" }}>2015</div>
                  <h4 className="kp-display text-xl mt-1" style={{ color: "var(--ink)" }}>High School Diploma</h4>
                  <div className="kp-mono text-[11px] mt-1" style={{ color: "var(--navy)" }}>West Orange High School</div>
                </div>
                <div className="pt-5 mt-5" style={{ borderTop: "1px solid var(--rule)" }}>
                  <div className="kp-eyebrow mb-3">Academic Network</div>
                  <ul className="space-y-2">
                    {universityNetwork.map((u) => (
                      <li key={u} className="text-sm" style={{ color: "var(--ink-soft)" }}>— {u}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 12 CONTACT ──────────────────────────────────────────────────── */}
        <Section num="12" title="Contact" subtitle="Executive inquiries · Strategic partnerships · Board opportunities">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="kp-eyebrow mb-2">Direct</div>
                <a href="mailto:khaliapadilla@gmail.com" className="kp-display text-2xl block kp-link" style={{ color: "var(--ink)" }}>khaliapadilla@gmail.com</a>
                <a href="tel:+14077604873" className="kp-mono text-sm mt-2 block" style={{ color: "var(--ink-soft)" }}>+1 (407) 760-4873</a>
              </div>
              <div>
                <div className="kp-eyebrow mb-2">Network</div>
                <a href="https://www.linkedin.com/in/khaliapadilla" target="_blank" rel="noopener noreferrer" className="kp-display text-2xl block kp-link" style={{ color: "var(--ink)" }}>LinkedIn / khaliapadilla</a>
                <div className="kp-mono text-sm mt-2" style={{ color: "var(--ink-soft)" }}>Decahedron Ventures · Imagine Engine</div>
              </div>
              <div>
                <div className="kp-eyebrow mb-2">Inquiries</div>
                <ul className="space-y-1.5 kp-mono text-sm" style={{ color: "var(--ink-soft)" }}>
                  <li>— Executive Search</li>
                  <li>— Strategic Partnerships</li>
                  <li>— Board Opportunities</li>
                  <li>— Institutional Capital</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="container mx-auto px-6 lg:px-10 pt-10 pb-16">
          <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: "1px solid var(--rule)" }}>
            <div className="kp-mono text-[11px]" style={{ color: "var(--ink-mute)", letterSpacing: "0.18em" }}>KHALIA PADILLA · EXECUTIVE DOSSIER · 2026</div>
            <div className="kp-mono text-[10px]" style={{ color: "var(--ink-mute)", letterSpacing: "0.18em" }}>CONFIDENTIAL · PREPARED FOR INSTITUTIONAL REVIEW</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Section primitive ─────────────────────────────────────────────────
function Section({ num, title, subtitle, children }: { num: string; title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <div data-pdf-block data-pdf-block-type="header" className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 md:gap-10 items-end mb-10 pb-5" style={{ borderBottom: "1px solid var(--ink, #0d1321)" }}>
          <div className="kp-section-num">SECTION&nbsp;/&nbsp;{num}</div>
          <div>
            {typeof title === "string" ? (
              <h2 className="kp-display text-3xl sm:text-4xl lg:text-5xl leading-none" style={{ color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: title }} />
            ) : (
              <h2 className="kp-display text-3xl sm:text-4xl lg:text-5xl leading-none" style={{ color: "var(--ink)" }}>{title}</h2>
            )}
            {subtitle && <div className="kp-eyebrow mt-3" dangerouslySetInnerHTML={{ __html: subtitle }} />}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
