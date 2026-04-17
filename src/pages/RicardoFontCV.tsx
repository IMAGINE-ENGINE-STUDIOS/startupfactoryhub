import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
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
} from "lucide-react";
import Navigation from "@/components/Navigation";

const experiences = [
  {
    period: "2022 — Present",
    role: "Founder & Chairman",
    org: "Startup Factory Incubator & Accelerator",
    location: "Orlando · Miami · Ohio · Uruguay",
    desc: "Nurturing the next generation of unicorn startups — building them from zero with intern students, advisors and partner incubators & accelerators.",
    icon: Rocket,
  },
  {
    period: "2025 — Present",
    role: "Advisor · Interim CTO · Investor",
    org: "Copernic Space",
    location: "Los Angeles, CA",
    desc: "World's first marketplace for space assets. Invest in satellites, spacecrafts and space ART — launch art to space and own fractions of space assets.",
    icon: Sparkles,
  },
  {
    period: "2024 — Present",
    role: "Lead Physicist · CTO",
    org: "Lightware",
    location: "Orlando, FL",
    desc: "World's most advanced laser technology applied to data and energy transmission. Multicolor open-space telecom, spacecraft-to-spacecraft links, multicolor fiber transceivers, and a future of non-electric devices.",
    icon: Zap,
  },
  {
    period: "Jan 2025 — Present",
    role: "Advisor · Business Developer · Partner",
    org: "KORB Satellite Corp",
    location: "Ohio",
    desc: "Innovative satellite designer and manufacturer. Founders include Nobel laureates with 20+ patents in photonics, data analysis, image enhancement and surveillance — simplifying satellite manufacturing and service deployment.",
    icon: Cpu,
  },
  {
    period: "Feb 2023 — Present",
    role: "CEO & CTO",
    org: "Byte A.I. — Inbound Call Center",
    location: "Windermere, FL",
    desc: "Inbound call center powered by best-in-class AI algorithms built from scratch — affordable call center services for ecommerce companies.",
    icon: Brain,
  },
  {
    period: "Oct 2022 — Present",
    role: "Chairman · Investor (Former CEO)",
    org: "DeltaFood — now GalaGoods",
    location: "Tarragona, Spain",
    desc: "Leading logistics & food delivery in Terras del Ebro, expanding into Valencia and Barcelonès. Awarded most innovative startup in Terras del Ebro; acquired by Imagine Engine.",
    icon: Globe2,
  },
  {
    period: "Jan 2020 — Oct 2022",
    role: "Manager of A.I. Content Training",
    org: "Meta · CCC Barcelona",
    location: "Agbar Tower, Barcelona",
    desc: "Trained AI on user information administration, policy enforcement and reinforcement learning for terrorism, trafficking, national security and violent content — sustaining 95%+ accuracy for 2+ years on one of the largest social ecosystems.",
    icon: Shield,
  },
  {
    period: "Oct 2015 — 2022",
    role: "Co-Founder & Chairman",
    org: "G.Q.M Technologies — now Imagine Engine Studios",
    location: "Orlando, FL · HQ Tarragona, Spain",
    desc: "American technology org combining AI, VR, procedural & generative AI, virtual production and game-engine pipelines. Nvidia Inception, Redessa & TIC member. Built marketplaces, delivery apps, metaverse, payment APIs, GPU cloud, civil engineering simulations and modular housing solutions with Florida state government.",
    icon: Building2,
  },
  {
    period: "Jan 2022 — Apr 2023",
    role: "Founder · Owner",
    org: "Cocoa & Blues — Restaurant & Coffee Bar Franchise",
    location: "Camarles, Tarragona, Spain",
    desc: "American-style family restaurant franchise. Won 'Pincho Presidents' — the area's most prestigious culinary award — in opening week.",
    icon: Sparkles,
  },
  {
    period: "Feb 2017 — Dec 2017",
    role: "Project Manager",
    org: "Incostas Nouel S.A. — CEG Coastal",
    location: "Orlando, FL",
    desc: "Supervised construction of 3 buildings / 364 apartment units. Managed 70+ workers, materials, safety compliance, and walked inspectors through fireproof, plumbing, electrical, ventilation, structural and finish inspections.",
    icon: Building2,
  },
  {
    period: "Feb 2014 — 2016",
    role: "Founder",
    org: "Pandorama Clothing LLC",
    location: "Orlando, FL",
    desc: "High-fashion clothing brand built around environmental conservation and protecting endangered species — funding natural reserves and research for global warming solutions.",
    icon: Sparkles,
  },
  {
    period: "May 2011 — Aug 2012",
    role: "Special Equipment Administrator (Abroad)",
    org: "Incostas S.A.",
    location: "Ciudad Ojeda, Venezuela",
    desc: "Administered GPS, sonars, computers, buoys and safety equipment across 5 simultaneous projects; managed crews, transport and secure storage.",
    icon: Cpu,
  },
  {
    period: "May 2011 — Jul 2012",
    role: "Field Engineer Apprentice & Project Supervisor",
    org: "Incostas S.A.",
    location: "Lago de Maracaibo, Venezuela",
    desc: "Supervised construction of petroleum extraction platforms — guided crane and hydraulic-hammer operators installing 90 ft underwater pillars and tracked stations via GPS for the State Oil Company.",
    icon: Building2,
  },
  {
    period: "May 2011 — Jul 2012",
    role: "Lead Researcher — Oceanographic Study & Bathymetry",
    org: "Incostas S.A.",
    location: "Lago de Maracaibo, Venezuela",
    desc: "Produced detailed bathymetry of the seabed around the world's single largest oil reserve. Calibrated sonar, generated 3D morphology and AutoCAD maps for dredging analysis.",
    icon: FlaskConical,
  },
  {
    period: "Feb 2010 — May 2011",
    role: "Chief Administrator Assistant",
    org: "Incostas S.A.",
    location: "Ciudad Ojeda, Venezuela",
    desc: "Digitalized 4 years of company accounting — categorized and organized thousands of records across expenses, earnings and losses.",
    icon: Briefcase,
  },
  {
    period: "Oct 2009 — Oct 2010",
    role: "Human Resources Administration Assistant",
    org: "Incostas S.A.",
    location: "Caracas, Venezuela",
    desc: "Organized work-related expenses and salaries for 500+ employees — childcare, schooling, insurance claims, recreational programs.",
    icon: Briefcase,
  },
  {
    period: "Jun 2008 — Oct 2009",
    role: "IT Support & Technical Assistant",
    org: "Incostas S.A.",
    location: "Caracas, Venezuela",
    desc: "Maintenance and support for 300+ employees — system maintenance, content control, malware/AV, formatting, hardware repair, inventory and private email server administration.",
    icon: Cpu,
  },
];

const research = [
  { period: "2009 — 2011", title: "Effects of radio frequencies on lab rats' mental health" },
  { period: "2011 — 2012", title: "Lead Researcher — Oceanographic Study & Bathymetry" },
  { period: "2013 — 2014", title: "Economics of Type 1, 2, 3 civilizations — the Unified Commerce" },
  { period: "2014 — Present", title: "Foss Theory — a Quantum Gravity proponent and the hierarchy of the cosmos" },
  { period: "2020", title: "Use-case applications of collaborative robots in food preparation — Jobot" },
  { period: "2020", title: "The Digital Species Genome — evolving alongside digital twins and AI" },
  { period: "2021", title: "The New Modern Standard — sustainable space-living tech for Earth habitats" },
  { period: "2022 — 2024", title: "The Mirror — infinite data storage exploiting distance and network delay" },
  { period: "2022", title: "A structured algorithm for creating companies — Startup Factory" },
  { period: "2024", title: "Lightware — non-electronic devices and the LIGHTNET" },
  { period: "2024 — Present", title: "Tweezers technology for taking space assets to LEO — Nobel technique" },
  { period: "2024 — Present", title: "Spaceports — building the ultimate infrastructure & its commercial impact" },
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute inset-0 opacity-30 pointer-events-none [background-image:radial-gradient(hsl(var(--primary)/0.15)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto">
            <Badge variant="outline" className="mb-6 border-primary/40 text-primary tracking-[0.3em] uppercase text-xs">
              Curriculum Vitae
            </Badge>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-primary bg-clip-text text-transparent leading-[0.95]">
              Ricardo Font
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Founder. Physicist. Space industry architect. Building the infrastructure, policy and
              technology that accelerates human development across Earth and orbit.
            </p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">Camarles, Tarragona</div>
                  <div className="text-muted-foreground">Carrer Quatre 27, P1 A3 Esc A · 43894</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur">
                <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm break-all">
                  <div className="font-medium">rfont@galaexchange.com</div>
                  <div className="text-muted-foreground">fosstheory@gmail.com</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-card/40 backdrop-blur">
                <Languages className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-medium">Spanish · English</div>
                  <div className="text-muted-foreground">Native bilingual · IT, PT, CA basic</div>
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
              <p>
                A career defined by a rich background across business, technology development and
                scientific research — primarily in <span className="text-foreground">deep physics</span>.
                From an early age I had the privilege of experiencing every part of a large
                corporation, knowledge later applied across multiple ventures and operating roles.
              </p>
              <p>
                I have led research in mental health, environmental science, sustainability,
                photonics and deep physics. I have advised governments, ministers and high-ranking
                officials of the U.S. and other countries on economic development strategy, space
                policy, STEAM education and space infrastructure — and served as a U.S. delegate in
                exclusive diplomatic talks on space commerce.
              </p>
              <p>
                Today I run a Space Accelerator alongside partners including
                <span className="text-foreground"> Voyager Space, Nvidia, Google, NASA and NASDAQ</span>,
                supporting the next generation of space infrastructure startups. My goal is to
                accelerate human development through technology, economics, policy and new coalitions.
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
  );
}
