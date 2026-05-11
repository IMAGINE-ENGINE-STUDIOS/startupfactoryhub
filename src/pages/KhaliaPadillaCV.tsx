import { useEffect, useRef, useState } from "react";
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
    desc: "Lead capital deployment seed through Series C across aerospace, quantum computing, energy, smart cities and sustainable infrastructure. Set the firm's investment theses, structure complex deals, anchor LP relationships, and chair portfolio guidance for high-growth ventures across emerging markets. Developed a proprietary mathematical portfolio-construction formula based on Golden Ratio (φ) allocation — sizing positions, stage exposure and risk weighting along φ-derived ratios to balance conviction, diversification and follow-on reserves across the fund. Convert proprietary deal flow into institutional-grade allocation across venture, growth and infrastructure exposure.",
    icon: Rocket,
  },
  {
    period: "Jan 2025 — Present",
    role: "Chief Executive Officer",
    org: "Imagine Engine",
    location: "United States",
    desc: "Run a private space agency and venture studio integrating research, engineering, commercialization and capital formation under one operating model — across aerospace, quantum, photonics, telecom, AI and deep-tech engineering. Secured active NASA research contracts in quantum, anchoring the studio's quantum stack with federally-funded R&D and positioning Imagine Engine as a sovereign-grade partner for institutional space and defense programs.",
    icon: Sparkles,
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
  },
  {
    period: "Mar 2024 — Present",
    role: "CEO & Managing Partner · Co-Founder",
    org: "Startup Factory Hub",
    location: "United States",
    desc: "Built and run a global accelerator and venture builder graduating 40+ ventures from ideation through Series A–C across software, robotics, IoT, aerospace and deep tech. Capital and partnership engine: 12+ VC firms and family offices, 50+ institutional partnerships, and active alliances with two NASA labs (dual-use commercialization), the APEX Accelerator network (federal contracting), and Lehigh and Princeton (research, talent, tech transfer). Shipped proprietary AI matching connecting startups to corporate partners, government contracts and investors, and run the demo-day, investor and ecosystem cadence end to end.",
    icon: Rocket,
  },
  {
    period: "Jan 2024 — Present",
    role: "CEO & Co-Founder",
    org: "Lightware Technologies",
    location: "Orlando, FL",
    desc: "Lead a NASA-backed photonics venture that has already validated 80 Tbps across an end-to-end modular optical network spanning terrestrial telecom, AI data centers and space-based links. The Lightband Network replaces electronic bottlenecks with light-speed data and optical energy transfer; NASA backing positions the platform as institutional, defense and space-grade infrastructure. Recipient of the Global Recognition Award — Innovation Category — for advancing optical communications.",
    icon: Zap,
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
  },
  {
    period: "Oct 2023 — Present",
    role: "Advisor",
    org: "Startupbootcamp",
    location: "Remote",
    desc: "Advise early-stage founders across one of the world's leading global accelerator networks on strategy, product and market positioning. Helped a portfolio startup refine its model and close a material funding round; route founders into investor and industry partnerships, run workshops and networking programs, and deliver market and competitive research that drives positioning and growth decisions.",
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
    org: "Woman Aero STEM",
    location: "Latin America / Global",
    desc: "Board advisor to a women-led aerospace and STEM organization expanding across Latin America. Shape long-term strategy, plan women-led analog missions, and structure academic, industry and government partnerships that build the next generation of aerospace talent.",
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
  },
  {
    period: "May 2022 — Mar 2023",
    role: "Co-Founder",
    org: "Cocoa & Blues",
    location: "Camarles, Catalonia, Spain",
    desc: "Co-founded and operated a family coffee bar and restaurant with premium grilled meats and a live performance stage. Owned P&L, hiring, training, scheduling and quality assurance — earned the Best Dish Award (Professional Category).",
    icon: Sparkles,
  },
  {
    period: "Oct 2016 — Feb 2017",
    role: "Corporate Sales Specialist",
    org: "T-Mobile",
    location: "Greater Orlando",
    desc: "B2B corporate sales across Greater Orlando — owned end-to-end sales cycles for SMB wireless and connectivity, consistently exceeded monthly quota, and closed multi-line deals across retail, logistics and healthcare.",
    icon: Briefcase,
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
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const rawBg = getComputedStyle(document.body).backgroundColor;
      const parseRgb = (s: string): [number, number, number] => {
        const m = s.match(/rgba?\(([^)]+)\)/);
        if (!m) return [10, 10, 10];
        const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
        const [r, g, b, a = 1] = parts;
        if (!a || a === 0 || Number.isNaN(r)) return [10, 10, 10];
        return [Math.round(r), Math.round(g), Math.round(b)];
      };
      const [bgR, bgG, bgB] = parseRgb(rawBg);
      const bgHex = `#${[bgR, bgG, bgB].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginMM = 10;
      const contentWidth = pdfWidth - marginMM * 2;
      const contentHeight = pdfHeight - marginMM * 2;
      const blockGap = 4;
      const maxExperiencePerPage = 5;

      const pdf = new jsPDF("p", "mm", "a4");

      const fillPageBg = () => {
        pdf.setFillColor(bgR, bgG, bgB);
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      };

      // Capture a single block (HTMLElement) -> { canvas, heightMM }
      const captureBlock = async (el: HTMLElement) => {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: bgHex,
          windowWidth: el.scrollWidth,
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
        const { canvas, heightMM } = await captureBlock(el);
        captured.push({
          canvas,
          heightMM,
          type,
          isExperience: type === "experience",
          isHeader: type === "header",
        });
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

        // Oversized single block -> slice across pages
        if (heightMM > contentHeight) {
          if (currentY > marginMM) newPage();
          const pxPerMM = canvas.width / contentWidth;
          const pageSlicePx = contentHeight * pxPerMM;
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

      pdf.save("Khalia-Padilla-Board-Chair-Resume-Space-Fund.pdf");
    } finally {
      cvRef.current?.classList.remove("pdf-exporting");
      document.getElementById("pdf-export-overrides")?.remove();
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <Button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          size="lg"
          className="shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] transition-shadow"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download CV as PDF
            </>
          )}
        </Button>
      </div>

      <div ref={cvRef}>
        {/* Cover — unified composition (Nasdaq feature + identity) */}
        <header
          data-pdf-block
          data-pdf-block-type="hero"
          className="relative pt-20 sm:pt-24 pb-12 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden border border-primary/30 bg-card/40 backdrop-blur shadow-[0_0_80px_hsl(var(--primary)/0.25)]">
                {/* Top: Nasdaq feature strip */}
                <div className="relative h-44 sm:h-56 lg:h-64 overflow-hidden">
                  <img
                    src={nasdaqFeature}
                    alt="Khalia Padilla featured on the Nasdaq Tower in Times Square, New York City"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
                  <div className="absolute top-4 left-4 sm:top-5 sm:left-5">
                    <Badge
                      variant="outline"
                      className="bg-background/60 backdrop-blur border-primary/50 text-primary tracking-[0.25em] uppercase text-[10px] sm:text-xs"
                    >
                      As Featured On Nasdaq Tower · Times Square
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
                    <Badge
                      variant="outline"
                      className="bg-background/60 backdrop-blur border-primary/40 text-primary/90 tracking-[0.25em] uppercase text-[10px] sm:text-xs"
                    >
                      Executive Resume · Board Chair Candidate
                    </Badge>
                  </div>
                </div>

                {/* Identity block — portrait pulled up over the strip for cohesion */}
                <div className="relative px-5 sm:px-8 lg:px-10 pb-8 sm:pb-10 -mt-16 sm:-mt-20">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-end md:items-center">
                    <div className="relative mx-auto md:mx-0">
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-xl" />
                      <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-2 border-primary/50 ring-4 ring-background shadow-[0_0_40px_hsl(var(--primary)/0.35)]">
                        <img
                          src={portrait}
                          alt="Khalia Padilla portrait"
                          className="w-full h-full object-cover grayscale contrast-110"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>

                    <div className="text-center md:text-left">
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent leading-[0.95]">
                        Khalia Padilla
                      </h1>
                      <p className="mt-3 text-xs sm:text-sm text-primary tracking-[0.25em] uppercase font-medium">
                        Founder · Board Chair · Institutional Capital · Space Economy
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground tracking-[0.2em] uppercase">
                        Prepared for Chair Consideration — Institutional Space-Economy Fund
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-6 sm:my-8 flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  </div>

                  {/* Credential badges */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/25 text-[11px] sm:text-xs">
                      <Crown className="w-3 h-3 mr-1" /> Founder
                    </Badge>
                    <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-[11px] sm:text-xs">
                      <Crown className="w-3 h-3 mr-1" /> Fiduciary & Capital Allocator
                    </Badge>
                    <Badge className="bg-accent/15 text-accent-foreground border border-accent/30 hover:bg-accent/20 text-[11px] sm:text-xs">
                      <Rocket className="w-3 h-3 mr-1" /> Space Economy Authority
                    </Badge>
                    <Badge className="bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15 text-[11px] sm:text-xs">
                      <Sparkles className="w-3 h-3 mr-1" /> Featured on Nasdaq Tower
                    </Badge>
                    <Badge className="bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15 text-[11px] sm:text-xs">
                      <Award className="w-3 h-3 mr-1" /> Global Recognition Award
                    </Badge>
                    <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-[11px] sm:text-xs">
                      <ShieldCheck className="w-3 h-3 mr-1" /> NASA-Trained · Remote Sensing
                    </Badge>
                    <Badge className="bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15 text-[11px] sm:text-xs">
                      <Building2 className="w-3 h-3 mr-1" /> US · EU · LATAM · Asia-Pacific
                    </Badge>
                    <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-[11px] sm:text-xs">
                      <Handshake className="w-3 h-3 mr-1" /> US–Japan Fast Track 2024
                    </Badge>
                    <Badge className="bg-accent/15 text-accent-foreground border border-accent/30 hover:bg-accent/20 text-[11px] sm:text-xs">
                      <Landmark className="w-3 h-3 mr-1" /> Government & Space-Agency Network
                    </Badge>
                  </div>

                  {/* Tagline */}
                  <p className="mt-6 text-sm sm:text-base text-muted-foreground leading-relaxed text-center md:text-left max-w-3xl">
                    Board Chair candidate for institutional-grade space and frontier-technology funds.
                    Fiduciary leader and capital allocator with direct authority over{" "}
                    <span className="text-foreground font-medium">
                      investment thesis, portfolio construction and value creation
                    </span>{" "}
                    across venture, growth and infrastructure stages of the space, photonics, quantum and AI
                    value chain — operating at the intersection of{" "}
                    <span className="text-foreground font-medium">
                      institutional capital, sovereign stakeholders and global markets
                    </span>
                    .
                  </p>

                  {/* Contact strip */}
                  <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <a
                      href="mailto:khaliapadilla@gmail.com"
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border/50 bg-background/50 backdrop-blur hover:border-primary/50 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-xs break-all min-w-0">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Email
                        </div>
                        <div className="font-medium text-foreground truncate">khaliapadilla@gmail.com</div>
                      </div>
                    </a>
                    <a
                      href="tel:+14077604873"
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border/50 bg-background/50 backdrop-blur hover:border-primary/50 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Direct
                        </div>
                        <div className="font-medium text-foreground">+1 (407) 760-4873</div>
                      </div>
                    </a>
                    <a
                      href="https://www.linkedin.com/in/khaliapadilla"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 p-3 rounded-lg border border-border/50 bg-background/50 backdrop-blur hover:border-primary/50 transition-colors"
                    >
                      <Linkedin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-xs break-all min-w-0">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          LinkedIn
                        </div>
                        <div className="font-medium text-foreground truncate">/in/khaliapadilla</div>
                      </div>
                    </a>
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/50 bg-background/50 backdrop-blur">
                      <Languages className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
                          Languages
                        </div>
                        <div className="font-medium text-foreground">English · Spanish</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Executive Summary */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Executive Summary</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <div className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">Board-level operator and capital allocator</span> with a
                  multi-fund, multi-continent track record across <span className="text-foreground font-medium">aerospace, photonics,
                  quantum, AI, energy and sustainable infrastructure</span> — built to chair an institutional
                  space-economy vehicle and govern capital with index-eligible, fiduciary-grade discipline.
                </p>
                <p>
                  As Managing Partner of <span className="text-foreground font-medium">Decahedron Ventures</span> and CEO of
                  <span className="text-foreground font-medium"> Imagine Engine</span> (NASA-contracted private space agency),
                  deploys capital from seed through Series C and converts <span className="text-foreground font-medium">50+ institutional
                  partnerships, a 12+ VC / family-office network and a 40+ venture portfolio</span> into proprietary
                  deal flow, follow-on capacity and co-investment for institutional LPs.
                </p>
                <p>
                  Operating reach validated at the highest level: <span className="text-foreground font-medium">U.S. Delegate to
                  the US–Japan 2024 Fast Track Dialogue</span>, direct counterpart authority with NASA, UK, Japan,
                  Chile, Malaysia, the Maldives, Thailand, Honduras and Uruguay, <span className="text-foreground font-medium">80 Tbps
                  validated optical transmission</span> through Lightware, and a <span className="text-foreground font-medium">Nasdaq
                  Tower feature</span> — delivering deal flow, regulatory access and bilateral capital pipelines no peer brings to the table.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Leadership Value Proposition */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Leadership Value Proposition</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <p className="text-base sm:text-lg text-foreground leading-relaxed font-medium italic">
                "A live operating network across the world's space agencies, sovereign governments and the
                global space ecosystem — converted into deal flow, regulatory access and bilateral capital
                pipelines no other Chair candidate brings to the table."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {[
                  {
                    title: "Capital Allocation & Deal Authority",
                    body: "Manages a 12+ VC and family-office network and 50+ institutional partnerships across a 40+ venture portfolio. Decahedron Ventures deploys seed through Series C, converting proprietary deal flow into chair-grade decisions across venture, growth and infrastructure.",
                  },
                  {
                    title: "Space-Agency Network",
                    body: "Direct working channels with NASA, UK Space Agency, MYSA, Maldives Space Agency and the National Space Consortium of Chile — opening sovereign programs, data rights and co-investment for institutional vehicles.",
                  },
                  {
                    title: "Government & Diplomatic Reach",
                    body: "U.S. Delegate, US–Japan 2024 Fast Track Dialogue. Active counterpart engagement with METI, Japan's Ministry of Trade, NIA Thailand, and the Governments of Honduras and Uruguay.",
                  },
                ].map((b) => (
                  <div key={b.title} className="p-5 rounded-lg border border-primary/20 bg-primary/5">
                    <h3 className="text-sm font-semibold text-foreground tracking-wide mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Selected Career Highlights */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Selected Career Highlights</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <ul className="space-y-4">
                {[
                  "Deploys capital seed through Series C as Managing Partner, Decahedron Ventures — active theses across aerospace, quantum, energy, smart cities and sustainable infrastructure.",
                  "Built and runs a 12+ VC and family-office capital network on top of 50+ institutional partnerships and a 40+ venture portfolio — proprietary deal flow, co-investment and follow-on pipelines on demand.",
                  "Holds active NASA research contracts through Imagine Engine (private space agency) and Lightware Technologies — federally-funded R&D positioned as sovereign-grade defense and space assets.",
                  "Validated 80 Tbps optical transmission with Lightware across terrestrial, AI data-center and orbital networks — awarded the Global Recognition Award (Innovation Category) for advancing optical communications.",
                  "U.S. Delegate, US–Japan 2024 Fast Track Dialogue — active counterpart authority with NASA, UK Space Agency, MYSA, Maldives Space Agency, METI, NIA Thailand and the Governments of Honduras, Uruguay and Chile.",
                  "Board and advisory mandates across Nobel-laureate-founded ventures (Korb Satellite Systems) and global accelerator networks (Startupbootcamp, Nasdaq Entrepreneurial Center, Alliander).",
                  "Featured on the Nasdaq Tower, Times Square — public-market visibility aligned with index-eligible, search-firm and institutional-investor positioning.",
                  "NASA ARSET-trained in remote sensing; CITI Conflict-of-Interest credentialed for federally-funded research; U.S. National Archives Researcher — fiduciary and compliance posture required at Chair level.",
                ].map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Areas of Executive Expertise */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Areas of Executive Expertise</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <div className="flex flex-wrap gap-2">
                {[
                  "Board Chair Leadership",
                  "Fiduciary Duty & Stewardship",
                  "Investment Committee Oversight",
                  "Institutional Capital Allocation",
                  "Asset Management Strategy",
                  "Thematic & Sector Funds",
                  "Space Economy Investment Thesis",
                  "Satellite & Earth Observation Markets",
                  "Aerospace & Defense Commercialization",
                  "Photonics & Optical Networks",
                  "Quantum & AI Strategy",
                  "Sustainable Infrastructure & ESG",
                  "Index-Eligible Asset Construction",
                  "Public–Private Partnerships",
                  "Government, NASA & Space-Agency Programs",
                  "LP / GP Relations",
                  "M&A & Deal Structuring",
                  "Portfolio Construction & Risk Oversight",
                  "Conflict-of-Interest & Federal Research Compliance",
                  "Cross-Border Governance (US · EU · Asia-Pacific · LATAM)",
                  "Executive Team Building",
                  "Institutional Investor Communications",
                ].map((kw) => (
                  <Badge key={kw} variant="outline" className="border-primary/30 text-foreground bg-primary/5">
                    {kw}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Global Ecosystem & Government Network */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Global Ecosystem & Government Network</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                A working ecosystem built across <span className="text-foreground font-medium">space agencies, ministries
                and innovation offices on four continents</span> — providing direct access to sovereign capital,
                regulatory pathways and bilateral programs that institutional space funds require to deploy globally.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ecosystemNetwork.map((region) => (
                  <div
                    key={region.region}
                    className="p-5 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground tracking-wide uppercase">
                        {region.region}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {region.entities.map((e) => (
                        <li
                          key={e}
                          className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* University Network */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">University Network</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                Active engagement with leading <span className="text-foreground font-medium">research universities
                and academic communities</span> — bridging frontier research, talent pipelines and deep-tech
                commercialization across the space and innovation economy.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {universityNetwork.map((u) => (
                  <div
                    key={u}
                    className="flex items-center gap-3 p-4 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <div className="w-9 h-9 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground font-medium leading-snug">{u}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Diplomatic Delegate Engagements */}
        <section data-pdf-section data-pdf-block data-pdf-block-type="summary" className="container mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Diplomatic Delegate Engagements</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                Bilateral and multilateral engagements representing U.S. interests and structuring
                cross-border space-economy programs with sovereign counterparts.
              </p>
              <div className="space-y-5">
                {diplomaticEngagements.map((d) => (
                  <div
                    key={d.title}
                    className="p-6 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0 shadow-[0_0_18px_hsl(var(--primary)/0.2)]">
                        <Handshake className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">
                          {d.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs uppercase tracking-wider">
                          <span className="text-primary font-medium">{d.role}</span>
                          <span className="text-border">•</span>
                          <span className="text-muted-foreground">{d.counterpart}</span>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mt-3">
                          {d.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Experience */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Professional Experience</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent hidden sm:block" />
              <div className="space-y-6">
                {experiences.map((exp, i) => {
                  const Icon = exp.icon;
                  return (
                    <div key={i} data-pdf-block data-pdf-block-type="experience" className="relative sm:pl-20">
                      <div className="absolute left-0 top-6 hidden sm:flex w-12 h-12 rounded-full border border-primary/40 bg-card items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <Card className="p-6 sm:p-7 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors">
                        <div className="flex items-start gap-4 sm:hidden mb-4">
                          <div className="w-10 h-10 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{exp.role}</h3>
                          <span className="text-primary text-sm font-medium">@ {exp.org}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3 uppercase tracking-wider">
                          <span>{exp.period}</span>
                          <span className="text-border">•</span>
                          <span>{exp.location}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{exp.desc}</p>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Research Projects */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Research Projects</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="space-y-6">
              {Array.from({ length: Math.ceil(researchProjects.length / 2) }).map((_, rowIdx) => {
                const pair = researchProjects.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <div
                    key={`research-row-${rowIdx}`}
                    data-pdf-block
                    data-pdf-block-type="research-row"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {pair.map((p) => {
                      const Icon = p.icon;
                      return (
                        <Card
                          key={p.title}
                          className="p-6 sm:p-7 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors flex flex-col"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-11 h-11 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0 shadow-[0_0_18px_hsl(var(--primary)/0.2)]">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-foreground leading-tight">
                                {p.title}
                              </h3>
                              <p className="text-primary text-xs sm:text-sm mt-1 leading-snug">
                                {p.tagline}
                              </p>
                            </div>
                          </div>
                          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base flex-1">
                            {p.desc}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-5">
                            {p.tags.map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="border-primary/30 text-foreground bg-primary/5 text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Interviews & Media */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Interviews & Media</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: Math.ceil(interviews.length / 2) }).map((_, rowIdx) => {
                const pair = interviews.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <div
                    key={rowIdx}
                    data-pdf-block
                    data-pdf-block-type="interview-row"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {pair.map((i) => (
                      <Card
                        key={i.title}
                        className="p-4 sm:p-5 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors flex items-start gap-3"
                      >
                        <div className="w-9 h-9 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0 shadow-[0_0_18px_hsl(var(--primary)/0.2)]">
                          <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                            {i.title}
                          </h3>
                          <div className="text-primary text-xs sm:text-sm mt-1">{i.outlet}</div>
                          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                            {i.type}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Education */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Education</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card data-pdf-block data-pdf-block-type="education" className="p-6 bg-card/40 backdrop-blur border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">2015 — 2016</div>
                    <h3 className="text-lg font-semibold text-foreground">Associate of Arts — Journalism</h3>
                    <div className="text-primary text-sm">Valencia College</div>
                  </div>
                </div>
              </Card>
              <Card data-pdf-block data-pdf-block-type="education" className="p-6 bg-card/40 backdrop-blur border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">2015</div>
                    <h3 className="text-lg font-semibold text-foreground">High School Diploma</h3>
                    <div className="text-primary text-sm">West Orange High School</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Honors */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Honors & Awards</h2>
            </div>
            <Card data-pdf-block data-pdf-block-type="honors" className="p-6 bg-card/40 backdrop-blur border border-border/50">
              <div className="flex items-start gap-5">
                <img
                  src={designThinkingBadge}
                  alt="USF Muma College of Business — Design Thinking 2022 Program Advisor badge"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0 drop-shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
                  crossOrigin="anonymous"
                />
                <ul className="space-y-3 flex-1">
                  {honors.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </section>

        {/* Certifications */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Certifications</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: Math.ceil(certifications.length / 2) }).map((_, rowIdx) => {
                const pair = certifications.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <div
                    key={`cert-row-${rowIdx}`}
                    data-pdf-block
                    data-pdf-block-type="cert-row"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {pair.map((c, i) => (
                      <Card
                        key={`${rowIdx}-${i}`}
                        className="p-5 sm:p-6 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0">
                            <Award className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                              {c.title}
                            </h3>
                            <div className="text-primary text-sm mt-1">{c.issuer}</div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                              <span>Issued {c.issued}</span>
                              {c.expires && (
                                <>
                                  <span className="text-border">•</span>
                                  <span>Expires {c.expires}</span>
                                </>
                              )}
                              {c.credentialId && (
                                <>
                                  <span className="text-border">•</span>
                                  <span>ID {c.credentialId}</span>
                                </>
                              )}
                            </div>
                            {c.note && (
                              <p className="text-xs text-muted-foreground mt-2 italic">{c.note}</p>
                            )}
                            {c.skills && c.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {c.skills.map((s) => (
                                  <Badge
                                    key={s}
                                    variant="outline"
                                    className="border-primary/30 text-foreground bg-primary/5 text-[10px] sm:text-xs"
                                  >
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* Skills */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Skills</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="space-y-6">
              {Array.from({ length: Math.ceil(skillCategories.length / 2) }).map((_, rowIdx) => {
                const pair = skillCategories.slice(rowIdx * 2, rowIdx * 2 + 2);
                return (
                  <div
                    key={`skill-row-${rowIdx}`}
                    data-pdf-block
                    data-pdf-block-type="skill-row"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {pair.map((cat) => (
                      <Card key={cat.title} className="p-6 bg-card/40 backdrop-blur border border-border/50">
                        <div className="flex items-center gap-3 mb-4">
                          <Palette className="w-4 h-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground tracking-wide">{cat.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((s) => (
                            <Badge key={s} variant="outline" className="border-primary/30 text-foreground bg-primary/5">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Beyond Work */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div data-pdf-block data-pdf-block-type="header" className="flex items-center gap-3 mb-6">
              <Music className="w-5 h-5 text-primary" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Beyond Work</h2>
            </div>
            <Card data-pdf-block data-pdf-block-type="beyond" className="p-6 bg-card/40 backdrop-blur border border-border/50">
              <div className="flex flex-wrap gap-2">
                {passions.map((p, i) => (
                  <Badge key={i} variant="outline" className="border-primary/30 text-foreground bg-primary/5">
                    {p}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <footer className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto text-center text-xs text-muted-foreground tracking-[0.3em] uppercase">
            Khalia Padilla — Executive Resume
          </div>
        </footer>
      </div>
    </div>
  );
}
