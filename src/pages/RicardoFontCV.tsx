import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Languages,
  Briefcase,
  GraduationCap,
  FlaskConical,
  Sparkles,
  Rocket,
  Shield,
  Zap,
  Brain,
  Globe2,
  Building2,
  Cpu,
  Calendar,
  Award,
  Crown,
  Download,
  Loader2,
  Printer,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import portrait from "@/assets/ricardo-font-portrait.png";

// Ordered chronologically — most recent first
const experiences = [
  {
    period: "2026 — Present",
    role: "Founder · Chairman · Chief Government Relations",
    org: "Gold Arrow",
    location: "Global",
    desc: "A live commodity marketplace tokenizing real-world assets — bullion, oil, LNG, natural gas, rare earth minerals, bonds and livestock — bridging traditional commodity markets with on-chain liquidity and transparent, real-time price discovery.",
    icon: Crown,
    metrics: [{ k: "Focus", v: "Tokenized Securities" },{ k: "Scope", v: "Cross-Border Trading" },{ k: "Partners", v: "Gov + Institutional" }],
  },
  {
    period: "2025 — Present",
    role: "Managing Partner",
    org: "Decahedron Ventures",
    location: "Global",
    desc: "A venture firm deploying $100M into space and deep-tech infrastructure, with a focus on pre-IPO companies shaping the next generation of orbital, energy and frontier-technology platforms.",
    icon: Rocket,
    metrics: [{ k: "Status", v: "Emerging Fund" },{ k: "Thesis Verticals", v: "5 Frontier Sectors" },{ k: "Allocation Model", v: "φ Golden Ratio" }],
  },
  {
    period: "2025 — Present",
    role: "Advisor · Partner",
    org: "Copernic Space",
    location: "Los Angeles, CA",
    desc: "The world's first marketplace for space assets — enabling investors to own fractions of satellites and spacecraft, and to launch art into orbit. Advising on technology strategy and product direction.",
    icon: Sparkles,
  },
  {
    period: "Jan 2025 — Present",
    role: "Advisor · Business Developer · Partner",
    org: "KORB Satellite Corp",
    location: "Ohio, USA",
    desc: "Innovative satellite designer and manufacturer founded by Nobel laureates, with 20+ patents in photonics, data analytics and the world's most advanced image-enhancement and surveillance systems. Helping simplify satellite manufacturing and the deployment of orbital services.",
    icon: Cpu,
  },
  {
    period: "2024 — Present",
    role: "Chairman · Lead Physicist · Chief Technology Officer",
    org: "Lightware",
    location: "Orlando, FL",
    desc: "Pioneering the world's most advanced laser technology for data and energy transmission. Building products for multicolor open-space telecommunications, spacecraft-to-spacecraft links and multicolor fiber-optic transceivers — paving the way toward a generation of non-electronic devices.",
    icon: Zap,
    metrics: [{ k: "Focus", v: "Photonics · Energy · Space" },{ k: "Recognition", v: "Global Innovation Award" }],
  },
  {
    period: "2024 — Present",
    role: "Founder & Chairman",
    org: "Wonderlands",
    location: "Florida, USA",
    desc: "A real-estate development company crafting home entertainment spaces, luxury patios and modern, sustainable communities — blending architecture, immersive technology and outdoor living into a new standard of residential experience.",
    icon: Building2,
    metrics: [{ k: "Profit Margin Lift", v: "+35%" },{ k: "Driver", v: "Automation Tech" }],
  },
  {
    period: "Feb 2023 — Present",
    role: "Chief Executive Officer & Chief Technology Officer",
    org: "Byte A.I. — Inbound Call Center",
    location: "Windermere, FL",
    desc: "An inbound call center powered by proprietary AI algorithms built from scratch — delivering affordable, high-quality customer service infrastructure for ecommerce companies.",
    icon: Brain,
  },
  {
    period: "Oct 2022 — Present",
    role: "Chairman & Investor (formerly CEO)",
    org: "DeltaFood — now GalaGoods",
    location: "Tarragona, Spain",
    desc: "The leading logistics and food-delivery service across the Terras del Ebro region, now expanding into the Valencia Community and Barcelonès. Awarded Most Innovative Startup of Terras del Ebro and acquired by Imagine Engine Studios.",
    icon: Globe2,
    metrics: [{ k: "Capital Invested", v: "€40,000" },{ k: "Revenue Generated (2 yrs)", v: "€837,555" },{ k: "Community Served", v: "200,000+" }],
  },
  {
    period: "2022 — Present",
    role: "Founder & Chairman",
    org: "Startup Factory Incubator & Accelerator",
    location: "Orlando · Miami · Ohio · Uruguay",
    desc: "A global accelerator nurturing the next generation of unicorn startups — building them from zero alongside intern students, advisors and partner incubators. Backed by industry leaders including Voyager Space, Nvidia, Google, NASA and NASDAQ.",
    icon: Rocket,
    metrics: [{ k: "Ventures Graduated", v: "40+" },{ k: "Institutional Partnerships", v: "50+" },{ k: "ML Matching Lift", v: "+75%" },{ k: "Readiness Signal", v: "TRL 1–9 Scoring" }],
  },
  {
    period: "Jan 2022 — Apr 2023",
    role: "Founder & Owner",
    org: "Cocoa & Blues — Restaurant & Coffee Bar Franchise",
    location: "Camarles, Tarragona, Spain",
    desc: "An American-style family restaurant franchise operated by branch managers, with my partner and I focused on supply chain and quality auditing. Won the prestigious 'Pincho Presidents' culinary award in its opening week.",
    icon: Sparkles,
  },
  {
    period: "Jan 2020 — Oct 2022",
    role: "Manager of A.I. Content Training",
    org: "Meta · CCC Barcelona",
    location: "Agbar Tower, Barcelona, Spain",
    desc: "Trained AI systems for one of the world's largest social ecosystems, focusing on policy enforcement and reinforcement learning across terrorism, human trafficking, national security and violent content — sustaining 95%+ accuracy for over two years. Bound by a strict NDA.",
    icon: Shield,
  },
  {
    period: "Feb 2017 — Dec 2017",
    role: "Project Manager",
    org: "Incostas Nouel S.A. — CEG Coastal",
    location: "Orlando, FL",
    desc: "Supervised the construction of three apartment buildings totaling 364 units. Managed crews of 70+, oversaw materials and safety compliance, and led inspectors through fireproofing, plumbing, electrical, ventilation, structural and finish reviews.",
    icon: Building2,
  },
  {
    period: "Oct 2015 — 2022",
    role: "Co-Founder & Chairman",
    org: "G.Q.M Technologies — now Imagine Engine Studios",
    location: "Orlando, FL · HQ Tarragona, Spain",
    desc: "An American technology organization combining AI, VR, procedural and generative AI, virtual production and game-engine pipelines. Premium member of Nvidia Inception, Redessa and TIC. Built marketplaces, delivery apps, metaverse projects, payment APIs, GPU cloud services, civil-engineering simulations and modular housing solutions in partnership with Florida's Orange County, Osceola County and the state's Housing for All committee.",
    icon: Building2,
  },
  {
    period: "Feb 2014 — 2016",
    role: "Founder",
    org: "Pandorama Clothing LLC",
    location: "Orlando, FL",
    desc: "A high-fashion clothing brand built around environmental conservation and the protection of endangered species — funding natural reserves and research into solutions for global warming and biodiversity loss.",
    icon: Sparkles,
  },
  {
    period: "May 2011 — Aug 2012",
    role: "Special Equipment Administrator (Abroad)",
    org: "Incostas S.A.",
    location: "Ciudad Ojeda, Venezuela",
    desc: "Administered specialized field equipment — GPS systems, sonars, computers, buoys and safety gear — across five simultaneous offshore projects, while managing crew transport and secure storage.",
    icon: Cpu,
  },
  {
    period: "May 2011 — Jul 2012",
    role: "Field Engineer Apprentice & Project Supervisor",
    org: "Incostas S.A.",
    location: "Lago de Maracaibo, Venezuela",
    desc: "Supervised the construction of petroleum-extraction platforms in the world's largest oil reserve. Guided crane and hydraulic-hammer operators in installing 90-foot underwater pillars and tracked completed stations via GPS for the State Oil Company.",
    icon: Building2,
  },
  {
    period: "May 2011 — Jul 2012",
    role: "Lead Researcher — Oceanographic Study & Bathymetry",
    org: "Incostas S.A.",
    location: "Lago de Maracaibo, Venezuela",
    desc: "Produced a detailed bathymetric survey of the seabed surrounding the largest oil refinery on the Maracaibo peninsula. Calibrated sonar equipment, generated 3D morphology models and AutoCAD maps used by oceanographers to plan dredging operations.",
    icon: FlaskConical,
  },
  {
    period: "Feb 2010 — May 2011",
    role: "Chief Administrator Assistant",
    org: "Incostas S.A.",
    location: "Ciudad Ojeda, Venezuela",
    desc: "Digitized four years of company accounting records — categorizing and organizing thousands of documents across expenses, earnings and losses with high accuracy.",
    icon: Briefcase,
  },
  {
    period: "Oct 2009 — Oct 2010",
    role: "Human Resources Administration Assistant",
    org: "Incostas S.A.",
    location: "Caracas, Venezuela",
    desc: "Organized work-related expenses and salaries for over 500 employees — covering childcare, schooling, insurance claims and recreational programs.",
    icon: Briefcase,
  },
  {
    period: "Jun 2008 — Oct 2009",
    role: "IT Support & Technical Assistant",
    org: "Incostas S.A.",
    location: "Caracas, Venezuela",
    desc: "Maintenance and technical support for 300+ employee workstations — system maintenance, content control, software updates, malware protection, hardware repair, inventory management and administration of the private email server.",
    icon: Cpu,
  },
];

// Ordered chronologically — most recent first
const research = [
  { period: "2024 — Present", title: "Spaceports — designing the ultimate orbital infrastructure and its commercial impact" },
  { period: "2024 — Present", title: "Optical Tweezers — a Nobel-grade technique for delivering space assets to LEO" },
  { period: "2024", title: "Lightware — non-electronic devices and the LIGHTNET" },
  { period: "2022 — 2024", title: "The Mirror — infinite data storage exploiting distance and network delay" },
  { period: "2022", title: "Startup Factory — a structured algorithm for creating companies" },
  { period: "2021", title: "The New Modern Standard — sustainable space-living technologies adapted for Earth habitats" },
  { period: "2020", title: "The Digital Species Genome — how we will evolve alongside digital twins and AI" },
  { period: "2020", title: "Jobot — collaborative robots in the commercial food-preparation industry" },
  { period: "2014 — Present", title: "Foss Theory — a Quantum Gravity proposal and the hierarchy of the cosmos" },
  { period: "2013 — 2014", title: "Economics of Type 1, 2 and 3 civilizations — the Unified Commerce framework" },
  { period: "2011 — 2012", title: "Oceanographic study and bathymetry of the Maracaibo peninsula" },
  { period: "2009 — 2011", title: "Effects of radio frequencies on the mental health of laboratory rats" },
];

const boardPositions = [
  { org: "Imagine Engine Studios", desc: "Immersive technology, virtual production & generative AI." },
  { org: "Startup Factory Hub", desc: "Global incubator & accelerator network for space and deep tech." },
  { org: "Gold Arrow", desc: "Strategic ventures and capital deployment." },
  { org: "Beyond Hardware", desc: "Next-generation computing and hardware innovation." },
  { org: "Lightware", desc: "Advanced laser technology for data and energy transmission." },
  { org: "Wonderlands World Experience", desc: "Immersive entertainment and experiential worlds." },
];

const education = [
  { period: "2015 — 2017", degree: "A.A. Physics", school: "Valencia College", note: "11+ years of unpublished research in Quantum Mechanics & Quantum Gravity." },
  { period: "2013 — 2015", degree: "A.A. Business Administration", school: "Valencia College", note: "Invited member of the Entrepreneurs Club." },
  { period: "2012 — 2013", degree: "English as a Second Language", school: "Valencia College", note: "Graduated International English Program." },
  { period: "2011", degree: "Architecture", school: "José María Vargas University", note: "Foundation that shaped a career bridging software, engineering and design." },
];

const certifications = [
  "Basic Life Support (BLS) — American Heart Association",
  "First Aid Responder — United States Territory",
  "CPR Certificate — Venezuela",
  "Fire Fighting Certification — Venezuela",
  "Open Sea Survival Certificate",
];

const skills = [
  "Abstract & Critical Thinking",
  "Business Development",
  "Software Architecture",
  "Scientific Research",
  "Branding Development",
  "Product Visualization",
  "Revenue & Business Modeling",
  "Complex Problem Solving",
  "Project Management",
  "3D Animation & Simulation",
  "Painting & Sculpting (Real & 3D)",
];

const tools = [
  "Unreal Engine 5",
  "Nvidia Omniverse",
  "Unity 3D",
  "AutoCAD 3D",
  "Twin Motion",
  "Blender",
  "Photoshop",
  "After Effects",
  "Generative A.I.",
  "Google Analytics",
  "Google / Meta Ads",
];


export default function RicardoFontCV() {
  const cvRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = "Ricardo Font — Curriculum Vitae";
    const meta = document.querySelector('meta[name="description"]');
    const content = "Ricardo Font — Founder, Physicist, Space Industry Leader. Curriculum Vitae spanning AI, photonics, space infrastructure and global business.";
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
      .pdf-exporting * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
      .pdf-exporting .kp-grid-bg, .pdf-exporting .kp-line-anim { display: none !important; }
    `;
    document.head.appendChild(overrideStyle);
    cvRef.current.classList.add("pdf-exporting");
    const initialScrollY = window.scrollY;
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const [bgR, bgG, bgB] = [246, 243, 236];
      const bgHex = "#f6f3ec";
      const pdfWidth = 210;
      const pdfHeight = 297;
      const marginMM = 10;
      const contentWidth = pdfWidth - marginMM * 2;
      const blockGap = 4;
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
      const fillPageBg = () => { pdf.setFillColor(bgR, bgG, bgB); pdf.rect(0, 0, pdfWidth, pdfHeight, "F"); };
      const blocks = Array.from(cvRef.current.querySelectorAll<HTMLElement>("[data-pdf-block]")).filter((el) => !el.querySelector("[data-pdf-block]"));
      let currentY = marginMM;
      fillPageBg();
      for (const el of blocks) {
        if (!el.offsetWidth || !el.offsetHeight) continue;
        const canvas = await html2canvas(el, { scale: 1.25, useCORS: true, logging: false, backgroundColor: bgHex, scrollX: 0, scrollY: -window.scrollY });
        if (!canvas.width || !canvas.height) continue;
        const heightMM = (canvas.height * contentWidth) / canvas.width;
        const contentHeight = pdfHeight - marginMM * 2;
        if (heightMM > contentHeight) {
          if (currentY > marginMM) { pdf.addPage(); fillPageBg(); currentY = marginMM; }
          const pxPerMM = canvas.width / contentWidth;
          let offsetPx = 0;
          let first = true;
          while (offsetPx < canvas.height) {
            const sliceH = Math.min(contentHeight * pxPerMM, canvas.height - offsetPx);
            const slice = document.createElement("canvas");
            slice.width = canvas.width;
            slice.height = sliceH;
            const ctx = slice.getContext("2d");
            if (ctx) { ctx.fillStyle = bgHex; ctx.fillRect(0, 0, slice.width, slice.height); ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH); }
            if (!first) { pdf.addPage(); fillPageBg(); currentY = marginMM; }
            const sliceMM = sliceH / pxPerMM;
            pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", marginMM, currentY, contentWidth, sliceMM);
            currentY += sliceMM;
            offsetPx += sliceH;
            first = false;
          }
          currentY += blockGap;
          continue;
        }
        if (heightMM > pdfHeight - marginMM - currentY && currentY > marginMM) { pdf.addPage(); fillPageBg(); currentY = marginMM; }
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", marginMM, currentY, contentWidth, heightMM);
        currentY += heightMM + blockGap;
      }
      pdf.save("Ricardo-Font-CV.pdf");
    } catch (err) {
      console.error("[PDF] generation failed", err);
      window.print();
    } finally {
      window.scrollTo({ top: initialScrollY, left: 0, behavior: "auto" });
      cvRef.current?.classList.remove("pdf-exporting");
      document.getElementById("pdf-export-overrides")?.remove();
      setIsExporting(false);
    }
  };

  const cell = { background: "#fdfbf6" } as const;
  const grid = { background: "var(--rule)", border: "1px solid var(--rule)" } as const;

  return (
    <div className="kp-institutional min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .kp-institutional { --ink:#0d1321; --ink-soft:#3b4252; --ink-mute:#6b7280; --paper:#f6f3ec; --paper-2:#efeae0; --rule:#d9d3c4; --navy:#1c2e4a; --navy-2:#2a426b; --gold:#a0813b; background:var(--paper); color:var(--ink); font-family:'Inter',system-ui,sans-serif; letter-spacing:-0.005em; }
        .kp-institutional .kp-display { font-family:'Cormorant Garamond','Times New Roman',serif; font-weight:500; letter-spacing:-0.02em; color:var(--ink); }
        .kp-institutional .kp-mono { font-family:'JetBrains Mono',monospace; }
        .kp-institutional .kp-eyebrow { font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:0.32em; text-transform:uppercase; color:var(--navy); }
        .kp-institutional .kp-card { background:#fdfbf6; border:1px solid var(--rule); border-radius:2px; }
        .kp-institutional .kp-section-num { font-family:'JetBrains Mono',monospace; color:var(--gold); font-size:11px; letter-spacing:0.2em; }
        .kp-institutional .kp-link { color:var(--navy); text-decoration:underline; text-decoration-color:var(--rule); text-underline-offset:3px; }
        .kp-institutional .kp-tag { display:inline-block; padding:4px 10px; border:1px solid var(--rule); background:#fdfbf6; font-size:11px; letter-spacing:0.05em; color:var(--ink-soft); border-radius:1px; }
        .kp-institutional .kp-grid-bg { background-image:linear-gradient(to right, rgba(28,46,74,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,46,74,0.04) 1px, transparent 1px); background-size:48px 48px; }
        .kp-institutional .kp-tick-anim { animation:kp-tick 6s linear infinite; }
        @keyframes kp-tick { 0%,100% { opacity:0.25 } 50% { opacity:0.9 } }
        .kp-institutional .kp-line-anim { background:linear-gradient(90deg, transparent, var(--navy) 50%, transparent); background-size:200% 100%; animation:kp-shift 8s linear infinite; }
        @keyframes kp-shift { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
        .kp-institutional [data-pdf-block] { background:var(--paper); }
      `}</style>

      <Navigation />

      <div className="fixed bottom-6 right-6 z-40 print:hidden flex flex-col sm:flex-row gap-3">
        <Button onClick={() => window.print()} disabled={isExporting} size="lg" variant="outline"
          style={{ background: "#fdfbf6", color: "#1c2e4a", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, padding: "0 22px", height: 48, border: "1px solid #d9d3c4" }}
          className="hover:opacity-90 transition-opacity">
          <Printer className="w-4 h-4 mr-2" />Print / Save PDF
        </Button>
        <Button onClick={handleDownloadPDF} disabled={isExporting} size="lg"
          style={{ background: "#1c2e4a", color: "#f6f3ec", borderRadius: 2, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, padding: "0 22px", height: 48, border: "1px solid #2a426b" }}
          className="hover:opacity-90 transition-opacity">
          {isExporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PDF</> : <><Download className="w-4 h-4 mr-2" />Download PDF</>}
        </Button>
      </div>

      <div ref={cvRef}>
        {/* HERO */}
        <header data-pdf-block data-pdf-block-type="hero" className="relative pt-24 pb-16 overflow-hidden">
          {!isExporting && <div className="absolute inset-0 kp-grid-bg opacity-60 pointer-events-none" />}
          {!isExporting && <div className="absolute top-0 left-0 right-0 h-px kp-line-anim opacity-40 pointer-events-none" />}
          <div className="container mx-auto px-6 lg:px-10 relative">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-12 pb-4" style={{ borderBottom: "1px solid var(--rule)" }}>
                <div className="kp-eyebrow">Curriculum Vitae</div>
                <div className="kp-eyebrow hidden sm:block">REF / RF-2026</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-700 kp-tick-anim" />
                  <span className="kp-eyebrow">Founder · Physicist</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-end">
                <div>
                  <div className="kp-eyebrow mb-6">Ricardo Font · Founder · Chairman</div>
                  <h1 className="kp-display text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.98] mb-8">
                    Ricardo Font
                  </h1>
                  <p className="text-lg sm:text-xl leading-relaxed max-w-3xl" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>
                    Founder, physicist and architect of space-industry infrastructure — building the
                    technology, policy and coalitions that accelerate human development across Earth and orbit.
                  </p>
                  <div className="mt-10 flex flex-wrap gap-x-10 gap-y-3 kp-mono text-xs" style={{ color: "var(--ink-mute)" }}>
                    {["Gold Arrow", "Decahedron Ventures", "Lightware", "Startup Factory"].map((o) => (
                      <span key={o}><span style={{ color: "var(--gold)" }}>◆</span>&nbsp; {o}</span>
                    ))}
                  </div>
                </div>
                <div className="relative shrink-0 mx-auto lg:mx-0">
                  <div className="relative" style={{ padding: 6, border: "1px solid var(--rule)", background: "#fdfbf6" }}>
                    <div className="relative overflow-hidden" style={{ width: 240, height: 300, background: "var(--paper-2)" }}>
                      <img src={portrait} alt="Ricardo Font portrait" className="w-full h-full object-cover" crossOrigin="anonymous" style={{ filter: isExporting ? "none" : "grayscale(0.85) contrast(1.05)" }} />
                    </div>
                    <div className="mt-3 px-1 flex items-center justify-between">
                      <span className="kp-mono text-[10px]" style={{ color: "var(--ink-mute)" }}>PORTRAIT · 2026</span>
                      <span className="kp-mono text-[10px]" style={{ color: "var(--gold)" }}>RF / 01</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-px" style={grid}>
                {[
                  { k: "Contact", v: "fosstheory@gmail.com", href: "mailto:fosstheory@gmail.com" },
                  { k: "Languages", v: "Spanish · English" },
                  { k: "Also", v: "IT, PT, CA basic" },
                  { k: "Focus", v: "Space · Photonics · AI" },
                ].map((c) => (
                  <div key={c.k} className="px-5 py-4" style={cell}>
                    <div className="kp-eyebrow mb-1.5">{c.k}</div>
                    {c.href ? (
                      <a href={c.href} className="text-sm kp-link break-all" style={{ fontWeight: 500 }}>{c.v}</a>
                    ) : (
                      <div className="text-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>{c.v}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* PROFILE */}
        <Section num="01" title="Profile" subtitle="Biography &amp; mission">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
              <div>
                <div className="kp-eyebrow mb-3">Profile</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  I build the institutions, technologies and coalitions that move humanity forward —
                  from quantum-scale physics to orbital infrastructure.
                </p>
              </div>
              <div className="space-y-6 text-base sm:text-lg leading-[1.75]" style={{ color: "var(--ink-soft)", fontWeight: 300 }}>
                <p>
                  My career spans business, deep technology and scientific research, with a primary
                  focus on <strong style={{ color: "var(--ink)", fontWeight: 500 }}>deep physics</strong>. From an early age I
                  was fortunate to experience every layer of a large corporation — knowledge I have
                  since applied across more than a dozen ventures, operating roles and board seats.
                </p>
                <p>
                  I have led research across mental health, environmental science, sustainability,
                  photonics and deep physics. I have advised governments, ministers and high-ranking
                  officials in the United States and abroad on economic development, space policy,
                  STEAM education and space-infrastructure strategy — and have served as a U.S.
                  delegate in exclusive diplomatic talks on space commerce.
                </p>
                <p>
                  Today I lead a global space accelerator alongside partners including
                  <strong style={{ color: "var(--ink)", fontWeight: 500 }}> Voyager Space, Nvidia, Google, NASA and NASDAQ</strong>,
                  supporting the next generation of space-infrastructure startups. My mission is
                  straightforward: accelerate human development through technology, economic design,
                  policy and new coalitions — on Earth and beyond.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* EXPERIENCE */}
        <Section num="02" title="Career Experience" subtitle="Operating, research and leadership roles">
          <div className="space-y-px" style={grid}>
            {experiences.map((exp, i) => (
              <div key={i} data-pdf-block data-pdf-block-type="experience" className="px-6 sm:px-10 py-8" style={cell}>
                <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 md:gap-10">
                  <div>
                    <div className="kp-mono text-[11px]" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</div>
                    <div className="kp-mono text-xs mt-2" style={{ color: "var(--ink-mute)" }}>{exp.period}</div>
                    <div className="kp-mono text-xs mt-1" style={{ color: "var(--ink-mute)" }}>{exp.location}</div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                      <h3 className="kp-display text-2xl sm:text-3xl">{exp.role}</h3>
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

        {/* BOARD */}
        <Section num="03" title="Chairman of the Board" subtitle="Board positions">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-px" style={grid}>
            {boardPositions.map((b, i) => (
              <div key={i} className="px-6 py-7" style={cell}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="kp-mono text-[10px]" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="kp-display text-xl">{b.org}</h3>
                </div>
                <div className="kp-mono text-[11px] mb-3" style={{ color: "var(--navy)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Chairman</div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* RESEARCH */}
        <Section num="04" title="Research Projects" subtitle="Scientific and technology research">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-px" style={grid}>
            {research.map((r, i) => (
              <div key={i} className="px-6 sm:px-8 py-6" style={cell}>
                <div className="kp-mono text-[10px] mb-2" style={{ color: "var(--gold)" }}>R&amp;D · {String(i + 1).padStart(2, "0")} · {r.period}</div>
                <div className="kp-display text-xl leading-snug">{r.title}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* CREDENTIALS */}
        <Section num="05" title="Credentials &amp; Education" subtitle="Academic and certification record">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-px" style={grid}>
            <div className="px-6 sm:px-8 py-7" style={cell}>
              <div className="kp-eyebrow mb-5">Education</div>
              <div className="space-y-5">
                {education.map((e, i) => (
                  <div key={i} className="pb-4" style={{ borderBottom: i < education.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <div className="flex items-baseline justify-between gap-4 mb-1">
                      <h4 className="kp-display text-xl">{e.degree}</h4>
                      <span className="kp-mono text-[10px] shrink-0" style={{ color: "var(--ink-mute)" }}>{e.period}</span>
                    </div>
                    <div className="kp-mono text-[11px]" style={{ color: "var(--navy)" }}>{e.school}</div>
                    <div className="text-xs mt-1 italic" style={{ color: "var(--ink-mute)" }}>{e.note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 sm:px-8 py-7" style={cell}>
              <div className="kp-eyebrow mb-5">Certifications</div>
              <ul className="space-y-4">
                {certifications.map((c, i) => (
                  <li key={i} className="grid grid-cols-[32px_1fr] gap-3 pb-4" style={{ borderBottom: i < certifications.length - 1 ? "1px solid var(--rule)" : "none" }}>
                    <div className="kp-mono text-[10px] pt-1" style={{ color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>{c}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* SKILLS */}
        <Section num="06" title="Skills &amp; Tools" subtitle="Strengths and platforms">
          <div data-pdf-block data-pdf-block-type="summary" className="grid grid-cols-1 md:grid-cols-2 gap-px" style={grid}>
            <div className="px-6 sm:px-8 py-7" style={cell}>
              <div className="kp-eyebrow mb-5">Strengths</div>
              <div className="flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="kp-tag">{s}</span>)}</div>
            </div>
            <div className="px-6 sm:px-8 py-7" style={cell}>
              <div className="kp-eyebrow mb-5">Tools &amp; Platforms</div>
              <div className="flex flex-wrap gap-2">{tools.map((t) => <span key={t} className="kp-tag">{t}</span>)}</div>
            </div>
          </div>
        </Section>

        {/* ── 07b PARTNERS & COLLABORATORS ────────────────────────────────── */}
        <Section num="06b" title="Partners &amp; Collaborators" subtitle="Institutional, agency &amp; research alliances">
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

        {/* CONTACT */}
        <Section num="07" title="Contact" subtitle="Inquiries">
          <div data-pdf-block data-pdf-block-type="summary" className="kp-card p-8 sm:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="kp-eyebrow mb-2">Direct</div>
                <a href="mailto:fosstheory@gmail.com" className="kp-display text-2xl block kp-link">fosstheory@gmail.com</a>
                <a href="tel:+12392570637" className="kp-display text-2xl block kp-link mt-2">+1 (239) 257-0637</a>
              </div>
              <div>
                <div className="kp-eyebrow mb-2">Languages</div>
                <div className="kp-display text-2xl">Spanish · English</div>
                <div className="kp-mono text-sm mt-2" style={{ color: "var(--ink-soft)" }}>Native bilingual · IT, PT, CA basic</div>
              </div>
            </div>
          </div>
        </Section>

        <footer className="container mx-auto px-6 lg:px-10 pt-10 pb-16">
          <div className="max-w-6xl mx-auto pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderTop: "1px solid var(--rule)" }}>
            <div className="kp-mono text-[11px]" style={{ color: "var(--ink-mute)", letterSpacing: "0.18em" }}>RICARDO FONT · CURRICULUM VITAE · {new Date().getFullYear()}</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Section({ num, title, subtitle, children }: { num: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="container mx-auto px-6 lg:px-10 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto">
        <div data-pdf-block data-pdf-block-type="header" className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 md:gap-10 items-end mb-10 pb-5" style={{ borderBottom: "1px solid var(--ink, #0d1321)" }}>
          <div className="kp-section-num">SECTION&nbsp;/&nbsp;{num}</div>
          <div>
            <h2 className="kp-display text-3xl sm:text-4xl lg:text-5xl leading-none" dangerouslySetInnerHTML={{ __html: title }} />
            {subtitle && <div className="kp-eyebrow mt-3" dangerouslySetInnerHTML={{ __html: subtitle }} />}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
