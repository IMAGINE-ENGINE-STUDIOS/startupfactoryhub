import { useEffect, useRef, useState } from "react";
import sfhLogo from "@/assets/sfh-logo-combined.png";
import heroBg from "@/assets/event-launching-orlando.jpg";
import nasdaqFeature from "@/assets/nasdaq-feature.jpg";
import coworkingSpace from "@/assets/coworking-space.jpg";
import dashboardMockup from "@/assets/mockup-dashboard.png";
import conferenceHall from "@/assets/conference-hall-bg.webp";
import WebGLBackground from "@/components/WebGLBackground";

import {
  Building2,
  Handshake,
  Rocket,
  Target,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Network,
  GraduationCap,
  Lightbulb,
  MapPin,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Cpu,
  Award,
  DollarSign,
  BarChart3,
  PieChart,
  Coins,
  LineChart,
  Layers,
  Wallet,
  CreditCard,
} from "lucide-react";

/**
 * /BDVpartnership — Propuesta económica confidencial de alianza
 * Banco de Venezuela × Startup Factory Hub.
 */

const ACCENT = "#E4002B"; // Banco de Venezuela rojo
const ACCENT_GLOW = "#FFB300"; // dorado institucional
const NAV = "#0A0D12";

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <div
    className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em]"
    style={{ color: ACCENT }}
  >
    <span className="block h-px w-8" style={{ background: ACCENT }} />
    {children}
  </div>
);

const SectionTitle = ({
  kicker,
  title,
  lead,
}: {
  kicker: string;
  title: string;
  lead?: string;
}) => (
  <div className="max-w-3xl">
    <Kicker>{kicker}</Kicker>
    <h2
      className="mt-5 text-4xl md:text-5xl font-light leading-[1.05] tracking-tight text-white"
      style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
    >
      {title}
    </h2>
    {lead && (
      <p className="mt-5 text-base md:text-lg leading-relaxed text-white/65 font-light">
        {lead}
      </p>
    )}
  </div>
);

const HairlineCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div
    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-7 transition-all duration-500 hover:border-[color:var(--accent)] hover:bg-white/[0.04]"
    style={{ ['--accent' as any]: ACCENT, boxShadow: `0 8px 40px -12px ${ACCENT}26` }}
  >
    <div
      className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
    />
    <Icon className="h-5 w-5" style={{ color: ACCENT }} />
    <h3 className="mt-5 text-lg font-medium tracking-tight text-white">{title}</h3>
    <div className="mt-3 text-sm leading-relaxed text-white/60 font-light">{children}</div>
  </div>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-3 text-[15px] leading-relaxed text-white/70 font-light">
    <span
      className="mt-[10px] block h-[5px] w-[5px] shrink-0 rotate-45"
      style={{ background: ACCENT }}
    />
    <span>{children}</span>
  </li>
);

const TOTAL_SLIDES = 15;

const BDVPartnership = () => {
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    document.title = "Propuesta de Alianza — Banco de Venezuela × Startup Factory Hub";
  }, []);

  const goTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, idx));
    el.scrollTo({ left: clamped * window.innerWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = window.innerWidth || 1;
      setSlide(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") goTo(slide + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(slide - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slide]);

  return (
    <div
      className="wtc-deck relative h-screen w-screen antialiased overflow-hidden"
      style={{
        background: `radial-gradient(1200px 600px at 80% -10%, ${ACCENT}14, transparent 60%), radial-gradient(900px 500px at -10% 30%, ${ACCENT_GLOW}10, transparent 60%), ${NAV}`,
        fontFamily:
          '"Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#D8DCE0",
      }}
    >
      <style>{`
        .slide-panel { width: 100vw; height: 100vh; flex: 0 0 100vw; scroll-snap-align: center; overflow-y: auto; overflow-x: hidden; }
        .slide-panel::-webkit-scrollbar { width: 6px; }
        .slide-panel::-webkit-scrollbar-thumb { background: ${ACCENT}33; border-radius: 4px; }
        .horizontal-deck { scroll-snap-type: x mandatory; scroll-behavior: smooth; }
        .horizontal-deck::-webkit-scrollbar { display: none; }
        .wtc-deck .text-white { color: #E6E9EC !important; }
        .wtc-deck .slide-panel > * { font-size: 1.15em; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 z-0 opacity-40 mix-blend-screen">
        <WebGLBackground />
      </div>

      <div
        className="pointer-events-none fixed -top-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20 blur-[120px]"
        style={{ background: ACCENT }}
      />
      <div
        className="pointer-events-none fixed bottom-0 -left-40 h-[600px] w-[600px] rounded-full opacity-10 blur-[140px]"
        style={{ background: ACCENT_GLOW }}
      />

      <main
        ref={scrollerRef as any}
        className="horizontal-deck relative z-10 flex h-screen w-screen overflow-x-auto overflow-y-hidden"
      >
        {/* 00 — Portada */}
        <section className="slide-panel relative flex flex-col justify-center overflow-hidden px-6 pt-12 md:px-12">
          <div className="pointer-events-none absolute inset-0">
            <img
              src={heroBg}
              alt="Ecosistema de innovación y emprendimiento"
              className="h-full w-full object-cover opacity-20"
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(90deg, ${NAV} 0%, ${NAV}CC 45%, ${NAV}66 100%)` }}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(${ACCENT} 1px, transparent 1px), linear-gradient(90deg, ${ACCENT} 1px, transparent 1px)`,
                backgroundSize: "80px 80px",
              }}
            />
          </div>

          <div className="relative mx-auto w-full max-w-7xl">
            <Kicker>Confidencial · Propuesta Económica · 2026</Kicker>

            <div className="mt-5 flex items-center gap-6 md:gap-8">
              <img
                src={sfhLogo}
                alt="Startup Factory Hub"
                className="h-14 md:h-16 object-contain"
              />
              <div className="h-10 w-px md:h-12" style={{ background: `${ACCENT}66` }} />
              <div>
                <div className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.32em] text-white/45">
                  En alianza con
                </div>
                <div
                  className="mt-1 text-xl md:text-2xl font-light leading-tight text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Banco de <span style={{ color: ACCENT }}>Venezuela</span>
                </div>
              </div>
            </div>

            <h1
              className="mt-4 text-4xl md:text-6xl lg:text-[70px] font-light leading-[1.05] tracking-[-0.02em] text-white"
              style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
            >
              Centro de Innovación
              <br />
              <span className="italic" style={{ color: ACCENT }}>
                Banco de Venezuela
              </span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl text-white/60 font-light not-italic">
                impulsado por Startup Factory Hub
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65 font-light">
              Espacios de coworking, mentoría y asesoramiento, programas de aceleración
              e incubación, y eventos y talleres para los emprendedores digitales de Venezuela.
            </p>

            <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Preparado para
                </div>
                <div
                  className="mt-2 text-xl font-light text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Directiva del Banco de Venezuela
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Preparado por
                </div>
                <div
                  className="mt-2 text-xl font-light text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Startup Factory Hub Accelerator
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 text-white/40">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em]">Avanzar</span>
            </div>
          </div>
        </section>

        {/* 01 — Resumen ejecutivo */}
        <section className="slide-panel relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-full md:block md:w-[42%] lg:w-[40%]">
            <img src={conferenceHall} alt="Espacio de innovación" className="h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to right, ${NAV} 0%, ${NAV}CC 40%, transparent 85%), ${ACCENT}08` }}
            />
          </div>

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-6 md:px-12">
            <div className="relative mt-12 grid h-full flex-1 grid-cols-1 items-start gap-12 pb-12 md:grid-cols-12">
              <div className="space-y-6 text-base leading-relaxed text-white/90 md:col-span-6">
                <SectionTitle
                  kicker="01 · Resumen Ejecutivo"
                  title="Un centro de innovación digital para el emprendimiento venezolano."
                />
                <p className="font-normal">
                  Startup Factory Hub Accelerator propone al{" "}
                  <span className="font-medium text-white">Banco de Venezuela</span> la creación
                  conjunta de un centro de innovación que ofrezca espacios de coworking, mentoría,
                  aceleración e incubación, y una agenda permanente de eventos y talleres para
                  emprendedores digitales.
                </p>
                <p className="font-normal">
                  El modelo combina la red de agencias, la base de clientes y la infraestructura
                  financiera del Banco con la metodología, la plataforma tecnológica y la red
                  internacional de mentores e inversionistas de Startup Factory Hub.
                </p>
                <p className="font-normal">
                  El resultado es un activo de marca y un negocio autosostenible: nuevas cuentas
                  empresariales, productos financieros para startups y un portafolio de empresas
                  digitales vinculadas al Banco desde su fundación.
                </p>

                <div className="mt-10 border-l-2 pl-6" style={{ borderColor: ACCENT }}>
                  <Sparkles className="h-5 w-5" style={{ color: ACCENT }} />
                  <p
                    className="mt-4 text-xl font-light italic leading-snug text-white md:text-2xl"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    "El banco que financia el futuro digital de Venezuela."
                  </p>
                  <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
                    Centro de Innovación BDV
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 — Los cuatro pilares */}
        <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="02 · Alcance del Servicio"
              title="Cuatro pilares operativos."
              lead="El contrato se estructura sobre cuatro líneas de servicio, cada una con metas, entregables e indicadores medibles."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: Briefcase,
                  code: "P/01",
                  title: "Espacios de coworking",
                  body: "Los emprendedores digitales pueden trabajar en sus proyectos de forma individual o colaborativa.",
                  items: [
                    "Puestos flexibles, oficinas y salas de reunión",
                    "Conectividad, respaldo eléctrico y soporte técnico",
                    "Acceso con credencial digital y reservas en línea",
                    "Comunidad presencial y remota conectada",
                  ],
                },
                {
                  icon: GraduationCap,
                  code: "P/02",
                  title: "Mentoría y asesoramiento",
                  body: "Diseñar metodologías estratégicas que aporten soluciones a los emprendedores digitales.",
                  items: [
                    "Red de mentores nacionales e internacionales",
                    "Diagnóstico y hoja de ruta por emprendimiento",
                    "Asesoría legal, financiera y comercial",
                    "Seguimiento trimestral con métricas",
                  ],
                },
                {
                  icon: Rocket,
                  code: "P/03",
                  title: "Aceleración e incubación",
                  body: "Brindar a las startups el apoyo y los recursos necesarios para crecer y desarrollarse.",
                  items: [
                    "Cohortes de incubación (0 a 1) y aceleración (1 a N)",
                    "Preparación para inversión y acceso a capital",
                    "Créditos en la nube y beneficios de partners",
                    "Demo Day con inversionistas y banca",
                  ],
                },
                {
                  icon: Calendar,
                  code: "P/04",
                  title: "Eventos y talleres",
                  body: "Implementar planes de capacitación sobre las últimas tendencias en innovación y emprendimiento.",
                  items: [
                    "Calendario mensual de talleres y masterclasses",
                    "Hackathons y retos de innovación con el Banco",
                    "Foros de inversión y ruedas de negocio",
                    "Certificaciones y programas de formación",
                  ],
                },
              ].map(({ icon: Icon, code, title, body, items }) => (
                <div
                  key={code}
                  className="group relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(140deg, ${ACCENT}55 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.02) 65%, ${ACCENT}30 100%)`,
                  }}
                >
                  <div className="relative h-full rounded-2xl bg-[#0b0f14]/95 p-8 backdrop-blur-xl">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10"
                        style={{ background: `linear-gradient(135deg, ${ACCENT}25, transparent)` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                      </div>
                      <span className="font-mono text-[11px] tracking-[0.2em] text-white/30">{code}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-medium leading-snug tracking-tight text-white">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed font-light text-white/65">{body}</p>
                    <ul className="mt-6 space-y-3">
                      {items.map((it) => (
                        <Bullet key={it}>{it}</Bullet>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 03 — Principios de la alianza */}
        <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="03 · Principios de la Alianza"
              title="Compromiso compartido. Impacto de largo plazo."
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Handshake,
                  title: "Alianza estratégica",
                  body: "El Banco y Startup Factory Hub participan como socios estratégicos comprometidos con el éxito del Centro de Innovación.",
                },
                {
                  icon: Users,
                  title: "Gobernanza conjunta",
                  body: "Un comité mixto define la estrategia, aprueba presupuestos y revisa indicadores de forma trimestral.",
                },
                {
                  icon: TrendingUp,
                  title: "Valor compartido",
                  body: "Ambas organizaciones participan del valor económico y reputacional generado por la operación.",
                },
                {
                  icon: Lightbulb,
                  title: "Aportes complementarios",
                  body: "El Banco aporta infraestructura, marca y clientes; SFH aporta metodología, plataforma y red global.",
                },
                {
                  icon: ShieldCheck,
                  title: "Transparencia y cumplimiento",
                  body: "Reportes auditables, gestión de riesgos y cumplimiento normativo en cada desembolso y programa.",
                },
                {
                  icon: Building2,
                  title: "Institucionalidad permanente",
                  body: "El objetivo es construir una institución de innovación que perdure más allá de cada cohorte.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <HairlineCard key={title} icon={Icon} title={title}>
                  {body}
                </HairlineCard>
              ))}
            </div>
          </div>
        </section>

        {/* 04 — Modelo de inversión */}
        <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="04 · Propuesta Económica · Inversión"
              title="Estructura de inversión del Banco de Venezuela."
              lead="Inversión anual estimada para operar los cuatro pilares en una sede principal, con capacidad de 120 puestos y 3 cohortes por año."
            />

            <div className="mt-10 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Wallet, value: "US$ 180.000", label: "Implementación (año 0)", sub: "Adecuación de sede, mobiliario, tecnología y marca" },
                { icon: Coins, value: "US$ 420.000", label: "Operación anual", sub: "Equipo, programas, mentoría y eventos" },
                { icon: Layers, value: "US$ 600.000", label: "Inversión año 1", sub: "Implementación + operación" },
                { icon: LineChart, value: "US$ 450.000", label: "Años 2 y 3 (anual)", sub: "Operación optimizada con ingresos propios" },
              ].map(({ icon: Icon, value, label, sub }) => (
                <div key={label} className="bg-white/[0.02] p-7">
                  <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  <div
                    className="mt-5 text-3xl md:text-4xl font-light leading-none"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif', color: ACCENT }}
                  >
                    {value}
                  </div>
                  <div className="mt-3 text-base font-medium text-white">{label}</div>
                  <div className="mt-1 text-sm text-white/55 font-light">{sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                <PieChart className="h-5 w-5" style={{ color: ACCENT }} />
                <h3 className="mt-5 text-lg font-medium text-white">Distribución del presupuesto anual</h3>
                <div className="mt-6 space-y-4">
                  {[
                    { label: "Espacios de coworking y operación de sede", pct: 32 },
                    { label: "Programas de aceleración e incubación", pct: 28 },
                    { label: "Mentoría y asesoramiento especializado", pct: 18 },
                    { label: "Eventos, talleres y capacitación", pct: 14 },
                    { label: "Plataforma digital, datos y reportes", pct: 8 },
                  ].map(({ label, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm text-white/70 font-light">
                        <span>{label}</span>
                        <span style={{ color: ACCENT }}>{pct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_GLOW})` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                <CreditCard className="h-5 w-5" style={{ color: ACCENT }} />
                <h3 className="mt-5 text-lg font-medium text-white">Esquema de pago propuesto</h3>
                <ul className="mt-6 space-y-3">
                  <Bullet>30% a la firma del convenio (adecuación e instalación).</Bullet>
                  <Bullet>Cuotas trimestrales iguales durante los 12 meses de operación.</Bullet>
                  <Bullet>10% del total sujeto a cumplimiento de indicadores (KPI).</Bullet>
                  <Bullet>Contrato de 3 años con revisión anual de alcance y tarifas.</Bullet>
                  <Bullet>Posibilidad de patrocinios de terceros para reducir el aporte del Banco.</Bullet>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — Retorno para el Banco */}
        <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="05 · Retorno de la Inversión"
              title="Del gasto de patrocinio al negocio bancario."
              lead="Cada emprendedor atendido es un cliente potencial de productos financieros del Banco de Venezuela."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, title: "Nuevas cuentas empresariales", body: "1.200 emprendedores atendidos al año, con apertura de cuenta como requisito de ingreso a los programas." },
                { icon: DollarSign, title: "Cartera de crédito digital", body: "Colocación de microcréditos y capital de trabajo a startups evaluadas y acompañadas por el Centro." },
                { icon: CreditCard, title: "Medios de pago", body: "Adopción de pasarela, punto de venta y billetera del Banco por parte del portafolio de startups." },
                { icon: Award, title: "Reputación y marca", body: "Posicionamiento del Banco como líder de innovación y del emprendimiento digital nacional." },
                { icon: Cpu, title: "Innovación abierta", body: "Acceso preferente a soluciones fintech desarrolladas dentro del Centro para uso interno del Banco." },
                { icon: Network, title: "Talento y ecosistema", body: "Cantera de talento digital, alianzas universitarias y proyección internacional del Banco." },
              ].map(({ icon: Icon, title, body }) => (
                <HairlineCard key={title} icon={Icon} title={title}>
                  {body}
                </HairlineCard>
              ))}
            </div>

            <div
              className="mt-12 grid gap-px border sm:grid-cols-3"
              style={{ borderColor: `${ACCENT}40` }}
            >
              {[
                { value: "1.200", label: "Emprendedores atendidos / año" },
                { value: "60", label: "Startups aceleradas en 3 años" },
                { value: "3.2x", label: "Retorno estimado a 3 años" },
              ].map(({ value, label }) => (
                <div key={label} className="p-8" style={{ background: `${ACCENT}0A` }}>
                  <div
                    className="text-5xl font-light leading-none"
                    style={{ color: ACCENT, fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    {value}
                  </div>
                  <div className="mt-3 text-sm text-white/70 font-light">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 06 — Proyección financiera */}
        <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="06 · Proyección Financiera"
              title="Tres años hacia la autosostenibilidad."
              lead="Los ingresos propios del Centro (membresías de coworking, programas corporativos, patrocinios y eventos) reducen progresivamente el aporte del Banco."
            />

            <div className="mt-12 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    <th className="p-5">Concepto</th>
                    <th className="p-5">Año 1</th>
                    <th className="p-5">Año 2</th>
                    <th className="p-5">Año 3</th>
                  </tr>
                </thead>
                <tbody className="font-light text-white/75">
                  {[
                    ["Aporte Banco de Venezuela", "US$ 600.000", "US$ 450.000", "US$ 450.000"],
                    ["Ingresos por coworking", "US$ 96.000", "US$ 168.000", "US$ 216.000"],
                    ["Programas corporativos y retos", "US$ 60.000", "US$ 140.000", "US$ 220.000"],
                    ["Patrocinios y eventos", "US$ 45.000", "US$ 110.000", "US$ 180.000"],
                    ["Costos operativos totales", "US$ 690.000", "US$ 760.000", "US$ 830.000"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-white/5">
                      {row.map((cell, i) => (
                        <td key={i} className={`p-5 ${i === 0 ? "text-white/90" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr style={{ background: `${ACCENT}0F` }}>
                    <td className="p-5 font-medium text-white">Resultado operativo</td>
                    <td className="p-5" style={{ color: ACCENT }}>US$ 111.000</td>
                    <td className="p-5" style={{ color: ACCENT }}>US$ 108.000</td>
                    <td className="p-5" style={{ color: ACCENT }}>US$ 236.000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { icon: BarChart3, title: "Cobertura propia", body: "Los ingresos del Centro cubren 25% del presupuesto en el año 1 y 60% en el año 3." },
                { icon: Target, title: "Punto de equilibrio", body: "Operación equilibrada desde el primer año gracias al aporte institucional y a los ingresos mixtos." },
                { icon: TrendingUp, title: "Escalabilidad", body: "Cada sede adicional replica el modelo con 40% menos de inversión de implementación." },
              ].map(({ icon: Icon, title, body }) => (
                <HairlineCard key={title} icon={Icon} title={title}>
                  {body}
                </HairlineCard>
              ))}
            </div>
          </div>
        </section>

        {/* 07 — Estructura de la alianza */}
        <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="07 · Estructura de la Alianza"
              title="Roles definidos, gobernanza conjunta."
              lead="Se constituye una unidad operativa dedicada que administra el Centro, sus programas y sus fuentes de ingreso."
            />

            <div className="mt-14 overflow-hidden rounded-sm border border-white/10">
              <div className="grid md:grid-cols-2">
                <div
                  className="relative border-b border-white/10 p-10 md:border-b-0 md:border-r"
                  style={{ background: `${ACCENT}06` }}
                >
                  <Building2 className="h-6 w-6" style={{ color: ACCENT }} />
                  <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    Socio institucional
                  </div>
                  <div
                    className="mt-2 text-2xl font-light text-white"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    Banco de Venezuela
                  </div>
                  <ul className="mt-8 space-y-3">
                    <Bullet>Sede, infraestructura y conectividad</Bullet>
                    <Bullet>Financiamiento del programa anual</Bullet>
                    <Bullet>Productos financieros para el portafolio</Bullet>
                    <Bullet>Marca, difusión y red de clientes</Bullet>
                  </ul>
                </div>
                <div className="relative p-10">
                  <Rocket className="h-6 w-6" style={{ color: ACCENT }} />
                  <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                    Socio operador
                  </div>
                  <div
                    className="mt-2 text-2xl font-light text-white"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                  >
                    Startup Factory Hub Accelerator
                  </div>
                  <ul className="mt-8 space-y-3">
                    <Bullet>Diseño y ejecución de los cuatro pilares</Bullet>
                    <Bullet>Red de mentores, inversionistas y partners</Bullet>
                    <Bullet>Plataforma digital y medición de impacto</Bullet>
                    <Bullet>Reclutamiento y selección de startups</Bullet>
                  </ul>
                </div>
              </div>
              <div className="border-t border-white/10 bg-black/20 p-6 text-center text-sm text-white/55 font-light">
                Comité de gobernanza mixto · Revisión trimestral de indicadores · Reporte anual auditable.
              </div>
            </div>
          </div>
        </section>

        {/* 08 — Indicadores */}
        <section className="slide-panel border-t border-white/5 px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="08 · Indicadores de Gestión"
              title="Metas anuales medibles y auditables."
              lead="El 10% del contrato se vincula al cumplimiento de estos indicadores."
            />
            <div className="mt-12 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Briefcase, value: "120", label: "Puestos de coworking activos" },
                { icon: GraduationCap, value: "500", label: "Horas de mentoría al año" },
                { icon: Rocket, value: "3", label: "Cohortes de aceleración / año" },
                { icon: Calendar, value: "36", label: "Eventos y talleres al año" },
                { icon: Users, value: "1.200", label: "Emprendedores capacitados" },
                { icon: DollarSign, value: "US$ 5M", label: "Capital movilizado por el portafolio" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white/[0.02] p-7">
                  <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  <div
                    className="mt-5 text-4xl font-light leading-none"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif', color: ACCENT }}
                  >
                    {value}
                  </div>
                  <div className="mt-3 text-base font-light text-white/80">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 09 — Cronograma */}
        <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="09 · Cronograma de Implementación"
              title="Del convenio a la primera cohorte en 120 días."
            />
            <div className="mt-14 grid gap-6 md:grid-cols-4">
              {[
                { phase: "Fase 1 · Días 1-30", title: "Convenio y diseño", items: ["Firma del acuerdo", "Definición de sede", "Plan operativo y presupuesto"] },
                { phase: "Fase 2 · Días 31-60", title: "Adecuación", items: ["Obra y mobiliario", "Tecnología y conectividad", "Identidad del Centro"] },
                { phase: "Fase 3 · Días 61-90", title: "Convocatoria", items: ["Campaña nacional", "Selección de startups", "Red de mentores activa"] },
                { phase: "Fase 4 · Días 91-120", title: "Apertura", items: ["Inauguración con el Banco", "Inicio de cohorte 1", "Coworking en operación"] },
              ].map(({ phase, title, items }) => (
                <div key={phase} className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: ACCENT }}>
                    {phase}
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
                  <ul className="mt-5 space-y-3">
                    {items.map((it) => (
                      <Bullet key={it}>{it}</Bullet>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10 — Trayectoria */}
        <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
          <div className="relative mx-auto max-w-7xl">
            <SectionTitle
              kicker="10 · Trayectoria"
              title="Una plataforma aceleradora probada y reconocida."
              lead="Startup Factory Hub aporta escala, resultados de capital y reconocimiento internacional desde el primer día."
            />

            <div
              className="mt-10 flex flex-col items-start gap-4 rounded-sm border p-6 md:flex-row md:items-center md:gap-6 md:p-7"
              style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}0C` }}
            >
              <div className="relative shrink-0 overflow-hidden rounded-sm border" style={{ borderColor: `${ACCENT}66` }}>
                <img src={nasdaqFeature} alt="Startup Factory Hub en Nasdaq" className="h-16 w-28 object-cover" />
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/55">
                  Destacado en
                </div>
                <div
                  className="mt-1 text-xl md:text-2xl font-light leading-snug text-white"
                  style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                >
                  Nasdaq — <span style={{ color: ACCENT }}>plataforma aceleradora líder</span>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-px border border-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, value: "4.000+", label: "Red de la comunidad", sub: "Fundadores, mentores, inversionistas y operadores" },
                { icon: Rocket, value: "40+", label: "Startups aceleradas", sub: "En múltiples cohortes y verticales" },
                { icon: DollarSign, value: "US$ 200M", label: "Capital levantado por el portafolio", sub: "Financiamiento agregado de las empresas" },
              ].map(({ icon: Icon, value, label, sub }) => (
                <div key={label} className="bg-white/[0.02] p-7">
                  <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                  <div
                    className="mt-5 text-5xl md:text-6xl font-light leading-none"
                    style={{ fontFamily: '"Sora", "Manrope", sans-serif', color: ACCENT }}
                  >
                    {value}
                  </div>
                  <div className="mt-3 text-base font-medium text-white">{label}</div>
                  <div className="mt-1 text-sm text-white/55 font-light">{sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Kicker>Aliados del ecosistema</Kicker>
              <div className="mt-5 grid grid-cols-2 gap-px border border-white/10 sm:grid-cols-3 lg:grid-cols-6">
                {["NVIDIA Inception", "AWS Activate", "Microsoft for Startups", "Google for Startups", "Stripe", "HubSpot"].map((name) => (
                  <div key={name} className="flex h-20 items-center justify-center bg-white/[0.02] px-3">
                    <span
                      className="text-center text-sm font-medium tracking-wide text-white/70"
                      style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 11 — Plataforma digital */}
        <section className="slide-panel border-t border-white/5 bg-white/[0.015] px-6 py-12 md:px-12">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              kicker="11 · Plataforma Digital"
              title="Toda la operación medida en tiempo real."
              lead="El Banco accede a un panel institucional con la actividad del Centro, el avance de cada startup y los indicadores del contrato."
            />
            <div className="mt-12 grid gap-8 lg:grid-cols-12">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 backdrop-blur-xl lg:col-span-7">
                <div className="relative mb-6 overflow-hidden rounded-sm border border-white/10">
                  <img src={dashboardMockup} alt="Panel de la plataforma" className="h-56 w-full object-cover object-top opacity-90" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${NAV}E6, transparent 60%)` }} />
                </div>
                <ul className="space-y-3">
                  <Bullet>Portales para emprendedores, mentores e inversionistas</Bullet>
                  <Bullet>Reservas de espacios y control de aforo del coworking</Bullet>
                  <Bullet>Seguimiento de cohortes, hitos y entregables</Bullet>
                  <Bullet>Panel institucional del Banco con KPI del contrato</Bullet>
                  <Bullet>Reportes exportables para auditoría y comunicación</Bullet>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 backdrop-blur-xl lg:col-span-5">
                <MapPin className="h-6 w-6" style={{ color: ACCENT }} />
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
                  Sede insignia
                </div>
                <h3 className="mt-3 text-2xl font-light text-white" style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}>
                  Centro de Innovación BDV
                </h3>
                <div className="relative mt-6 overflow-hidden rounded-sm border border-white/10">
                  <img src={coworkingSpace} alt="Espacio de coworking" className="h-40 w-full object-cover opacity-85" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${NAV}E6, transparent 60%)` }} />
                </div>
                <ul className="mt-6 space-y-3">
                  <Bullet>120 puestos de trabajo flexibles</Bullet>
                  <Bullet>Salas de mentoría y aula de formación</Bullet>
                  <Bullet>Auditorio para eventos y Demo Day</Bullet>
                  <Bullet>Réplica del modelo en otras ciudades</Bullet>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 12 — Impacto */}
        <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
          <div className="relative mx-auto grid max-w-7xl gap-16 md:grid-cols-2">
            <div>
              <Kicker>12 · Visión</Kicker>
              <p
                className="mt-6 text-3xl md:text-4xl font-light leading-tight text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Convertir al Banco de Venezuela en el{" "}
                <span className="italic" style={{ color: ACCENT }}>
                  motor financiero del emprendimiento digital
                </span>{" "}
                del país.
              </p>
            </div>
            <div>
              <Kicker>Misión</Kicker>
              <p
                className="mt-6 text-3xl md:text-4xl font-light leading-tight text-white"
                style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
              >
                Acompañar a cada emprendedor con espacio, mentoría, aceleración y formación para{" "}
                <span className="italic" style={{ color: ACCENT }}>
                  crear, crecer y escalar.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* 13 — Cierre */}
        <section className="slide-panel relative overflow-hidden border-t border-white/5 px-6 py-12 md:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at center, ${ACCENT}30, transparent 60%)` }}
          />
          <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
            <Kicker>Próximo paso</Kicker>
            <h2
              className="mt-8 text-4xl md:text-6xl font-light leading-[1.05] tracking-tight text-white"
              style={{ fontFamily: '"Sora", "Manrope", sans-serif' }}
            >
              Construyamos el centro de innovación del{" "}
              <span className="italic" style={{ color: ACCENT }}>
                Banco de Venezuela.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-white/60 font-light">
              Agradecemos la oportunidad de presentar esta propuesta económica a la directiva del
              Banco de Venezuela y avanzar hacia la firma del convenio.
            </p>
            <a
              href="mailto:partnerships@startupfactoryhub.com"
              className="mt-12 inline-flex items-center gap-3 border px-8 py-4 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              <Mail className="h-4 w-4" />
              Agendar presentación
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="slide-panel border-t border-white/5 px-6 py-14 md:px-12 flex items-center">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <img src={sfhLogo} alt="Startup Factory Hub" className="h-10 object-contain opacity-90" />
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                  Confidencial y propietario
                </div>
                <div className="mt-1 text-sm text-white/60 font-light">
                  © 2026 Startup Factory Hub Accelerator · startupfactoryhub.com
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
              Propuesta 2026 · Caracas, Venezuela
            </div>
          </div>
        </footer>
      </main>

      {/* HUD de navegación */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between px-6 pb-6 md:px-12">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#0A0D12]/70 px-4 py-2 backdrop-blur-xl"
          style={{ boxShadow: `0 0 30px ${ACCENT}22` }}
        >
          <button
            onClick={() => goTo(slide - 1)}
            disabled={slide === 0}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/80 transition hover:border-[var(--a)] hover:text-white disabled:opacity-30"
            style={{ ['--a' as any]: ACCENT }}
            aria-label="Lámina anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/70 min-w-[70px] text-center">
            <span style={{ color: ACCENT }}>{String(slide + 1).padStart(2, "0")}</span>
            <span className="mx-1 text-white/30">/</span>
            <span>{String(TOTAL_SLIDES).padStart(2, "0")}</span>
          </div>
          <button
            onClick={() => goTo(slide + 1)}
            disabled={slide >= TOTAL_SLIDES - 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/80 transition hover:border-[var(--a)] hover:text-white disabled:opacity-30"
            style={{ ['--a' as any]: ACCENT }}
            aria-label="Lámina siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-auto hidden items-center gap-1.5 rounded-full border border-white/10 bg-[#0A0D12]/70 px-3 py-2 backdrop-blur-xl md:flex">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Lámina ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === slide ? 28 : 8,
                background: i === slide ? ACCENT : "rgba(255,255,255,0.18)",
                boxShadow: i === slide ? `0 0 12px ${ACCENT}` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BDVPartnership;
