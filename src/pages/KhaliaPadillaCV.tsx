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
    desc: "A venture capital firm focused on high-impact investments across technology, space, energy, smart cities, infrastructure and sustainability — identifying and supporting transformative platforms that will define the future of global innovation.",
    icon: Rocket,
  },
  {
    period: "Jan 2025 — Present",
    role: "Chief Executive Officer",
    org: "Imagine Engine",
    location: "United States",
    desc: "A private space agency operating as a venture studio designing, developing and scaling advanced technologies across aerospace, quantum, photonics, telecommunications, AI and deep-tech engineering — integrating research, engineering, commercialization and capital formation under one operating model.",
    icon: Sparkles,
  },
  {
    period: "Jul 2025 — Present",
    role: "Startup Mentor",
    org: "Nasdaq Entrepreneurial Center",
    location: "United States",
    desc: "Accelerating the growth of high-potential startups within the Nasdaq Entrepreneurial Center through mentorship in technology development and strategic partnerships.",
    icon: Award,
  },
  {
    period: "Aug 2025 — Present",
    role: "Owner",
    org: "Wonderlands World",
    location: "Orlando, FL",
    desc: "A one-stop platform for patio and outdoor experiences, powered by a proprietary technology that lets customers customize and quote their patio in real time.",
    icon: Building2,
  },
  {
    period: "Mar 2024 — Present",
    role: "CEO & Managing Partner · Co-Founder",
    org: "Startup Factory Hub",
    location: "United States",
    desc: "A global accelerator nurturing startups from idea to Series A, B and C — with a focus on Software, Robotics, IoT and Aerospace ventures.",
    icon: Rocket,
  },
  {
    period: "Jan 2024 — Present",
    role: "CEO & Co-Founder",
    org: "Lightware Technologies",
    location: "Orlando, FL",
    desc: "Building the future of energy and data transmission through a fully integrated, end-to-end modular photonic network — already validating 80 Tbps. Lightware spans terrestrial telecom, AI data centers and space-based optical networks, replacing electronic bottlenecks with light-speed data and optical energy transfer through the Lightband Network.",
    icon: Zap,
  },
  {
    period: "Oct 2016 — Mar 2026",
    role: "Chief Technology Officer",
    org: "Gala Goods",
    location: "United States",
    desc: "A multi-industry logistics and commerce platform connecting restaurants, supermarkets, pharmacies, distributors and parcel services. Led automation of supply-chain logistics, fleet management integrations, AI decision-support tools and TPV synchronization between online and physical sales — co-founder of the project from October 2022 to March 2024.",
    icon: Globe2,
  },
  {
    period: "Sep 2025 — Mar 2026",
    role: "Partner",
    org: "Spacely Chile",
    location: "Chile",
    desc: "Strategic partnership advancing space-tech ventures across Latin America.",
    icon: Sparkles,
  },
  {
    period: "Dec 2023 — Mar 2026",
    role: "Co-Founder & COO",
    org: "Tech Terra Corp",
    location: "United States",
    desc: "Oversaw daily operations of a general contracting firm specializing in urban development. Scaled capacity for multiple concurrent redevelopment initiatives, streamlined subcontractor workflows (cutting timelines by 15%) and introduced digital monitoring tools across construction, procurement, scheduling and compliance.",
    icon: Building2,
  },
  {
    period: "Sep 2023 — Mar 2026",
    role: "Startup Mentor",
    org: "Startupbootcamp",
    location: "Global",
    desc: "Mentored early-stage founders across one of the world's leading global accelerator networks.",
    icon: Award,
  },
  {
    period: "Jan 2025 — Jan 2026",
    role: "Partner & Advisor",
    org: "Korb Satellite Systems LLC",
    location: "United States",
    desc: "Advisory partner supporting an innovative satellite design and manufacturing organization founded by Nobel laureates.",
    icon: Cpu,
  },
  {
    period: "Jan 2025 — Jan 2026",
    role: "Partner",
    org: "Copernic Space",
    location: "Los Angeles, CA",
    desc: "The world's first marketplace for space assets — enabling investors to own fractions of satellites and spacecraft, and to launch art into orbit.",
    icon: Sparkles,
  },
  {
    period: "Jan 2022 — Dec 2024",
    role: "Co-Founder & Chief Technology Officer",
    org: "Imagine Engine Studios",
    location: "Windermere, FL",
    desc: "Led research, implementation and development of cutting-edge technologies including VR, AR, blockchain, computing hardware, AI, logistics and data platforms. Guided the technology roadmap, prioritized projects against business objectives and translated complex technical concepts for clients and stakeholders.",
    icon: Brain,
  },
  {
    period: "Jan 2021 — Mar 2024",
    role: "Founder",
    org: "Genomas",
    location: "United States",
    desc: "A bioinformatics company digitizing DNA data into interactive 3D human avatars. Led DNA sequencing research, phenotypic recognition models and the design of a fully digital species with synthetic DNA and an AI neural network — democratizing access to the human genome through the EnGene community.",
    icon: Cpu,
  },
  {
    period: "Feb 2023 — Dec 2023",
    role: "Artificial Intelligence Researcher & Developer",
    org: "Byte A.I.",
    location: "United States",
    desc: "Led research, design and technical implementation of NVIDIA's AI stack (NeMo, Riva, CUDA, GPU acceleration) to power a next-generation autonomous call-center system. Delivered low-latency conversational AI with sub-second response across thousands of concurrent interactions.",
    icon: Brain,
  },
  {
    period: "Sep 2022 — Mar 2023",
    role: "Angel Investor",
    org: "Deltafood",
    location: "Camarles, Tarragona",
    desc: "Backed a pioneering food-tech accelerator combining QFRO (Quick-Fresh Ready-to-Order) technology with a scalable host-kitchen model serving 200,000+ people across El Delta del Ebro.",
    icon: Globe2,
  },
  {
    period: "May 2022 — Mar 2023",
    role: "Co-Founder",
    org: "Cocoa & Blues",
    location: "Camarles, Catalonia, Spain",
    desc: "A family coffee bar and restaurant featuring premium grilled meats and a stage for local artists to perform live. Led restaurant management, hiring, training, finances, scheduling and quality assurance.",
    icon: Sparkles,
  },
  {
    period: "Oct 2016 — Feb 2017",
    role: "Corporate Sales Specialist",
    org: "T-Mobile",
    location: "Greater Orlando",
    desc: "B2B sales delivering tailored wireless and connectivity solutions to small and medium businesses across Orlando — managing end-to-end sales cycles, exceeding monthly quotas and closing multi-line deals across retail, logistics and healthcare.",
    icon: Briefcase,
  },
  {
    period: "Jan 2012 — Mar 2016",
    role: "Project Manager · Civil Engineering",
    org: "CDD 995 CA — CISNE & Refit Group",
    location: "Caracas, Venezuela",
    desc: "Progressed from Administrative Assistant to Project Manager, delivering civil-engineering and public-infrastructure projects for clients including BBVA, Mercantil, Banesco, PDVSA and Telesur — leading parks, bank branches and facility upgrades across Venezuela.",
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
  "Global Recognition Award — for developing a new approach to optical communications through Lightware",
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

export default function KhaliaPadillaCV() {
  const cvRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    document.title = "Khalia Padilla — Curriculum Vitae";
    const meta = document.querySelector('meta[name="description"]');
    const content =
      "Khalia Padilla — VC investor, Founder & CEO of Imagine Engine. Building AI-powered accelerators and photonic infrastructure for the next space economy.";
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
      const marginMM = 8;
      const contentWidth = pdfWidth - marginMM * 2;
      const contentHeight = pdfHeight - marginMM * 2;

      const pdf = new jsPDF("p", "mm", "a4");

      const fillPageBg = () => {
        pdf.setFillColor(bgR, bgG, bgB);
        pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      };

      const sections = Array.from(
        cvRef.current.querySelectorAll<HTMLElement>("[data-pdf-section]")
      );

      let currentY = marginMM;
      let isFirstPage = true;
      fillPageBg();

      for (const section of sections) {
        const sectionCanvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: bgHex,
          windowWidth: section.scrollWidth,
        });

        const imgData = sectionCanvas.toDataURL("image/jpeg", 0.95);
        const renderedHeight =
          (sectionCanvas.height * contentWidth) / sectionCanvas.width;

        // If section taller than a full page, slice it across pages
        if (renderedHeight > contentHeight) {
          // Start on a fresh page if current page already has content
          if (currentY > marginMM) {
            pdf.addPage();
            fillPageBg();
            currentY = marginMM;
            isFirstPage = false;
          }
          const pxPerMM = sectionCanvas.width / contentWidth;
          const pageSlicePx = contentHeight * pxPerMM;
          let offsetPx = 0;
          while (offsetPx < sectionCanvas.height) {
            const sliceHeightPx = Math.min(
              pageSlicePx,
              sectionCanvas.height - offsetPx
            );
            const sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = sectionCanvas.width;
            sliceCanvas.height = sliceHeightPx;
            const ctx = sliceCanvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = bgHex;
              ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
              ctx.drawImage(
                sectionCanvas,
                0,
                offsetPx,
                sectionCanvas.width,
                sliceHeightPx,
                0,
                0,
                sectionCanvas.width,
                sliceHeightPx
              );
            }
            const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
            const sliceMM = (sliceHeightPx * contentWidth) / sectionCanvas.width;
            if (offsetPx > 0) {
              pdf.addPage();
              fillPageBg();
            }
            pdf.addImage(sliceData, "JPEG", marginMM, marginMM, contentWidth, sliceMM);
            offsetPx += sliceHeightPx;
          }
          currentY = marginMM + ((sectionCanvas.height - (offsetPx - pageSlicePx)) / pxPerMM);
          if (currentY > pdfHeight - marginMM) currentY = pdfHeight;
          continue;
        }

        // Will section fit on current page?
        const remaining = pdfHeight - marginMM - currentY;
        if (renderedHeight > remaining && !isFirstPage) {
          pdf.addPage();
          fillPageBg();
          currentY = marginMM;
        } else if (renderedHeight > remaining && isFirstPage && currentY > marginMM) {
          pdf.addPage();
          fillPageBg();
          currentY = marginMM;
        }

        pdf.addImage(imgData, "JPEG", marginMM, currentY, contentWidth, renderedHeight);
        currentY += renderedHeight + 4;
        isFirstPage = false;
      }

      pdf.save("Khalia-Padilla-CV.pdf");
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
        {/* NASDAQ Feature Banner */}
        <section data-pdf-section className="relative pt-24 pb-0">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_60px_hsl(var(--primary)/0.25)]">
                <img
                  src={nasdaqFeature}
                  alt="Khalia Padilla featured on the Nasdaq Tower in Times Square, New York City"
                  className="w-full h-auto object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4">
                  <Badge variant="outline" className="bg-background/60 backdrop-blur border-primary/50 text-primary tracking-[0.25em] uppercase text-[10px] sm:text-xs">
                    As Featured On
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:bottom-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground drop-shadow-lg">
                    Featured on the <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Nasdaq Tower</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 drop-shadow">
                    Nasdaq Entrepreneurial Center · Times Square, New York City
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hero */}
        <header className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-12 items-center">
              <div className="relative mx-auto md:mx-0">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-xl" />
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
                  <img
                    src={portrait}
                    alt="Khalia Padilla portrait"
                    className="w-full h-full object-cover grayscale contrast-110"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              <div>
                <Badge variant="outline" className="mb-6 border-primary/40 text-primary tracking-[0.3em] uppercase text-xs">
                  Curriculum Vitae
                </Badge>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent leading-[0.95]">
                  Khalia Padilla
                </h1>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-xs sm:text-sm">
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    Grant Winner
                  </Badge>
                  <Badge className="bg-accent/15 text-accent-foreground border border-accent/30 hover:bg-accent/20 text-xs sm:text-sm">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Featured on Nasdaq
                  </Badge>
                  <Badge className="bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15 text-xs sm:text-sm">
                    <Rocket className="w-3.5 h-3.5 mr-1.5" />
                    Serial Entrepreneur
                  </Badge>
                  <Badge className="bg-foreground/10 text-foreground border border-foreground/20 hover:bg-foreground/15 text-xs sm:text-sm">
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    Investor
                  </Badge>
                  <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20 text-xs sm:text-sm">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    Advisory Board Member — USF Muma College of Business
                  </Badge>
                </div>
                <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  VC investor and founder building AI-powered accelerators and photonic
                  infrastructure for the next space economy — Founder & CEO of Imagine Engine,
                  a private space agency operating as a venture studio.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="mailto:khaliapadilla@gmail.com"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur hover:border-primary/50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm break-all">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</div>
                      <div className="font-medium text-foreground">khaliapadilla@gmail.com</div>
                    </div>
                  </a>
                  <a
                    href="tel:+14077604873"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur hover:border-primary/50 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Direct</div>
                      <div className="font-medium text-foreground">+1 (407) 760-4873</div>
                    </div>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/khaliapadilla"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur hover:border-primary/50 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm break-all">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">LinkedIn</div>
                      <div className="font-medium text-foreground">/in/khaliapadilla</div>
                    </div>
                  </a>
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur">
                    <Languages className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Languages</div>
                      <div className="font-medium text-foreground">English · Spanish</div>
                      <div className="text-xs text-muted-foreground">Native bilingual</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Profile</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
              <div className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
                <p>
                  I build the infrastructure behind the next generation of AI, space and photonic
                  systems. As Founder & CEO of <span className="text-foreground font-medium">Imagine Engine</span>,
                  a private space agency operating as a venture studio, I design and scale
                  AI-powered accelerators, frontier-technology platforms and global innovation
                  ecosystems at the intersection of space, photonics and advanced computing.
                </p>
                <p>
                  My work focuses on AI-driven accelerator platforms, photonic and optical
                  communication infrastructure, space and deep-tech commercialization, and
                  building global ecosystems across the U.S., Japan, Europe and Latin America. I
                  collaborate with founders, researchers, investors, universities and
                  government-adjacent programs — including initiatives connected to NASA — to
                  move breakthrough technologies from research to real-world deployment.
                </p>
                <p>
                  Outside the lab and the boardroom, I'm a multidisciplinary artist — performing
                  Arabic and flamenco dance, and playing piano in orchestras. Previously served
                  as an advisor to the Design Thinking Program at USF Muma College of Business.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* Experience */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Experience</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>

            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent hidden sm:block" />
              <div className="space-y-6">
                {experiences.map((exp, i) => {
                  const Icon = exp.icon;
                  return (
                    <div key={i} className="relative sm:pl-20">
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
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Research Projects</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {researchProjects.map((p) => {
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
          </div>
        </section>

        {/* Interviews & Media */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Interviews & Media</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((i) => (
                <Card
                  key={i.title}
                  className="p-5 sm:p-6 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-full border border-primary/40 bg-card flex items-center justify-center shrink-0 shadow-[0_0_18px_hsl(var(--primary)/0.2)]">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                      {i.title}
                    </h3>
                    <div className="text-primary text-sm mt-1">{i.outlet}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                      {i.type}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Education */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Education</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 bg-card/40 backdrop-blur border border-border/50">
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
              <Card className="p-6 bg-card/40 backdrop-blur border border-border/50">
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
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-5 h-5 text-primary" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Honors & Awards</h2>
            </div>
            <Card className="p-6 bg-card/40 backdrop-blur border border-border/50">
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
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Certifications</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((c, i) => (
                <Card
                  key={i}
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
          </div>
        </section>


        {/* Skills */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Skills</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillCategories.map((cat) => (
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
          </div>
        </section>

        {/* Beyond Work */}
        <section data-pdf-section className="container mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-5 h-5 text-primary" />
              <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Beyond Work</h2>
            </div>
            <Card className="p-6 bg-card/40 backdrop-blur border border-border/50">
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
            Khalia Padilla — Curriculum Vitae
          </div>
        </footer>
      </div>
    </div>
  );
}
