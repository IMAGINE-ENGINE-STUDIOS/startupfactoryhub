import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import {
  Home, ChevronLeft, ChevronRight, Rocket, Target, Users, GraduationCap, BookOpen,
  Brain, Cog, Link2, Wifi, Telescope, Award, Clock, DollarSign, FileCheck, Mail,
  Star, Globe, Diamond, Network, MapPin, CheckCircle, Layers, Lightbulb,
  Building2, Briefcase, Crown, Microscope, TrendingUp, Zap, Handshake, Wallet,
} from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import coverImg from '@/assets/academia/cover.jpg';
import aiImg from '@/assets/academia/ai-hero.jpg';
import roboticsImg from '@/assets/academia/robotics.jpg';
import blockchainImg from '@/assets/academia/blockchain.jpg';
import iotImg from '@/assets/academia/iot.jpg';
import newspaceImg from '@/assets/academia/newspace.jpg';
import professionalsImg from '@/assets/academia/professionals.jpg';
import certificateImg from '@/assets/academia/certificate.jpg';
import dividerFuture from '@/assets/academia/divider-future.jpg';
import dividerTunnel from '@/assets/academia/divider-tunnel.jpg';
import dividerOrbit from '@/assets/academia/divider-orbit.jpg';
import dividerQuantum from '@/assets/academia/divider-quantum.jpg';
import pillarVision from '@/assets/academia/pillar-vision.jpg';
import pillarCases from '@/assets/academia/pillar-cases.jpg';
import pillarConverge from '@/assets/academia/pillar-converge.jpg';
import pillarApplied from '@/assets/academia/pillar-applied.jpg';

const useFlipbookSupported = () => {
  const [supported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = window.navigator.userAgent;
    const isChromium = /Chrome|Chromium|CriOS/.test(ua) && !/Edg|EdgiOS|OPR|SamsungBrowser/.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);
    return isChromium && !isMobile;
  });
  return supported;
};

const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixSymbolLayer = ({ density = 0.08, columns = 32 }: { density?: number; columns?: number }) => {
  const cols = Array.from({ length: columns }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: density }}>
      {cols.map((c) => {
        const charsInCol = 22 + Math.floor(Math.random() * 10);
        const left = (c / columns) * 100;
        const delay = (Math.random() * 4).toFixed(2);
        return (
          <div
            key={c}
            className="absolute top-0 text-teal-400 font-mono text-[11px] leading-[14px] whitespace-pre"
            style={{
              left: `${left}%`,
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              animation: `matrix-fall 18s linear ${delay}s infinite`,
              textShadow: '0 0 6px rgba(20,184,166,0.6)',
            }}
          >
            {Array.from({ length: charsInCol }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join('')}
          </div>
        );
      })}
    </div>
  );
};

const TechGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(24)].map((_, i) => <div key={`h-${i}`} className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/8 to-transparent" style={{ top: `${(i + 1) * 4}%` }} />)}
    {[...Array(16)].map((_, i) => <div key={`v-${i}`} className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/8 to-transparent" style={{ left: `${(i + 1) * 6}%` }} />)}
  </div>
);

const FloatingHexagons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[8%] right-[5%] w-28 h-28 border-2 border-teal-500/15 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute top-[15%] right-[12%] w-16 h-16 border border-cyan-500/12 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[12%] left-[5%] w-20 h-20 border-2 border-teal-500/12 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
  </div>
);

const EnergyLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 -left-20 w-56 h-56 border-2 border-teal-500/10 rounded-full" />
    <div className="absolute top-1/3 -right-20 w-56 h-56 border-2 border-cyan-500/10 rounded-full" />
  </div>
);

const CornerAccents = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-4 left-4"><div className="w-10 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" /><div className="w-0.5 h-10 bg-gradient-to-b from-teal-500 to-transparent" /></div>
    <div className="absolute top-4 right-4"><div className="w-10 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" /><div className="w-0.5 h-10 bg-gradient-to-b from-teal-500 to-transparent ml-auto" /></div>
    <div className="absolute bottom-4 left-4"><div className="w-0.5 h-10 bg-gradient-to-t from-teal-500 to-transparent" /><div className="w-10 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" /></div>
    <div className="absolute bottom-4 right-4"><div className="w-0.5 h-10 bg-gradient-to-t from-teal-500 to-transparent ml-auto" /><div className="w-10 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" /></div>
  </div>
);

const TechCard = ({ children, className = "", glowColor = "teal" }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const ringMap: Record<string, string> = {
    teal: "ring-teal-500/20", cyan: "ring-cyan-500/20", purple: "ring-purple-500/20",
    emerald: "ring-emerald-500/20", amber: "ring-amber-500/20", rose: "ring-rose-500/20",
  };
  const dotMap: Record<string, string> = {
    teal: "bg-teal-400", cyan: "bg-cyan-400", purple: "bg-purple-400",
    emerald: "bg-emerald-400", amber: "bg-amber-400", rose: "bg-rose-400",
  };
  return (
    <div className={`relative bg-slate-900/70 border-0 ring-1 ${ringMap[glowColor]} backdrop-blur-sm rounded-lg p-4 ${className}`}>
      <span className={`absolute top-1 left-1 w-1.5 h-1.5 ${dotMap[glowColor]}`} />
      <span className={`absolute top-1 right-1 w-1.5 h-1.5 ${dotMap[glowColor]}`} />
      <span className={`absolute bottom-1 left-1 w-1.5 h-1.5 ${dotMap[glowColor]} opacity-60`} />
      <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 ${dotMap[glowColor]} opacity-60`} />
      <div className="relative">{children}</div>
    </div>
  );
};

const IconBadge = ({ icon: Icon, color = "teal" }: { icon: React.ComponentType<{ className?: string }>; color?: string }) => {
  const colorClasses: Record<string, string> = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  };
  return (
    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.teal}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
};

const SectionHeader = ({ kicker, title, accent = "teal", folio }: { kicker: string; title: string; accent?: string; folio?: string }) => {
  const dot: Record<string, string> = { teal: "bg-teal-500", cyan: "bg-cyan-500", emerald: "bg-emerald-500", amber: "bg-amber-500", purple: "bg-purple-500", rose: "bg-rose-500" };
  const text: Record<string, string> = { teal: "text-teal-400", cyan: "text-cyan-400", emerald: "text-emerald-400", amber: "text-amber-400", purple: "text-purple-400", rose: "text-rose-400" };
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 ${dot[accent]} rotate-45`} />
          <span className={`text-[13px] font-semibold ${text[accent]} tracking-[0.45em] uppercase`}>{kicker}</span>
        </div>
        {folio && (
          <span className={`font-futuristic text-[64px] leading-none font-black ${text[accent]} opacity-30 tabular-nums`}>{folio}</span>
        )}
      </div>
      <h2 className="font-futuristic text-[56px] md:text-[64px] font-black text-white leading-[0.95] tracking-tight mb-3">{title}</h2>
      <div className="flex items-center gap-3">
        <div className={`h-[2px] w-20 ${dot[accent]}`} />
        <span className={`font-mono text-[11px] ${text[accent]} tracking-[0.3em] uppercase opacity-70`}>Spacely · Academia</span>
      </div>
    </div>
  );
};

const BASE_W = 842;
const BASE_H = 1280;

const A4Wrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setScale(width / BASE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={containerRef} className="w-full bg-slate-950" style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
      <div data-slide style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: '50%',
        marginLeft: -(BASE_W / 2), marginTop: -(BASE_H / 2),
        transform: `scale(${scale})`, transformOrigin: 'center center',
      }}>
        <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
        <MatrixSymbolLayer density={0.07} columns={28} />
        <div className="bg-slate-900/70 border-0 ring-1 ring-teal-500/30 backdrop-blur-sm absolute inset-0 pointer-events-none" />
        {children}
      </div>
    </div>
  );
};

const PageShell = ({ children, accent = "teal", folio }: { children: React.ReactNode; accent?: string; folio?: string }) => {
  const ring: Record<string, string> = { teal: "border-teal-500/30", cyan: "border-cyan-500/30", emerald: "border-emerald-500/30", amber: "border-amber-500/30", purple: "border-purple-500/30", rose: "border-rose-500/30" };
  const text: Record<string, string> = { teal: "text-teal-400", cyan: "text-cyan-400", emerald: "text-emerald-400", amber: "text-amber-400", purple: "text-purple-400", rose: "text-rose-400" };
  return (
    <A4Wrapper>
      <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className={`absolute inset-[0.8%] border-2 ${ring[accent]} rounded-lg`} />
        <TechGrid />
        <FloatingHexagons />
        <EnergyLines />
        <CornerAccents />
        <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col">
          <div className="flex flex-col flex-1">{children}</div>
          <div className={`mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between font-mono text-[11px] ${text[accent]} tracking-[0.3em] uppercase opacity-70`}>
            <span>// Programa Internacional</span>
            <span>Tecnologías Convergentes</span>
            {folio && <span>Pág · {folio}</span>}
          </div>
        </div>
      </section>
    </A4Wrapper>
  );
};

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="bg-slate-950 overflow-hidden">{children}</div>
));
BookPage.displayName = "BookPage";

const DividerPage = ({ image, chapter, title, subtitle, accent = "teal" }: { image: string; chapter: string; title: string; subtitle: string; accent?: string }) => {
  const border: Record<string, string> = { teal: "border-teal-500/50", cyan: "border-cyan-500/50", purple: "border-purple-500/50", emerald: "border-emerald-500/50", amber: "border-amber-500/50" };
  const text: Record<string, string> = { teal: "text-teal-300", cyan: "text-cyan-300", purple: "text-purple-300", emerald: "text-emerald-300", amber: "text-amber-300" };
  return (
    <A4Wrapper>
      <section className="absolute inset-0 overflow-hidden">
        <img src={image} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/35 to-slate-950/95" />
        <div className={`absolute inset-[1.2%] border-2 ${border[accent]} rounded-lg pointer-events-none`} />
        <CornerAccents />
        <MatrixSymbolLayer density={0.06} columns={20} />
        <div className="relative z-10 h-full flex flex-col justify-between p-[8%]">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-px ${accent === 'teal' ? 'bg-teal-400' : accent === 'cyan' ? 'bg-cyan-400' : accent === 'purple' ? 'bg-purple-400' : accent === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`font-mono text-[15px] ${text[accent]} tracking-[0.45em] uppercase`}>{chapter}</span>
          </div>
          <div className="max-w-[88%]">
            <h2 className="font-futuristic text-5xl md:text-6xl font-black text-white leading-[0.95] tracking-tight mb-5 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              {title}
            </h2>
            <div className={`h-[3px] w-24 mb-5 ${accent === 'teal' ? 'bg-teal-400' : accent === 'cyan' ? 'bg-cyan-400' : accent === 'purple' ? 'bg-purple-400' : accent === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <p className="text-xl text-slate-200 leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {subtitle}
            </p>
          </div>
          <div className="flex items-center justify-between font-mono text-[13px] text-slate-400 tracking-[0.3em] uppercase">
            <span>// Spacely · Academia</span>
            <span className={text[accent]}>{chapter}</span>
          </div>
        </div>
      </section>
    </A4Wrapper>
  );
};

const MODULES = [
  { icon: Brain, title: "Módulo 1 · Inteligencia Artificial", desc: "Fundamentos y aplicaciones de la IA para el futuro.", color: "teal", img: aiImg },
  { icon: Cog, title: "Módulo 2 · Robótica Moderna", desc: "Máquinas inteligentes para la industria y la sociedad.", color: "cyan", img: roboticsImg },
  { icon: Link2, title: "Módulo 3 · Blockchain", desc: "Confianza digital más allá de las criptomonedas.", color: "purple", img: blockchainImg },
  { icon: Wifi, title: "Módulo 4 · Internet de las Cosas (IoT)", desc: "Conectando el mundo físico y el digital.", color: "emerald", img: iotImg },
  { icon: Telescope, title: "Módulo 5 · NewSpace", desc: "La nueva economía espacial y las oportunidades del siglo XXI.", color: "amber", img: newspaceImg },
];

const SPECIFIC_OBJECTIVES = [
  "Comprender los conceptos fundamentales de la Inteligencia Artificial.",
  "Identificar aplicaciones de la robótica en entornos industriales, científicos y comerciales.",
  "Analizar el funcionamiento y potencial de Blockchain en procesos organizacionales.",
  "Comprender los principios y aplicaciones del Internet de las Cosas (IoT).",
  "Conocer las principales tendencias y oportunidades del ecosistema NewSpace.",
  "Evaluar escenarios de convergencia tecnológica entre las distintas disciplinas.",
  "Aplicar los conocimientos mediante el desarrollo de un caso práctico.",
];

const AUDIENCE = [
  "Profesionales de empresas públicas y privadas",
  "Ejecutivos y tomadores de decisiones",
  "Emprendedores y líderes de innovación",
  "Consultores y asesores tecnológicos",
  "Académicos e investigadores",
  "Profesionales de transformación digital",
];

export default function BrochureAcademia() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 14;

  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') flipPrev();
      else if (e.key === 'ArrowRight') flipNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipPrev, flipNext]);

  const flipbookSupported = useFlipbookSupported();

  const pagesArr = [
    /* ===== COVER ===== */
    <BookPage key="cover">
      <A4Wrapper>
        <section className="absolute inset-0 flex flex-col items-center justify-between p-[6%] py-[8%] overflow-hidden">
          <img src={coverImg} alt="Convergencia tecnológica" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.55) 40%, rgba(2,6,23,0.92) 100%)' }} />
          <MatrixSymbolLayer density={0.18} columns={36} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(20,184,166,0.18) 0%, rgba(2,6,23,0.65) 70%)' }} />
          <div className="absolute inset-[0.8%] border-2 border-teal-500/50 rounded-lg" />
          <TechGrid /><FloatingHexagons /><EnergyLines /><CornerAccents />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/15 border border-teal-500/50 rounded-full mb-2 backdrop-blur-sm shadow-[0_0_20px_rgba(20,184,166,0.4)]">
              <Star className="h-4 w-4 text-teal-300" />
              <span className="text-[15px] font-bold text-teal-300 tracking-[0.35em] uppercase">Programa Internacional</span>
              <Star className="h-4 w-4 text-teal-300" />
            </div>
            <div className="font-mono text-[14px] text-teal-500/70 tracking-[0.4em]">// SPACELY · STARTUP FACTORY HUB · ACADEMIA //</div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-teal-500/40 blur-[80px] rounded-full scale-150" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[420px] max-w-full object-contain drop-shadow-[0_0_60px_rgba(20,184,166,0.7)]" />
            </div>

            <h2 className="font-futuristic text-[26px] font-black tracking-[0.12em] uppercase bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(20,184,166,0.6)]">
              Tecnologías Exponenciales
            </h2>
            <h2 className="font-futuristic text-[26px] font-black tracking-[0.12em] uppercase bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] mb-4">
              para el Futuro
            </h2>

            <p className="text-lg text-slate-300 max-w-lg leading-relaxed mb-5">
              Inteligencia Artificial · Robótica · Blockchain · IoT · NewSpace
            </p>

            <div className="relative bg-slate-900/70 border-0 ring-1 ring-teal-500/40 rounded-xl px-10 py-3 backdrop-blur-sm shadow-[0_0_40px_rgba(20,184,166,0.25)]">
              <p className="font-futuristic text-xl font-black text-white tracking-[0.25em]">PROPUESTA DE PROGRAMA INTERNACIONAL</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center w-full">
            <div className="flex items-center gap-4 mb-2">
              <Globe className="h-6 w-6 text-cyan-400 animate-pulse" />
              <span className="font-futuristic text-lg font-bold text-cyan-300 tracking-[0.3em]">ACADEMIA SPACELY</span>
              <Globe className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="bg-slate-900/70 border-0 ring-1 ring-teal-500/30 backdrop-blur-sm w-full flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-mono text-[14px] text-emerald-300 tracking-widest">PROGRAMA ONLINE</span>
              </div>
              <span className="font-mono text-[14px] text-teal-400/80 tracking-widest">// 40 HORAS ACADÉMICAS //</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] text-cyan-300 tracking-widest">CERTIFICACIÓN INTERNACIONAL</span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </A4Wrapper>
    </BookPage>,

    /* ===== ÍNDICE ===== */
    <BookPage key="toc">
      <PageShell accent="cyan" folio="02">
        <SectionHeader kicker="Contenido" title="Índice del Programa" accent="cyan" folio="02" />
        <div className="grid grid-cols-2 gap-3 flex-1 content-stretch">
          {[
            "Introducción", "Justificación y descripción",
            "Objetivo general", "Objetivos específicos",
            "Perfil de los participantes", "Estructura curricular",
            "Metodología", "Sistema de evaluación",
            "Certificación", "Período",
            "Precio", "Condiciones comerciales",
            "Información adicional", "Consultas",
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/70 border-0 ring-1 ring-teal-500/20 backdrop-blur-sm rounded-lg px-6 py-7 flex items-center gap-5">
              <span className="font-futuristic text-cyan-400 text-5xl font-black w-14 tabular-nums leading-none">{String(i + 1).padStart(2, '0')}</span>
              <div className="h-12 w-px bg-cyan-500/30" />
              <span className="text-slate-100 text-2xl font-semibold leading-tight">{item}</span>
            </div>
          ))}
        </div>
      </PageShell>
    </BookPage>,

    /* ===== DIVIDER I ===== */
    <BookPage key="divider-1">
      <DividerPage
        image={dividerTunnel}
        chapter="Capítulo I"
        title={`El umbral\nde lo exponencial.`}
        subtitle="Un viaje al futuro donde la IA, la robótica, el blockchain, el IoT y el espacio convergen para redefinir la economía global."
        accent="teal"
      />
    </BookPage>,

    /* ===== ANTECEDENTES + JUSTIFICACIÓN ===== */
    <BookPage key="antecedentes">
      <PageShell accent="teal" folio="04">
        <SectionHeader kicker="01 · 02" title="Introducción" folio="04" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative">
            <span className="absolute -left-2 -top-4 font-futuristic text-[110px] leading-none font-black text-teal-500/15 select-none">A</span>
            <p className="text-[22px] text-slate-100 leading-[1.55] pl-2">
              <span className="float-left font-futuristic text-[78px] leading-[0.85] font-black text-teal-400 pr-3 pt-1">L</span>
              as tecnologías emergentes están transformando aceleradamente los modelos de negocio, la industria, los servicios públicos y la economía global. La convergencia entre <span className="text-teal-400 font-semibold">IA, Robótica, Blockchain, IoT y NewSpace</span> está generando nuevas oportunidades de innovación, competitividad y desarrollo económico.
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] gap-5 items-start">
            <div className="h-px bg-gradient-to-r from-transparent via-teal-500/40 to-transparent col-span-3" />
          </div>
          <TechCard glowColor="cyan">
            <div className="flex items-start gap-4">
              <IconBadge icon={Rocket} color="cyan" />
              <p className="text-[19px] text-slate-200 leading-relaxed italic">
                "El programa entrega conocimientos estratégicos y prácticos sobre cinco áreas tecnológicas clave, permitiendo comprender fundamentos, identificar oportunidades, analizar casos de uso y evaluar la convergencia tecnológica que impulsará la próxima generación de servicios, productos y modelos de negocio."
              </p>
            </div>
          </TechCard>
          <div className="grid grid-cols-2 gap-3 flex-1 content-stretch">
            {[
              { t: "Visión integral", d: "Fundamentos, aplicaciones y tendencias.", c: "emerald", n: "I", img: pillarVision },
              { t: "Casos reales", d: "Análisis nacional e internacional.", c: "purple", n: "II", img: pillarCases },
              { t: "Convergencia", d: "Cinco tecnologías, una visión integrada.", c: "amber", n: "III", img: pillarConverge },
              { t: "Caso aplicado", d: "Desarrollo práctico final.", c: "rose", n: "IV", img: pillarApplied },
            ].map((p, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl ring-1 ring-teal-500/25 min-h-[200px] group">
                <img src={p.img} alt={p.t} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-55" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/10" />
                <span className="absolute top-3 right-4 font-futuristic text-[64px] leading-none font-black text-white/15 tracking-tight">{p.n}</span>
                <div className="absolute top-3 left-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                  <span className="font-mono text-[10px] text-teal-300/80 tracking-[0.3em] uppercase">Pilar · 0{i + 1}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="h-[2px] w-12 bg-teal-400 mb-3" />
                  <p className="font-futuristic font-black text-white text-[28px] leading-[0.95] tracking-tight uppercase mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">{p.t}</p>
                  <p className="text-[15px] text-slate-200 leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== OBJETIVOS ===== */
    <BookPage key="obj">
      <PageShell accent="emerald" folio="05">
        <SectionHeader kicker="03 · 04" title="Objetivos del Programa" accent="emerald" folio="05" />
        <div className="flex-1 flex flex-col gap-5">
          <TechCard glowColor="emerald">
            <div className="flex items-start gap-4">
              <IconBadge icon={Target} color="emerald" />
              <div>
                <p className="text-[13px] font-semibold text-emerald-400 tracking-[0.4em] uppercase mb-2">Objetivo General</p>
                <p className="text-[22px] text-slate-100 leading-[1.5]">
                  Introducir a los participantes en los fundamentos, aplicaciones y oportunidades de la <span className="text-emerald-400 font-semibold">IA, Robótica, Blockchain, IoT y NewSpace</span>, permitiéndoles comprender su impacto en la transformación digital y en el desarrollo de la nueva economía global y espacial.
                </p>
              </div>
            </div>
          </TechCard>
          <div className="flex items-center gap-4 pt-2">
            <span className="font-futuristic text-emerald-400 text-[44px] font-black leading-none">07</span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-400 tracking-[0.4em] uppercase">Objetivos Específicos</p>
              <p className="text-sm text-slate-400 italic">Capacidades que el participante desarrollará durante el programa.</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/40 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 content-stretch">
            {SPECIFIC_OBJECTIVES.map((o, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 ring-1 ring-emerald-500/25 hover:ring-emerald-400/60 transition-all p-4 flex flex-col gap-3"
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-emerald-400 via-teal-400 to-transparent" />
                <div className="flex items-center justify-between relative">
                  <span className="font-futuristic font-black text-[34px] leading-none bg-gradient-to-br from-emerald-300 to-teal-500 bg-clip-text text-transparent">
                    0{i + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-emerald-400/70">OBJ</span>
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-emerald-500/40 to-transparent" />
                <span className="text-[15px] text-slate-100 leading-snug font-medium relative">{o}</span>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== DIVIDER II ===== */
    <BookPage key="divider-2">
      <DividerPage
        image={dividerFuture}
        chapter="Capítulo II"
        title={`Los nuevos\nexploradores.`}
        subtitle="Profesionales y líderes que se atreven a mirar más allá del horizonte y construir las industrias del mañana."
        accent="cyan"
      />
    </BookPage>,

    /* ===== PERFIL ===== */
    <BookPage key="perfil">
      <PageShell accent="purple" folio="07">
        <SectionHeader kicker="05" title="Perfil de los Participantes" accent="purple" folio="07" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative rounded-xl overflow-hidden ring-1 ring-purple-500/30 h-[280px]">
            <img src={professionalsImg} alt="Profesionales" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute top-4 left-4 px-3 py-1 bg-purple-500/30 border border-purple-400/50 backdrop-blur-sm rounded-full">
              <p className="font-mono text-[11px] text-purple-100 tracking-[0.3em] uppercase">// Reportaje 05</p>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <p className="font-futuristic text-[40px] font-black text-white leading-[1.05] drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">Tecnologías emergentes<br/>para quienes lideran<br/><span className="text-purple-300">la transformación.</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 content-stretch">
            {[
              { label: AUDIENCE[0], icon: Building2, color: "teal" },
              { label: AUDIENCE[1], icon: Crown, color: "amber" },
              { label: AUDIENCE[2], icon: Lightbulb, color: "cyan" },
              { label: AUDIENCE[3], icon: Brain, color: "emerald" },
              { label: AUDIENCE[4], icon: Microscope, color: "purple" },
              { label: AUDIENCE[5], icon: Cog, color: "rose" },
            ].map((a, i) => {
              const dotCls: Record<string, string> = { teal: "bg-teal-400", cyan: "bg-cyan-400", emerald: "bg-emerald-400", purple: "bg-purple-400", amber: "bg-amber-400", rose: "bg-rose-400" };
              const ringCls: Record<string, string> = { teal: "ring-teal-500/25 hover:ring-teal-400/60", cyan: "ring-cyan-500/25 hover:ring-cyan-400/60", emerald: "ring-emerald-500/25 hover:ring-emerald-400/60", purple: "ring-purple-500/25 hover:ring-purple-400/60", amber: "ring-amber-500/25 hover:ring-amber-400/60", rose: "ring-rose-500/25 hover:ring-rose-400/60" };
              const textCls: Record<string, string> = { teal: "text-teal-300", cyan: "text-cyan-300", emerald: "text-emerald-300", purple: "text-purple-300", amber: "text-amber-300", rose: "text-rose-300" };
              const fromCls: Record<string, string> = { teal: "from-teal-400", cyan: "from-cyan-400", emerald: "from-emerald-400", purple: "from-purple-400", amber: "from-amber-400", rose: "from-rose-400" };
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-900/40 ${ringCls[a.color]} ring-1 transition-all p-4 flex flex-col gap-3`}
                >
                  <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${dotCls[a.color]} opacity-10 blur-2xl`} />
                  <div className={`absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${fromCls[a.color]} via-white/30 to-transparent`} />
                  <div className="flex items-center justify-between relative">
                    <span className={`font-futuristic font-black text-[34px] leading-none bg-gradient-to-br ${fromCls[a.color]} to-white/60 bg-clip-text text-transparent`}>
                      0{i + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1 h-1 rounded-full ${dotCls[a.color]} animate-pulse`} />
                      <span className={`font-mono text-[9px] tracking-[0.3em] uppercase ${textCls[a.color]} opacity-70`}>PERFIL</span>
                    </div>
                  </div>
                  <div className={`h-px bg-gradient-to-r ${fromCls[a.color]} opacity-40 to-transparent`} />
                  <div className="flex items-center gap-3 relative">
                    <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${fromCls[a.color]} to-white/20 flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-[16px] text-slate-100 leading-snug font-medium">{a.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 ring-1 ring-amber-500/30 backdrop-blur-sm px-5 py-4 flex items-center gap-4">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-400/10 blur-2xl" />
            <Star className="h-6 w-6 text-amber-400 shrink-0 relative" />
            <span className="text-[16px] text-slate-100 leading-snug relative"><span className="text-amber-400 font-semibold">No se requieren</span> conocimientos técnicos previos — el programa está diseñado para profesionales de cualquier disciplina.</span>
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== ESTRUCTURA CURRICULAR ===== */
    <BookPage key="curric">
      <PageShell accent="teal" folio="08">
        <SectionHeader kicker="06" title="Estructura Curricular" folio="08" />
        <div className="flex flex-col gap-3 flex-1">
          {MODULES.map((m, i) => (
            <TechCard key={i} glowColor={m.color} className="!p-0 overflow-hidden flex-1">
              <div className="flex items-stretch h-full min-h-[120px]">
                <div className="relative w-[200px] shrink-0 overflow-hidden">
                  <img src={m.img} alt={m.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/85" />
                  <span className="absolute top-2 left-2 font-futuristic text-5xl font-black text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-none">0{i + 1}</span>
                </div>
                <div className="flex items-center gap-4 px-5 py-4 flex-1">
                  <IconBadge icon={m.icon} color={m.color} />
                  <div className="flex-1">
                    <p className="font-mono text-[11px] text-slate-500 tracking-[0.3em] uppercase mb-1">Módulo · 0{i + 1}</p>
                    <p className="font-futuristic font-black text-white text-[22px] leading-tight mb-1">{m.title.replace(/^Módulo \d+ · /, '')}</p>
                    <p className="text-[15px] text-slate-300 leading-snug">{m.desc}</p>
                  </div>
                </div>
              </div>
            </TechCard>
          ))}
          <div className="bg-slate-900/70 border-0 ring-1 ring-cyan-500/30 backdrop-blur-sm rounded-lg px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <Diamond className="h-4 w-4 text-cyan-400" />
              <p className="text-[13px] font-semibold text-cyan-400 tracking-[0.4em] uppercase">Proyecto Integrador</p>
              <div className="flex-1 h-px bg-cyan-500/30" />
            </div>
            <ul className="text-[16px] text-slate-100 space-y-1 list-disc list-inside leading-snug">
              <li>Diseñar y validar un proyecto con potencial real de implementación técnica y comercial.</li>
              <li>Vincularse activamente con el ecosistema, generando redes y oportunidades de desarrollo profesional.</li>
            </ul>
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== DIVIDER III ===== */
    <BookPage key="divider-3">
      <DividerPage
        image={dividerQuantum}
        chapter="Capítulo III"
        title={`La convergencia\nde inteligencias.`}
        subtitle="Una metodología viva: aprender haciendo, conectando saberes y aplicándolos a casos reales del presente y del futuro."
        accent="purple"
      />
    </BookPage>,

    <BookPage key="metodo">
      <PageShell accent="cyan" folio="10">
        <SectionHeader kicker="07 · 08" title="Metodología & Evaluación" accent="cyan" folio="10" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <TechCard glowColor="cyan" className="h-full">
              <IconBadge icon={Layers} color="cyan" />
              <p className="text-[13px] font-semibold text-cyan-400 tracking-[0.4em] uppercase mt-3 mb-2">Modalidad</p>
              <p className="text-[18px] text-slate-100 leading-snug">
                <span className="text-cyan-400 font-semibold">Online</span>, combinando actividades sincrónicas y asincrónicas a través de la plataforma e-learning <span className="text-white font-semibold">Academia Spacely</span>.
              </p>
              <p className="font-mono text-[12px] text-cyan-300/70 mt-2">academia.spacely.cl</p>
            </TechCard>
            <TechCard glowColor="emerald" className="h-full">
              <IconBadge icon={BookOpen} color="emerald" />
              <p className="text-[13px] font-semibold text-emerald-400 tracking-[0.4em] uppercase mt-3 mb-2">Aprendizaje Aplicado</p>
              <p className="text-[18px] text-slate-100 leading-snug">
                Los participantes desarrollarán un caso práctico que integre una o más de las tecnologías abordadas, orientado a una problemática real o oportunidad de innovación.
              </p>
            </TechCard>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <span className="font-futuristic text-cyan-400 text-[44px] font-black leading-none">08</span>
            <div>
              <p className="text-[13px] font-semibold text-cyan-400 tracking-[0.4em] uppercase">Sistema de Evaluación</p>
              <p className="text-sm text-slate-400 italic">Criterios de aprobación del programa.</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/40 to-transparent" />
          </div>

          <div className="relative bg-gradient-to-br from-slate-950 to-slate-900/60 border-0 ring-1 ring-cyan-500/30 backdrop-blur-sm rounded-xl overflow-hidden flex-1 flex flex-col">
            {/* analytical grid background */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* header row: formula */}
            <div className="relative flex items-center justify-between px-5 py-3 bg-cyan-500/10 border-b border-cyan-500/30">
              <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 tracking-[0.25em] uppercase">
                <span className="text-cyan-400">ƒ(x)</span>
                <span className="text-slate-500">=</span>
                <span>Nota Final</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300">
                <span className="text-slate-500">Σ</span>
                <span className="tabular-nums">w<sub>i</sub> · c<sub>i</sub></span>
                <span className="text-slate-500">=</span>
                <span className="text-cyan-300 font-bold tabular-nums">100%</span>
              </div>
            </div>

            {/* criteria rows */}
            <div className="relative flex-1 flex flex-col divide-y divide-slate-800/80">
              {[
                { k: "Asistencia mínima", v: 70, code: "c₁" },
                { k: "Participación en foro", v: 10, code: "c₂" },
                { k: "Caso práctico aplicado", v: 20, code: "c₃" },
              ].map((row, i) => (
                <div key={row.k} className="relative flex-1 px-5 py-4 flex flex-col justify-center gap-2 hover:bg-cyan-500/[0.03] transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] text-cyan-400/70 tracking-[0.25em] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-mono text-[11px] text-cyan-300/80">{row.code}</span>
                      <span className="text-[17px] text-slate-100 font-medium truncate">{row.k}</span>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <span className="font-futuristic text-[34px] font-black text-white tabular-nums leading-none">{row.v}</span>
                      <span className="font-mono text-cyan-400 text-base">%</span>
                    </div>
                  </div>
                  {/* analytical progress bar */}
                  <div className="relative h-[6px] bg-slate-800/60 rounded-full overflow-hidden ring-1 ring-cyan-500/10">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-teal-300 rounded-full"
                      style={{ width: `${row.v}%` }}
                    />
                    {/* tick marks */}
                    <div className="absolute inset-0 flex justify-between px-[2px] pointer-events-none">
                      {Array.from({ length: 11 }).map((_, t) => (
                        <span key={t} className="w-px h-full bg-slate-950/40" />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-slate-500 tabular-nums tracking-wider">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* footer total */}
            <div className="relative flex items-center justify-between px-5 py-3 bg-cyan-500/10 border-t border-cyan-500/30">
              <span className="font-mono text-[11px] text-cyan-300 tracking-[0.3em] uppercase">Total ponderación</span>
              <div className="flex items-center gap-2 font-mono text-cyan-300">
                <span className="text-slate-500 text-xs">Σ =</span>
                <span className="font-futuristic text-2xl font-black text-white tabular-nums">100.00</span>
                <span className="text-cyan-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== CERTIFICACIÓN + PERÍODO ===== */
    <BookPage key="cert">
      <PageShell accent="amber" folio="11">
        <SectionHeader kicker="09 · 10" title="Certificación & Período" accent="amber" folio="11" />
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* CERTIFICATE SHOWCASE */}
          <div className="relative rounded-xl overflow-hidden ring-1 ring-amber-500/30 flex-1 min-h-0">
            <img src={certificateImg} alt="Certificación internacional" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950/10" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 blur-[80px] rounded-full" />
            </div>
            <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-7 max-w-[62%]">
              <p className="font-mono text-[11px] text-amber-300 tracking-[0.35em] uppercase mb-2">// Reconocimiento Internacional</p>
              <p className="font-futuristic text-[32px] font-black text-white leading-[1.05] drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">Una certificación<br/>que abre puertas <span className="text-amber-300">globales.</span></p>
              <div className="mt-4 inline-flex items-center gap-2 self-start bg-amber-500/15 ring-1 ring-amber-500/40 rounded-full px-3 py-1.5">
                <Award className="h-3.5 w-3.5 text-amber-300" />
                <span className="font-mono text-[10px] text-amber-200 tracking-[0.25em] uppercase">Certificado Oficial</span>
              </div>
            </div>
            {/* Floating certificate preview */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[44%] aspect-[1.35/1] rounded-lg overflow-hidden ring-2 ring-amber-400/50 shadow-[0_20px_60px_-10px_rgba(251,191,36,0.4)] rotate-2 hover:rotate-0 transition-transform">
              <img src={certificateImg} alt="Vista previa del certificado" className="w-full h-full object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
            </div>
          </div>

          <TechCard glowColor="amber">
            <div className="flex items-start gap-4">
              <IconBadge icon={Award} color="amber" />
              <div>
                <p className="text-[13px] font-semibold text-amber-400 tracking-[0.4em] uppercase mb-2">Certificación</p>
                <p className="text-[17px] text-slate-100 leading-snug">
                  Certificación Internacional de Aprobación del Programa <span className="text-amber-400 font-semibold">Tecnologías Convergentes para la Economía Digital y Espacial</span>, otorgada a quienes cumplan con los requisitos de aprobación.
                </p>
              </div>
            </div>
          </TechCard>

          <TechCard glowColor="teal">
            <div className="flex items-start gap-4">
              <IconBadge icon={Clock} color="teal" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-teal-400 tracking-[0.4em] uppercase mb-3">Período Sugerido</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { v: "40", l: "Horas totales" },
                    { v: "24", l: "Sincrónicas" },
                    { v: "16", l: "Asincrónicas" },
                  ].map((x) => (
                    <div key={x.l} className="text-center bg-slate-900/40 rounded-lg py-3 ring-1 ring-teal-500/20">
                      <div className="font-futuristic text-[42px] font-black text-white tabular-nums leading-none">{x.v}</div>
                      <div className="text-[10px] text-teal-300 uppercase tracking-[0.25em] mt-2">{x.l}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[13px] text-slate-400 mt-3 italic">El período podrá ajustarse según los requerimientos de la institución participante.</p>
              </div>
            </div>
          </TechCard>
        </div>
      </PageShell>
    </BookPage>,


    /* ===== DIVIDER IV ===== */
    <BookPage key="divider-4">
      <DividerPage
        image={dividerOrbit}
        chapter="Capítulo IV"
        title={`Una nueva\nórbita comienza.`}
        subtitle="El paso final para activar tu participación y abrir las puertas al ecosistema internacional de innovación y economía espacial."
        accent="emerald"
      />
    </BookPage>,

    /* ===== PRECIO ===== */
    <BookPage key="precio">
      <PageShell accent="emerald" folio="13">
        <SectionHeader kicker="11 · 12" title="Inversión" accent="emerald" folio="13" />
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Price Hero */}
          <div className="grid grid-cols-5 gap-3 flex-shrink-0">
            <TechCard glowColor="emerald" className="col-span-2 flex flex-col justify-center relative overflow-hidden !p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.18),transparent_65%)] pointer-events-none" />
              <div className="absolute top-2 right-3 font-mono text-[9px] text-emerald-400/60 tracking-[0.3em]">USD · 2026</div>
              <div className="relative text-center">
                <p className="text-[9px] font-semibold text-emerald-400 tracking-[0.4em] uppercase mb-1">Arancel · Participante</p>
                <div className="flex items-start justify-center gap-1.5">
                  <span className="font-futuristic text-[22px] font-black text-emerald-300/80 leading-none tabular-nums mt-2">US$</span>
                  <span className="font-futuristic text-[64px] font-black text-white leading-[0.85] tabular-nums tracking-tight">2.000</span>
                </div>
                <div className="h-px w-16 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent mx-auto my-2" />
                <p className="text-[10px] font-mono text-emerald-400/70 tracking-[0.25em] uppercase">por participante</p>
              </div>
            </TechCard>
            <TechCard glowColor="teal" className="col-span-3 flex flex-col !p-4">
              <div className="flex items-center gap-2 mb-2">
                <IconBadge icon={CheckCircle} color="teal" />
                <p className="text-[11px] font-semibold text-teal-400 tracking-[0.35em] uppercase">El arancel incluye</p>
              </div>
              <ul className="text-[12px] text-slate-100 grid grid-cols-1 gap-1 flex-1">
                {[
                  "Todas las actividades académicas",
                  "Acceso al material digital",
                  "Foros y actividades complementarias",
                  "Evaluación del caso práctico",
                  "Certificación internacional",
                ].map((x, i) => (
                  <li key={x} className="flex items-center gap-2 bg-slate-900/30 rounded-md px-2.5 py-1.5 ring-1 ring-teal-500/10">
                    <span className="font-mono text-teal-400 text-[9px] tabular-nums">0{i + 1}</span>
                    <CheckCircle className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                    <span className="leading-tight">{x}</span>
                  </li>
                ))}
              </ul>
            </TechCard>
          </div>

          {/* Commercial Conditions */}
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <TechCard glowColor="cyan" className="flex flex-col relative overflow-hidden !p-4">
              <div className="absolute top-3 right-3 font-mono text-[9px] text-cyan-400/50 tracking-[0.3em]">§ 01</div>
              <div className="flex items-center gap-2 mb-3">
                <IconBadge icon={FileCheck} color="cyan" />
                <p className="text-[11px] font-semibold text-cyan-400 tracking-[0.35em] uppercase">Alcance & Formalización</p>
              </div>
              <div className="flex-1 flex flex-col gap-2 relative min-h-0">
                <div className="absolute left-[16px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/40 via-cyan-400/20 to-transparent" />
                {[
                  { n: "A", label: "Confirmación", desc: "La institución remite el listado definitivo de participantes." },
                  { n: "B", label: "Acuerdo", desc: "Se firma un acuerdo de prestación de servicios con alcance curricular." },
                  { n: "C", label: "Inicio", desc: "Programa activado tras la transferencia confirmada." },
                ].map((item) => (
                  <div key={item.n} className="relative flex items-center gap-3 bg-slate-900/40 rounded-lg p-2.5 ring-1 ring-cyan-500/15 flex-1 min-h-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center ring-1 ring-cyan-500/40 shrink-0 z-10">
                      <span className="font-futuristic text-xs font-black text-cyan-300">{item.n}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white leading-tight">{item.label}</p>
                      <p className="text-[10.5px] text-slate-400 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TechCard>

            <TechCard glowColor="amber" className="flex flex-col relative overflow-hidden !p-4">
              <div className="absolute top-3 right-3 font-mono text-[9px] text-amber-400/50 tracking-[0.3em]">§ 02</div>
              <div className="flex items-center gap-2 mb-3">
                <IconBadge icon={Wallet} color="amber" />
                <p className="text-[11px] font-semibold text-amber-400 tracking-[0.35em] uppercase">Estructura de Pago</p>
              </div>
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="flex-1 bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/40 rounded-xl p-4 ring-1 ring-amber-500/30 flex flex-col items-center justify-center text-center">
                  <p className="font-mono text-[9px] text-amber-400 tracking-[0.3em] uppercase mb-1.5">Pago Único de Inscripción</p>
                  <p className="font-futuristic text-[36px] font-black text-white leading-none">US$ 2.000</p>
                  <div className="h-px w-14 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent my-2" />
                  <p className="text-[11px] text-slate-300 leading-snug">Un solo pago cubre la matrícula completa del participante.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "Moneda", v: "USD" },
                    { k: "Modalidad", v: "Transferencia" },
                    { k: "Vigencia", v: "2026" },
                  ].map((m) => (
                    <div key={m.k} className="bg-slate-950/60 rounded-lg p-2 ring-1 ring-amber-500/20 text-center">
                      <p className="font-mono text-[8px] text-amber-400/70 tracking-[0.2em] uppercase mb-0.5">{m.k}</p>
                      <p className="text-[11px] font-semibold text-white">{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TechCard>
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== INFO ADICIONAL + CONSULTAS ===== */
    <BookPage key="contacto">
      <PageShell accent="purple" folio="14">
        <SectionHeader kicker="13 · 14" title="Información & Consultas" accent="purple" folio="14" />
        <div className="flex-1 flex flex-col gap-4">
          <TechCard glowColor="purple">
            <div className="flex items-start gap-4">
              <IconBadge icon={Network} color="purple" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-purple-400 tracking-[0.4em] uppercase mb-3">Información Adicional</p>
                <ul className="text-[17px] text-slate-100 space-y-2 leading-snug">
                  {[
                    "Programa adaptable a sectores específicos: industria, minería, defensa, telecomunicaciones, educación, gobierno, energía, logística o sector espacial.",
                    "Posibilidad de desarrollar proyectos institucionales derivados del programa.",
                    "Acceso a red de colaboración internacional en innovación tecnológica y economía espacial.",
                    "Entrega de material digital de apoyo y bibliografía especializada.",
                  ].map((x, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="font-mono text-purple-400 text-xs tabular-nums pt-1.5">0{i + 1}</span>
                      <span className="flex-1">{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TechCard>

          <div className="flex items-center gap-4">
            <span className="font-futuristic text-purple-400 text-[44px] font-black leading-none">14</span>
            <div>
              <p className="text-[13px] font-semibold text-purple-400 tracking-[0.4em] uppercase">Consultas Directas</p>
              <p className="text-sm text-slate-400 italic">Estamos disponibles para resolver dudas y coordinar la propuesta.</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
          </div>

          <TechCard glowColor="cyan" className="w-full">
            <div className="flex items-center justify-center gap-4">
              <IconBadge icon={Mail} color="cyan" />
              <div className="text-center">
                <p className="text-[11px] font-semibold text-cyan-400 tracking-[0.4em] uppercase mb-1">Consultas</p>
                <p className="text-[18px] font-bold text-white">info@startupfactoryhub.com</p>
              </div>
            </div>
          </TechCard>

          {/* ===== ¿POR QUÉ PATROCINAR ESTO? ===== */}
          <TechCard glowColor="amber" className="relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/8 blur-[60px] rounded-full" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 blur-lg rounded-full" />
                  <Handshake className="relative h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-amber-400/80 tracking-[0.3em] uppercase">// Retorno de Inversión</p>
                  <p className="font-futuristic text-[22px] font-black text-white leading-none">¿Por qué patrocinar esto?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { i: "01", icon: Globe, title: "Visibilidad Global", desc: "Presencia institucional en red internacional de innovación y economía espacial." },
                  { i: "02", icon: Users, title: "Talento de Alto Nivel", desc: "Acceso directo a profesionales certificados en tecnologías convergentes." },
                  { i: "03", icon: TrendingUp, title: "Posicionamiento Estratégico", desc: "Liderazgo en la transformación digital de Latinoamérica y el sector espacial." },
                  { i: "04", icon: Zap, title: "Innovación Tangible", desc: "Participación activa en proyectos aplicados con retorno tecnológico medible." },
                ].map((item) => (
                  <div key={item.i} className="group relative bg-slate-900/50 rounded-lg p-4 ring-1 ring-amber-500/15 hover:ring-amber-500/40 transition-all duration-300 hover:bg-slate-900/70">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-transparent opacity-60" />
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/25">
                          <item.icon className="h-4 w-4 text-amber-400" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[9px] text-amber-500/60 tabular-nums">{item.i}</span>
                          <span className="font-futuristic text-[14px] font-bold text-white leading-tight">{item.title}</span>
                        </div>
                        <p className="text-[13px] text-slate-400 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-teal-500/10 rounded-lg px-5 py-4 ring-1 ring-amber-500/20">
                <div className="flex items-center gap-3">
                  <Diamond className="h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">ROI = Impacto × Alcance × Tiempo</p>
                    <p className="text-[11px] text-slate-400">Una inversión con retorno exponencial en reputación y posicionamiento.</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-futuristic text-[26px] font-black text-amber-300 leading-none">∞</p>
                  <p className="font-mono text-[9px] text-amber-400/70 tracking-[0.25em] uppercase mt-1">Potencial</p>
                </div>
              </div>
            </div>
          </TechCard>

          <div className="flex-1 flex flex-col items-center justify-end pt-4">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-purple-500/30 blur-[60px] rounded-full" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[220px] opacity-95" />
            </div>
            <p className="font-futuristic text-[15px] font-black text-white tracking-[0.35em] uppercase">Academia Spacely</p>
            <p className="font-mono text-[11px] text-purple-400/80 tracking-[0.45em] mt-1">// PROGRAMA INTERNACIONAL · 2026 //</p>
          </div>
        </div>
      </PageShell>
    </BookPage>,

    /* ===== PARTNERS & COLABORADORES ===== */
    <BookPage key="partners">
      <PageShell accent="cyan" folio="15">
        <SectionHeader kicker="14 · 15" title="Partners & Colaboradores" accent="cyan" folio="15" />
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <TechCard glowColor="cyan" className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <IconBadge icon={Handshake} color="cyan" />
              <p className="text-[12px] font-semibold text-cyan-400 tracking-[0.4em] uppercase">Red de Aliados Estratégicos</p>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4 content-center">
              {[
                { src: "/partners/nasa-logo.png", name: "NASA" },
                { src: "/partners/nvidia-inception-logo.png", name: "NVIDIA Inception" },
                { src: "/partners/hsbc-logo.png", name: "HSBC" },
                { src: "/partners/f6s-logo.png", name: "F6S" },
                { src: "/partners/nouel-logo.png", name: "Nouel" },
                { src: "/partners/iwg-logo.png", name: "IWG" },
                { src: "/partners/regus-logo.png", name: "Regus" },
                { src: "/partners/ducere-logo.png", name: "Ducere" },
                { src: "/partners/liveplan-logo.png", name: "LivePlan" },
                { src: "/partners/lotnetwork-logo.png", name: "LOT Network" },
                { src: "/partners/flippa-logo.png", name: "Flippa" },
                { src: "/partners/tradingview-logo.png", name: "TradingView" },
                { src: "/partners/hackerearth-logo.png", name: "HackerEarth" },
                { src: "/partners/advantary-logo.jpg", name: "Advantary" },
                { src: "/partners/decahedron-ventures-logo.jpg", name: "Decahedron Ventures" },
                { src: "/partners/flusso-capital-logo.png", name: "Flusso Capital" },
                { src: "/partners/incostas-logo.png", name: "Incostas" },
                { src: "/partners/orlandopreneur-logo.png", name: "Orlandopreneur" },
                { src: "/partners/pitchperfecter-logo.png", name: "PitchPerfecter" },
                { src: "/partners/uk-venture-logo.jpg", name: "UK Venture" },
              ].map((p) => (
                <div key={p.name} className="group flex flex-col items-center justify-center bg-slate-900/50 rounded-lg p-4 ring-1 ring-cyan-500/10 hover:ring-cyan-500/40 transition-all duration-300 hover:bg-slate-900/70">
                  <img src={p.src} alt={p.name} className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0" loading="lazy" />
                  <p className="text-[10px] text-slate-400 mt-2 text-center tracking-wide">{p.name}</p>
                </div>
              ))}
            </div>
          </TechCard>

          <div className="flex-1 flex flex-col items-center justify-end pt-4">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-cyan-500/30 blur-[60px] rounded-full" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[180px] opacity-95" />
            </div>
            <p className="font-futuristic text-[15px] font-black text-white tracking-[0.35em] uppercase">Startup Factory Hub</p>
            <p className="font-mono text-[11px] text-cyan-400/80 tracking-[0.45em] mt-1">// PROGRAMA INTERNACIONAL · 2026 //</p>
          </div>
        </div>
      </PageShell>
    </BookPage>,
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-slate-900/70 border-0 ring-1 ring-teal-500/30 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={flipPrev} className="h-8 w-8 text-teal-400 hover:bg-teal-500/10" disabled={!flipbookSupported}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-sm sm:text-base text-teal-400 font-medium tracking-wide tabular-nums">
              {flipbookSupported
                ? `${String(currentPage + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`
                : `${String(totalPages).padStart(2, '0')} páginas`}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={flipNext} className="h-8 w-8 text-teal-400 hover:bg-teal-500/10" disabled={!flipbookSupported}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-[88px]" />
      </div>

      <div
        className="pt-20 pb-12 min-h-screen flex items-center justify-center px-2 sm:px-6"
        style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.06) 0%, rgba(2,6,23,1) 65%)' }}
      >
        {flipbookSupported ? (
          <HTMLFlipBook
            ref={bookRef}
            width={842}
            height={1280}
            size="stretch"
            minWidth={300}
            maxWidth={1000}
            minHeight={420}
            maxHeight={1400}
            showCover={true}
            maxShadowOpacity={0.5}
            mobileScrollSupport={true}
            onFlip={(e: any) => setCurrentPage(e.data)}
            className="brochure-book"
            style={{}}
            startPage={0}
            drawShadow={true}
            flippingTime={700}
            usePortrait={true}
            startZIndex={0}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            {pagesArr}
          </HTMLFlipBook>
        ) : (
          <div className="w-full max-w-3xl space-y-6">{pagesArr}</div>
        )}
      </div>
    </div>
  );
}
