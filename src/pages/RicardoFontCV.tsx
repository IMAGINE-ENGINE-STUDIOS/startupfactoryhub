import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import Navigation from "@/components/Navigation";
import portrait from "@/assets/ricardo-font-portrait.png";

// Ordered chronologically — most recent first
const experiences = [
  {
    period: "2025 — Present",
    role: "Advisor · Interim CTO · Investor",
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
    role: "Lead Physicist · Chief Technology Officer",
    org: "Lightware",
    location: "Orlando, FL",
    desc: "Pioneering the world's most advanced laser technology for data and energy transmission. Building products for multicolor open-space telecommunications, spacecraft-to-spacecraft links and multicolor fiber-optic transceivers — paving the way toward a generation of non-electronic devices.",
    icon: Zap,
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
  },
  {
    period: "2022 — Present",
    role: "Founder & Chairman",
    org: "Startup Factory Incubator & Accelerator",
    location: "Orlando · Miami · Ohio · Uruguay",
    desc: "A global accelerator nurturing the next generation of unicorn startups — building them from zero alongside intern students, advisors and partner incubators. Backed by industry leaders including Voyager Space, Nvidia, Google, NASA and NASDAQ.",
    icon: Rocket,
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
    try {
      const mod = await import("html2pdf.js");
      const html2pdf = (mod as { default: (...args: unknown[]) => any }).default;
      const opt = {
        margin: 0,
        filename: "Ricardo-Font-CV.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0a0a0a",
          windowWidth: 1280,
        },
        jsPDF: { unit: "px", format: [1280, cvRef.current.scrollHeight], orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      await html2pdf().set(opt).from(cvRef.current).save();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Floating Download Button */}
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
        {/* Hero */}
        <header className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-12 items-center">
              {/* Portrait */}
              <div className="relative mx-auto md:mx-0">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-xl" />
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
                  <img
                    src={portrait}
                    alt="Ricardo Font portrait"
                    className="w-full h-full object-cover grayscale contrast-110"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* Identity */}
              <div>
                <Badge variant="outline" className="mb-6 border-primary/40 text-primary tracking-[0.3em] uppercase text-xs">
                  Curriculum Vitae
                </Badge>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent leading-[0.95]">
                  Ricardo Font
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                  Founder, physicist and architect of space-industry infrastructure — building the
                  technology, policy and coalitions that accelerate human development across Earth and orbit.
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="mailto:fosstheory@gmail.com"
                    className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur hover:border-primary/50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm break-all">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contact</div>
                      <div className="font-medium text-foreground">fosstheory@gmail.com</div>
                    </div>
                  </a>
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur">
                    <Languages className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Languages</div>
                      <div className="font-medium text-foreground">Spanish · English</div>
                      <div className="text-xs text-muted-foreground">Native bilingual · IT, PT, CA basic</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Summary */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Profile</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <Card className="p-8 sm:p-10 bg-card/40 backdrop-blur border border-border/50">
            <div className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              <p className="text-xl sm:text-2xl text-foreground font-light leading-snug">
                I build the institutions, technologies and coalitions that move humanity forward —
                from quantum-scale physics to orbital infrastructure.
              </p>
              <p>
                My career spans business, deep technology and scientific research, with a primary
                focus on <span className="text-foreground">deep physics</span>. From an early age I
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
                <span className="text-foreground"> Voyager Space, Nvidia, Google, NASA and NASDAQ</span>,
                supporting the next generation of space-infrastructure startups. My mission is
                straightforward: accelerate human development through technology, economic design,
                policy and new coalitions — on Earth and beyond.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Experience timeline */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Experience</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>

          <div className="relative">
            <div className="absolute left-4 sm:left-6 top-2 bottom-2 w-px bg-gradient-to-b from-primary/60 via-primary/20 to-transparent" />
            <div className="space-y-6">
              {experiences.map((exp, i) => {
                const Icon = exp.icon;
                return (
                  <div key={i} className="relative pl-12 sm:pl-16 group">
                    <div className="absolute left-0 top-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full border border-primary/40 bg-card flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <Card className="p-6 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          <Calendar className="w-3 h-3 mr-1" />
                          {exp.period}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{exp.location}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">{exp.role}</h3>
                      <div className="text-sm text-primary/90 font-medium mb-3">{exp.org}</div>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{exp.desc}</p>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Research */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Research Projects</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {research.map((r, i) => (
              <Card
                key={i}
                className="p-5 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <FlaskConical className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2 border-primary/30 text-primary">
                      {r.period}
                    </Badge>
                    <div className="text-sm sm:text-base text-foreground leading-snug">{r.title}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Academic Education</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {education.map((e, i) => (
              <Card key={i} className="p-6 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="outline" className="text-[10px] mb-2 border-primary/30 text-primary">
                      {e.period}
                    </Badge>
                    <h3 className="font-semibold text-foreground">{e.degree}</h3>
                    <div className="text-sm text-primary/90 mb-2">{e.school}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{e.note}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Board Positions */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Chairman of the Board</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardPositions.map((b, i) => (
              <Card
                key={i}
                className="p-6 bg-card/40 backdrop-blur border border-border/50 hover:border-primary/40 hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)] transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg border border-primary/40 bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Badge variant="outline" className="text-[10px] mb-2 border-primary/30 text-primary">
                      Chairman
                    </Badge>
                    <h3 className="font-semibold text-foreground leading-tight">{b.org}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="container mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Certifications</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <Card className="p-6 sm:p-8 bg-card/40 backdrop-blur border border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certifications.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span className="text-sm text-foreground">{c}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Skills & Tools */}
      <section className="container mx-auto px-4 sm:px-6 py-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
            <h2 className="text-xs tracking-[0.4em] uppercase text-primary">Skills & Tools</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-primary/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 sm:p-8 bg-card/40 backdrop-blur border border-border/50">
              <h3 className="text-sm tracking-[0.2em] uppercase text-primary mb-5">Strengths</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal py-1.5 px-3">
                    {s}
                  </Badge>
                ))}
              </div>
            </Card>
            <Card className="p-6 sm:p-8 bg-card/40 backdrop-blur border border-border/50">
              <h3 className="text-sm tracking-[0.2em] uppercase text-primary mb-5">Tools & Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {tools.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal py-1.5 px-3 border-primary/30">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          <Separator className="my-16 bg-border/40" />

          <div className="text-center">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
              Ricardo Font · Curriculum Vitae · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
