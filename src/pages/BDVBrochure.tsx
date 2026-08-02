import React, { useState, useRef, useEffect, useCallback, forwardRef, Children } from 'react';
import {
  Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail,
  Network, BarChart3, GraduationCap, Building2, Cpu, DollarSign,
  Handshake, MapPin, Brain, Briefcase, ShieldCheck, Sparkles,
  Globe2, Scan, Box, Eye, Smartphone, Zap, Orbit, ArrowUpRight,
  ChevronLeft, ChevronRight, CircuitBoard, Radio, Check,
  Play, Pause, Volume2, VolumeX, CircleDollarSign,
} from 'lucide-react';
import luminousAudio from '@/assets/luminous-meridian.mp3.asset.json';
import { motion } from 'framer-motion';
import "@google/model-viewer";
const NASA_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";
const ROVER_GLB = `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`;
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';
import coworkingSpace from '@/assets/coworking-space.jpg';
import dashboardMockup from '@/assets/mockup-dashboard.png';
import visionHub from '@/assets/wtc-vision-hub-future.jpg.asset.json';
import kpiCities from '@/assets/wtc-kpi-cities.jpg';
import kpiNetwork from '@/assets/wtc-kpi-network.jpg';
import kpiCapital from '@/assets/wtc-kpi-capital.jpg';
import oppGrowth from '@/assets/wtc-opp-growth.jpg';
import oppPopulation from '@/assets/wtc-opp-population.jpg';
import oppVisitors from '@/assets/wtc-opp-visitors.jpg';
import oppGap from '@/assets/wtc-opp-gap.jpg';
import platformMobile from '@/assets/wtc-platform-mobile.jpg';
import arRover from '@/assets/wtc-ar-rover.jpg';
import wtcInstitutional from '@/assets/wtc-institutional.jpg';
import moonBackground from '@/assets/moon-background.jpg.asset.json';
import nasaLogo from '@/assets/nasa-logo.png';
import nasaTechTransfer from '@/assets/nasa-tech-transfer.webp';
import nvidiaLogo from '@/assets/NVIDIA.jpeg';
import githubLogo from '@/assets/github-logo.png';

/* =========================================================================
   NEON COLOR TOKENS — used throughout via inline style for max fidelity
   ========================================================================= */
// Light/glass palette — soft, elegant, next-gen. Accents stay luminous but desaturated for light surfaces.
const NEON = {
  cyan: '#0ea5b7',             // teal-cyan, readable on white
  cyanSoft: 'rgba(14,165,183,0.45)',
  magenta: '#1f2a44',          // soft electric blue
  magentaSoft: 'rgba(31,42,68,0.4)',
  lime: '#10b981',             // emerald
  emerald: '#059669',
  amber: '#0d9488',            // teal
  ink: '#0f172a',              // slate-900 for text
  inkSoft: 'rgba(15,23,42,0.65)',
};

// Platinum / carbon-fiber title treatment: replaces flat black headings with a dark metallic weave + light sheen.
const DEEP_LIME = '#3f6212';
const PLATINUM_TITLE: React.CSSProperties = {
  backgroundImage: `
    repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
    linear-gradient(180deg, #9ca3af 0%, #4b5563 25%, #1f2937 50%, #374151 75%, #9ca3af 100%)
  `,
  backgroundBlendMode: 'overlay, overlay, normal',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
};

/* =========================================================================
   MATRIX RAIN BACKDROP — characters falling, dual-tone
   ========================================================================= */
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixLayer = (_: { density?: number; columns?: number; tone?: 'cyan' | 'magenta' | 'mix' }) => null;

/* =========================================================================
   HUD GRID + SCANLINES
   ========================================================================= */
const HudGrid = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: `
      linear-gradient(${NEON.cyan}11 1px, transparent 1px),
      linear-gradient(90deg, ${NEON.cyan}11 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
  }} />
);

const Scanlines = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(15,23,42,0.012) 3px, rgba(15,23,42,0.012) 4px)',
  }} />
);

const NeonEmeraldFrame = ({ inset = 16, radius = '28px' }: { inset?: number; radius?: string }) => (
  <div className="absolute pointer-events-none z-[5]" style={{
    inset,
    borderRadius: radius,
    border: `1px solid rgba(255,255,255,0.7)`,
    boxShadow: `0 0 0 1px rgba(15,23,42,0.05), 0 30px 80px -30px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.9)`,
  }} />
);

/* =========================================================================
   GLASS CARD — glassmorphism with neon gradient border + corner accents
   ========================================================================= */
const GlassCard = ({
  children, className = '', accent = NEON.cyan, glow = true, padding = 'p-6',
}: { children: React.ReactNode; className?: string; accent?: string; glow?: boolean; padding?: string }) => (
  <div className={`relative rounded-2xl ${padding} ${className}`} style={{
    background: `linear-gradient(140deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.45) 100%)`,
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    border: `1px solid rgba(255,255,255,0.8)`,
    boxShadow: glow ? `0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 60px -25px rgba(15,23,42,0.18), 0 0 0 1px ${accent}15` : undefined,
  }}>
    {/* animated gradient border via top scanline */}
    <span className="absolute top-0 left-6 right-6 h-px pointer-events-none" style={{
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
    }} />
    {/* tiny neon dot in corner */}
    <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full pointer-events-none" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
    {children}
  </div>
);

/* =========================================================================
   NEON BADGE — icon with glow ring
   ========================================================================= */
const NeonBadge = ({ icon: Icon, color = NEON.cyan, size = 'md' }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className={`${dims} rounded-xl flex items-center justify-center shrink-0`} style={{
      background: `linear-gradient(135deg, ${color}30, ${color}05)`,
      border: `1px solid ${color}60`,
      boxShadow: `0 0 18px ${color}40, inset 0 0 12px ${color}20`,
    }}>
      <Icon className={iconSize} style={{ color }} />
    </div>
  );
};

/* =========================================================================
   PAGE FRAME — wraps every page with hud chrome
   ========================================================================= */
const PageFrame = ({
  children, accent = NEON.cyan, code = '', label = '', pageNum,
}: { children: React.ReactNode; accent?: string; code?: string; label?: string; pageNum: number }) => (
  <section className="absolute inset-0 overflow-hidden" style={{
    background: `radial-gradient(ellipse at 20% 0%, ${accent}1f 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${NEON.magenta}1a 0%, transparent 55%), linear-gradient(180deg, #fbfcfe 0%, #eef2f8 100%)`,
  }}>
    <MatrixLayer density={0.10} columns={28} tone="cyan" />
    <HudGrid />
    <Scanlines />
    <NeonEmeraldFrame />

    {/* top hud bar */}
    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-none z-20">
      <div className="flex items-center gap-2" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span>SEC // {code}</span>
      </div>
      <div className="text-slate-500">{label}</div>
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, '0')} · 14</div>
    </div>

    {/* bottom hud bar */}
    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] uppercase pointer-events-none z-20">
      <span className="text-slate-900/35">// BDV × SFH · HUB DE INNOVACIÓN DIGITAL</span>
      <span className="text-slate-900/35">10°30′N · 66°55′O</span>
    </div>

    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full h-full flex flex-col"
        style={{ padding: '70px 50px 60px 50px' }}
      >
        {children}
      </motion.div>
    </div>
  </section>
);

/* =========================================================================
   LAVA CAPABILITY MATRIX — interactive merging slime blobs
   ========================================================================= */
const LavaCapabilityMatrix = ({ accent }: { accent: string }) => {
  const CAPS = [
    { i: Building2, l: 'Sede Corporativa', tag: 'BDV·01' },
    { i: Globe2, l: 'Red Global', tag: 'BDV·02' },
    { i: Handshake, l: 'Canales Comerciales', tag: 'BDV·03' },
    { i: ShieldCheck, l: 'Relaciones Gubernamentales', tag: 'BDV·04' },
    { i: Award, l: 'Autoridad de Marca', tag: 'BDV·05' },
    { i: Users, l: 'Miembros Corporativos', tag: 'BDV·06' },
    { i: MapPin, l: 'Delegaciones Intl.', tag: 'BDV·07' },
    { i: Briefcase, l: 'Espacios Ejecutivos', tag: 'BDV·08' },
    { i: Rocket, l: 'Aceleradora', tag: 'SFH·01' },
    { i: Brain, l: 'Plataforma AI', tag: 'SFH·02' },
    { i: GraduationCap, l: 'Red de Mentores', tag: 'SFH·03' },
    { i: DollarSign, l: 'Operaciones de Inversión', tag: 'SFH·04' },
    { i: Lightbulb, l: 'Innovación Corporativa', tag: 'SFH·05' },
    { i: BarChart3, l: 'Programas Ejecutivos', tag: 'SFH·06' },
    { i: Cpu, l: 'Infraestructura Digital', tag: 'SFH·07' },
    { i: TrendingUp, l: 'Motor de Crecimiento', tag: 'SFH·08' },
  ];
  const BLOBS = [
    { x: [14, 28, 18, 12], y: [20, 30, 48, 24], s: [1, 1.12, 0.95, 1.05], d: 14 },
    { x: [34, 24, 38, 32], y: [14, 28, 20, 16], s: [1.05, 0.92, 1.1, 1], d: 16 },
    { x: [55, 64, 50, 58], y: [18, 26, 32, 20], s: [0.95, 1.1, 1, 1.05], d: 13 },
    { x: [78, 70, 84, 80], y: [22, 30, 20, 24], s: [1.1, 1, 0.95, 1.08], d: 15 },
    { x: [20, 32, 24, 16], y: [44, 38, 52, 46], s: [1, 1.08, 0.94, 1.02], d: 17 },
    { x: [42, 50, 38, 44], y: [42, 48, 42, 40], s: [1.05, 0.95, 1.1, 1], d: 14 },
    { x: [62, 56, 68, 60], y: [44, 50, 40, 46], s: [0.95, 1.08, 1, 1.04], d: 18 },
    { x: [82, 76, 86, 84], y: [46, 42, 52, 44], s: [1.08, 1, 0.95, 1.06], d: 13 },
    { x: [16, 24, 18, 12], y: [66, 72, 62, 68], s: [1, 1.1, 0.95, 1.05], d: 16 },
    { x: [34, 42, 30, 36], y: [68, 64, 74, 66], s: [1.08, 0.95, 1.1, 1], d: 15 },
    { x: [50, 58, 46, 52], y: [66, 72, 68, 62], s: [0.95, 1.1, 1, 1.05], d: 17 },
    { x: [70, 64, 74, 72], y: [68, 64, 74, 66], s: [1.1, 1, 0.94, 1.06], d: 14 },
    { x: [86, 80, 88, 84], y: [66, 72, 64, 68], s: [1, 1.08, 0.95, 1.04], d: 19 },
    { x: [28, 36, 24, 30], y: [86, 84, 90, 86], s: [1.05, 0.95, 1.1, 1], d: 13 },
    { x: [52, 60, 48, 54], y: [88, 84, 90, 86], s: [0.95, 1.08, 1, 1.06], d: 16 },
    { x: [76, 70, 80, 78], y: [86, 90, 84, 88], s: [1.08, 1, 0.95, 1.04], d: 15 },
  ];
  // Softer, more matte palette — desaturated jewel tones (less neon)
  const SLIME = ['#4b8a7a', '#3b7a8c', '#7a5a96', '#a36584', '#7a8a52', '#5a8a6b'];

  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 rounded-3xl overflow-hidden"
      style={{
        // Lighter, matte slate background — no neon glow
        background:
          'radial-gradient(ellipse at 35% 25%, #e8ecf2 0%, #d4dae3 45%, #b9c2cf 100%)',
        border: `1px solid rgba(80,100,120,0.18)`,
        boxShadow: 'inset 0 0 60px rgba(60,75,95,0.18)',
      }}
    >
      {/* SVG goo filter */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id="lavaGoo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Slime layer — multiply blend for matte fusion against the light background */}
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#lavaGoo)', mixBlendMode: 'multiply' }}
      >
        {BLOBS.map((b, idx) => (
          <motion.div
            key={`blob-${idx}`}
            className="absolute rounded-full"
            style={{
              width: 130,
              height: 130,
              left: `${b.x[0]}%`,
              top: `${b.y[0]}%`,
              marginLeft: -65,
              marginTop: -65,
              background: `radial-gradient(circle at 35% 30%, ${SLIME[idx % SLIME.length]} 0%, ${SLIME[(idx + 2) % SLIME.length]} 60%, ${SLIME[(idx + 4) % SLIME.length]}00 100%)`,
              opacity: 0.88,
            }}
            animate={{
              left: b.x.map((v) => `${v}%`),
              top: b.y.map((v) => `${v}%`),
              scale: b.s,
            }}
            transition={{
              duration: b.d,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>


      {/* Labels — centered on each blob via transform offset (keeps goo blobs visible underneath) */}
      <div className="absolute inset-0">
        {CAPS.map((cap, idx) => {
          const b = BLOBS[idx];
          const Icon = cap.i;
          return (
            <motion.div
              key={`cap-${idx}`}
              className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
              style={{ left: `${b.x[0]}%`, top: `${b.y[0]}%`, width: 100, lineHeight: 1 }}
              initial={{ opacity: 0, scale: 0.6, x: '-50%', y: '-50%' }}
              animate={{
                left: b.x.map((v) => `${v}%`),
                top: b.y.map((v) => `${v}%`),
                opacity: 1,
                scale: 1,
                x: '-50%',
                y: '-50%',
              }}
              transition={{
                left: { duration: b.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                top: { duration: b.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                opacity: { duration: 0.6, delay: idx * 0.04 },
                scale: { duration: 0.6, delay: idx * 0.04 },
                x: { duration: 0 },
                y: { duration: 0 },
              }}
            >
              <Icon
                className="h-4 w-4 mb-1"
                style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))' }}
              />
              <div
                className="font-futuristic font-black text-[10.5px] uppercase tracking-[0.12em] leading-[1.05]"
                style={{
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.55), 0 0 6px rgba(0,0,0,0.35)',
                }}
              >
                {cap.l}
              </div>
              <div
                className="font-mono text-[8px] tracking-[0.3em] mt-1"
                style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {cap.tag}
              </div>
            </motion.div>
          );
        })}
      </div>


      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(40,55,75,0.22) 100%)',
        }}
      />

      {/* HUD */}
      <div
        className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.3em]"
        style={{ color: '#3a5066' }}
      >
        ● LAVA · SÍNTESIS EN VIVO
      </div>
      <div
        className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.3em] text-right"
        style={{ color: '#3a5066' }}
      >
        16 / 16 CAPACIDADES
        <br />
        <span style={{ color: accent, opacity: 0.85 }}>FUSIONADAS · UNA PLATAFORMA</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: '#56697f' }}>
        <span>BDV × SFH · NÚCLEO DE FUSIÓN</span>
        <span>ESTADO: FLUIDO · MUEVE EL CURSOR</span>
      </div>
    </div>
  );
};


/* =========================================================================
   DEMO CREDENTIAL GRID — copyable role cards for the Digital Platform page
   ========================================================================= */
const DEMO_CREDS = [
  { role: 'Startup',  email: 'demo-startup@startupfactoryhub.com', color: '#0ea5b7' },
  { role: 'Inversionista', email: 'demo-investor@startupfactoryhub.com', color: '#3b82f6' },
  { role: 'Mentor',   email: 'demo-mentor@startupfactoryhub.com', color: '#8b5cf6' },
  { role: 'Asesor',  email: 'demo-advisor@startupfactoryhub.com', color: '#10b981' },
  { role: 'Estudiante',  email: 'demo-student@startupfactoryhub.com', color: '#f59e0b' },
  { role: 'Miembro',   email: 'demo-member@startupfactoryhub.com', color: '#ec4899' },
];
const COMMON_PASSWORD = 'Demo123!';

const DemoCredentialGrid = ({ onSelect, activeRole }: { onSelect?: (role: string) => void; activeRole?: string }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {DEMO_CREDS.map((c) => {
        const isActive = activeRole === c.role.toLowerCase();
        return (
        <button
          type="button"
          key={c.role}
          onClick={() => onSelect?.(c.role.toLowerCase())}
          className="relative rounded-xl p-4 flex flex-col gap-2 group text-left cursor-pointer transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)',
            border: `1px solid ${c.color}${isActive ? 'cc' : '45'}`,
            boxShadow: isActive
              ? `0 10px 30px -8px rgba(15,23,42,0.18), 0 0 0 2px ${c.color}aa inset, 0 0 36px ${c.color}55`
              : `0 8px 24px -8px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 0 20px ${c.color}18`,
          }}
          title={`Iniciar sesión como ${c.role}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-futuristic font-black text-xs uppercase tracking-[0.08em] truncate" style={{ color: c.color }}>{c.role}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap" style={{ background: `${c.color}20`, color: c.color }}>
              {isActive ? 'ACTIVA' : 'INICIAR'}
            </span>
          </div>
          <span
            onClick={(e) => copy(c.email, `${c.role}-email`, e)}
            className="text-left font-mono text-xs text-slate-800 truncate transition-all hover:opacity-80"
            title="Clic para copiar el correo"
          >
            {c.email}
          </span>
          <span
            onClick={(e) => copy(COMMON_PASSWORD, `${c.role}-pass`, e)}
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all hover:brightness-110"
            style={{ background: c.color, color: '#ffffff' }}
            title="Clic para copiar la contraseña"
          >
            <span>CLAVE:</span>
            <span>{COMMON_PASSWORD}</span>
            {copied === `${c.role}-pass` ? <Check className="h-3 w-3" /> : null}
          </span>

          <span
            onClick={(e) => copy(`${c.email}\n${COMMON_PASSWORD}`, `${c.role}-all`, e)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copiar correo + contraseña"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}18`, border: `1px solid ${c.color}40` }}>
              {copied === `${c.role}-all` ? (
                <Check className="h-3.5 w-3.5" style={{ color: c.color }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              )}
            </div>
          </span>

          {copied && (copied === `${c.role}-email` || copied === `${c.role}-pass` || copied === `${c.role}-all`) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 right-3 font-mono text-[9px] uppercase tracking-wider"
              style={{ color: c.color }}
            >
              Copiado
            </motion.div>
          )}
        </button>
      );})}
    </div>
  );
};


/* =========================================================================
   SECTION TITLE — big and bold
   ========================================================================= */
/* =========================================================================
   DIGITAL PLATFORM SLIDE — role picker + live emulator
   ========================================================================= */
const DigitalPlatformDemo = () => {
  const [role, setRole] = useState<string>('startup');
  const src = `/auth?demo=${role}&redirect=${encodeURIComponent('/dashboard?tab=social')}`;
  return (
    <>
      <div className="mb-4 rounded-2xl overflow-hidden relative" style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(241,245,249,0.55) 100%)',
        border: `1px solid ${NEON.cyan}55`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.7) inset, 0 25px 60px -20px rgba(15,23,42,0.18), 0 0 30px ${NEON.cyan}22`,
        backdropFilter: 'blur(14px) saturate(130%)',
      }}>
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{
          background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)`,
        }} />
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: `${NEON.cyan}25` }}>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 14px ${NEON.cyan}` }} />
            <span className="font-mono text-sm uppercase tracking-[0.22em] font-bold text-slate-900">Terminal de Acceso Demo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: NEON.cyan }}>● HAZ CLIC EN UN ROL PARA INICIAR SESIÓN</span>
          </div>
        </div>
        <div className="p-5">
          <DemoCredentialGrid activeRole={role} onSelect={setRole} />
        </div>
      </div>

      <GlassCard accent={NEON.cyan} padding="p-0" className="flex-1 overflow-hidden relative">
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] pointer-events-none">
          <span style={{ color: NEON.cyan }}>● EMULADOR EN VIVO · SESIÓN {role.toUpperCase()}</span>
          <span className="text-slate-500">startupfactoryhub.com</span>
        </div>
        <div className="absolute inset-0 pt-8 p-2">
          <iframe
            key={role}
            src={src}
            title={`Startup Factory Hub — live demo (${role})`}
            loading="lazy"
            className="w-full h-full rounded-2xl bg-white"
            style={{ border: `1px solid ${NEON.cyan}40`, boxShadow: `0 0 40px ${NEON.cyan}30` }}
          />
        </div>
      </GlassCard>
    </>
  );
};

const PageTitle = ({ kicker, title, accent = NEON.cyan }: { kicker: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-5">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-futuristic font-black tracking-tight break-words" style={{
      fontSize: '42px',
      lineHeight: 1.08,
      paddingBottom: '6px',
      ...PLATINUM_TITLE,
      textShadow: `0 0 30px ${accent}40`,
    }}>
      {title}
    </h2>
  </div>
);

/* =========================================================================
   FLIPBOOK SUPPORT
   ========================================================================= */
const useFlipbookSupported = () => {
  const [supported, setSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = window.navigator.userAgent;
    const isChromium = /Chrome|Chromium|CriOS/.test(ua) && !/Edg|EdgiOS|OPR|SamsungBrowser/.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);
    return isChromium && !isMobile && window.innerWidth >= 1024;
  });
  useEffect(() => {
    const onResize = () => {
      const ua = window.navigator.userAgent;
      const isChromium = /Chrome|Chromium|CriOS/.test(ua) && !/Edg|EdgiOS|OPR|SamsungBrowser/.test(ua);
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);
      setSupported(isChromium && !isMobile && window.innerWidth >= 1024);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return supported;
};

/* =========================================================================
   A4 WRAPPER
   ========================================================================= */
const BASE_W = 842;
const BASE_H = 1190;
const A4Wrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / BASE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={containerRef} className="w-full" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
      <div style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: '50%',
        marginLeft: -(BASE_W / 2), marginTop: -(BASE_H / 2),
        transform: `scale(${scale})`, transformOrigin: 'center center',
      }}>
        {children}
      </div>
    </div>
  );
};

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="overflow-hidden" style={{ background: 'transparent' }}>{children}</div>
));
BookPage.displayName = "BookPage";

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function BDVBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(14);
  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

  // Background audio (manual play; no autoplay)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const [audioMuted, setAudioMuted] = useState(false);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
      audioRef.current.muted = audioMuted;
    }
  }, [audioVolume, audioMuted]);
  const toggleAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
    } else {
      el.pause();
      setAudioPlaying(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Banco de Venezuela × Startup Factory Hub — Hub de Innovación Digital";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') flipPrev();
      else if (e.key === 'ArrowRight') flipNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipPrev, flipNext]);

  const flipbookSupported = useFlipbookSupported();

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', color: NEON.ink }}>
      {/* Nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3" style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        borderBottom: `1px solid rgba(15,23,42,0.08)`,
      }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-slate-900 hover:bg-slate-900/5" style={{ color: NEON.cyan }}>
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={flipPrev} className="h-8 w-8 hover:bg-slate-900/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
            <span className="text-xs sm:text-sm font-mono tracking-widest tabular-nums" style={{ color: NEON.cyan }}>
              {flipbookSupported
                ? `${String(currentPage + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`
                : `${String(totalPages).padStart(2, '0')} páginas`}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={flipNext} className="h-8 w-8 hover:bg-slate-900/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-[88px]" />
      </div>

      {/* Background audio element (no autoplay) */}
      <audio ref={audioRef} src={luminousAudio.url} loop preload="auto" autoPlay />

      {/* Floating audio control */}
      <div
        className="fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-50 flex items-center gap-1.5 sm:gap-3 rounded-full px-2 py-1.5 sm:px-3 sm:py-2"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          border: `1px solid rgba(15,23,42,0.1)`,
          boxShadow: `0 6px 24px rgba(15,23,42,0.12), 0 0 0 1px ${NEON.cyan}22`,
        }}
      >
        <button
          onClick={toggleAudio}
          aria-label={audioPlaying ? 'Pausar música' : 'Reproducir música'}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-900/5"
          style={{ color: NEON.cyan }}
        >
          {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setAudioMuted((m) => !m)}
          aria-label={audioMuted ? 'Activar sonido' : 'Silenciar'}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-900/5"
          style={{ color: NEON.cyan }}
        >
          {audioMuted || audioVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={audioMuted ? 0 : audioVolume}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            setAudioVolume(v);
            if (v > 0 && audioMuted) setAudioMuted(false);
          }}
          aria-label="Volume"
          className="hidden sm:block sm:w-36 accent-current cursor-pointer"
          style={{ color: NEON.cyan }}
        />
      </div>


      <div
        className="pt-16 sm:pt-20 pb-20 sm:pb-12 min-h-screen flex items-start lg:items-center justify-center px-3 sm:px-6"
        style={{ background: `radial-gradient(ellipse at center, rgba(15,23,42,0.03) 0%, #ffffff 65%)` }}
      >
        {(() => {
          const pages = (
            <>
              {/* ====================================================
                   PAGE 1 — COVER
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff 0%, #f9fafc 100%)` }}>
                    <MatrixLayer density={0.35} columns={42} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 45%, ${NEON.cyan}20 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, ${NEON.magenta}15 0%, transparent 50%)` }} />
                    <Scanlines />
                    <NeonEmeraldFrame inset={20} radius="32px" />

                    {/* orbiting rings */}
                    <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="relative">
                        <div className="absolute -inset-[260px] rounded-full border" style={{ borderColor: `${NEON.cyan}25`, animation: 'slow-spin 40s linear infinite' }} />
                        <div className="absolute -inset-[200px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}30`, animation: 'slow-spin-reverse 60s linear infinite' }} />
                        <div className="absolute -inset-[140px] rounded-full border" style={{ borderColor: `${NEON.magenta}30`, animation: 'slow-spin 30s linear infinite' }} />
                      </div>
                    </div>

                    {/* top hud strip */}
                    <div className="absolute top-8 left-10 right-10 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
                      <span style={{ color: NEON.cyan }}>// CONFIDENCIAL · PROPUESTA DE JOINT VENTURE</span>
                      <span style={{ color: NEON.magenta }}>JUNIO 2026 · CARACAS, VENEZUELA</span>
                    </div>

                    {/* top logo */}
                    <div className="absolute top-20 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
                      <motion.img
                        src={sfhLogo}
                        alt="Startup Factory Hub"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="h-24 w-auto object-contain"
                        style={{ filter: `drop-shadow(0 0 24px ${NEON.cyan}90)` }}
                      />
                    </div>

                    {/* center stack */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-12">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="font-mono text-[11px] tracking-[0.5em] uppercase mb-6"
                        style={{ color: NEON.cyan, textShadow: `0 0 12px ${NEON.cyan}` }}
                      >
                        Banco de Venezuela  ×  Startup Factory Hub
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.15 }}
                        className="font-futuristic font-black leading-[0.88] tracking-tight"
                        style={{
                          fontSize: '92px',
                          ...PLATINUM_TITLE,
                          backgroundImage: `
                            repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                            repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                            linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                          `,
                          textShadow: `0 0 80px ${NEON.cyan}40`,
                        }}
                      >
                        NEXO DE<br />INNOVACIÓN<br />CARACAS
                      </motion.h1>

                      {/* neon underline */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="mt-6 h-[3px] w-[320px] origin-center"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                          boxShadow: `0 0 20px ${NEON.cyan}, 0 0 30px ${NEON.magenta}`,
                        }}
                      />

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed font-light"
                      >
                        Un destino de innovación de nueva generación donde convergen emprendedores, capital, corporaciones y el comercio global.
                      </motion.p>
                    </div>

                    {/* bottom hud */}
                    <div className="absolute bottom-8 left-10 right-10 z-20">
                      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 8px ${NEON.lime}` }} />
                          <span style={{ color: NEON.lime }}>SISTEMA · EN LÍNEA</span>
                        </div>
                        <span style={{ color: NEON.cyan }}>JV · 50 / 50</span>
                        <span style={{ color: NEON.magenta }}>VERSIÓN · v1.0</span>
                      </div>
                    </div>
                  </section>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 2 — STARTUP FACTORY HUB INTRODUCTION (Magazine Style)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{
                    background: '#ffffff',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  }}>
                    {/* Giant background "02" */}
                    <div
                      aria-hidden
                      className="absolute select-none pointer-events-none font-extrabold leading-none tracking-tighter z-0"
                      style={{
                        top: '-8%',
                        left: '-6%',
                        fontSize: '780px',
                        color: 'rgba(15,23,42,0.035)',
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      02
                    </div>

                    {/* Subtle ambient color */}
                    <div className="absolute inset-0 pointer-events-none z-0" style={{
                      background: `radial-gradient(ellipse at 85% 10%, ${NEON.cyan}10 0%, transparent 55%), radial-gradient(ellipse at 10% 95%, ${NEON.lime}0d 0%, transparent 50%)`,
                    }} />

                    {/* Top HUD bar */}
                    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.32em] uppercase z-20">
                      <div className="flex items-center gap-2" style={{ color: NEON.cyan }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                        <span>SEC // 01 · EDICIÓN 01</span>
                      </div>
                      <div className="text-slate-500">INTRODUCCIÓN · STARTUP FACTORY HUB</div>
                      <div style={{ color: NEON.cyan }}>P/02 · 14</div>
                    </div>

                    {/* Bottom HUD bar */}
                    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] uppercase z-20">
                      <span className="text-slate-900/35">// STARTUP FACTORY HUB · ACELERADORA GLOBAL</span>
                      <span className="text-slate-900/35">SEDE · CARACAS · VENEZUELA</span>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: '58px 56px 56px 56px' }}>

                      {/* Header context */}
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-start justify-between mb-8"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-px w-16" style={{ background: NEON.cyan }} />
                          <span className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                            Startup Factory Hub · Vol. 01 · 2026
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className="text-[44px] font-light tracking-tighter italic"
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              color: 'rgba(15,23,42,0.18)',
                              textDecoration: `underline`,
                              textDecorationColor: NEON.lime,
                              textUnderlineOffset: '8px',
                            }}
                          >
                            P/02
                          </span>
                        </div>
                      </motion.div>

                      {/* Hero copy block */}
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="flex-1 grid grid-cols-12 gap-0 min-h-0"
                      >
                        {/* LEFT — dramatic copy column */}
                        <div className="col-span-7 flex flex-col justify-center pr-10 min-w-0">
                          <span className="text-[13px] font-bold tracking-[0.32em] uppercase mb-5" style={{ color: NEON.cyan }}>
                            Acerca de Startup Factory
                          </span>

                          <h1
                            className="font-extrabold tracking-tight text-slate-900 mb-8"
                            style={{
                              fontSize: '46px',
                              lineHeight: '1.04',
                              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                              maxWidth: '100%',
                            }}
                          >
                            El Sistema Operativo<br />
                            para la Próxima{' '}
                            <span
                              className="font-extrabold"
                              style={{
                                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                                background: `linear-gradient(135deg, ${NEON.cyan} 0%, ${NEON.magenta} 55%, ${NEON.lime} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              Generación
                            </span>
                            <br />
                            de Fundadores.
                          </h1>

                          <div className="flex gap-7">
                            <div className="shrink-0 self-stretch">
                              <div
                                className="w-[6px] h-full rounded-full"
                                style={{ background: `linear-gradient(180deg, ${NEON.cyan}, ${NEON.magenta}, ${NEON.lime})` }}
                              />
                            </div>
                            <div className="max-w-[540px] py-1">
                              <p className="text-[19px] leading-[1.55] text-slate-600 font-light mb-6">
                                Startup Factory Hub es la capa de infraestructura para el emprendimiento en la era de la AI — uniendo{' '}
                                <span className="font-semibold text-slate-900">fundadores, inversionistas, mentores, asesores, aceleradoras</span>{' '}
                                y <span className="font-semibold text-slate-900">estudiantes</span> a través de una plataforma integrada de
                                aceleración impulsada por AI, capital estratégico y una red de innovación conectada globalmente.
                              </p>
                              <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                                <p
                                  className="text-slate-900 italic font-medium leading-snug"
                                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}
                                >
                                  "La infraestructura es la nueva propiedad intelectual. Las plataformas que acompañan el recorrido del fundador definirán el futuro de la innovación."
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT — visual + floating stats */}
                        <div className="col-span-5 relative">
                          <div className="h-full w-full relative overflow-hidden" style={{
                            boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)',
                          }}>
                            {/* Background image */}
                            <div
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `url(${visionHub.url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            />
                            {/* Tint overlay */}
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.92) 100%), radial-gradient(ellipse at 70% 20%, ${NEON.cyan}30 0%, transparent 55%)`,
                              }}
                            />

                            {/* Vertical decorative text */}
                            <div className="absolute top-10 right-0" style={{ transform: 'rotate(90deg)', transformOrigin: 'top right' }}>
                              <span className="text-[10px] font-black tracking-[0.5em] text-white/40 uppercase whitespace-nowrap">
                                Primero la Infraestructura
                              </span>
                            </div>

                            {/* Floating stat card */}
                            <div
                              className="absolute inset-x-5 bottom-5 p-6 backdrop-blur-xl border"
                              style={{
                                background: 'rgba(2,6,23,0.88)',
                                borderColor: 'rgba(255,255,255,0.1)',
                              }}
                            >
                              <div className="text-[10px] font-bold tracking-[0.4em] uppercase text-slate-400 mb-4">
                                La Plataforma en Números
                              </div>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                                {[
                                  { v: '$200M+', l: 'Capital Levantado', c: NEON.lime },
                                  { v: '40+', l: 'Startups Aceleradas', c: NEON.cyan },
                                  { v: '350+', l: 'Miembros de la Red', c: NEON.magenta },
                                  { v: '04', l: 'Hubs Globales', c: NEON.amber },
                                ].map((s, i) => (
                                  <div key={i}>
                                    <div className="text-white font-extrabold mb-1.5 whitespace-nowrap" style={{ fontSize: '24px', lineHeight: 1 }}>
                                      {s.v}
                                    </div>
                                    <div className="h-[2px] w-8 mb-2" style={{ background: s.c }} />
                                    <div className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-bold">{s.l}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Footer — partner ticker */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.4 }}
                        className="mt-7 pt-5 border-t relative overflow-hidden"
                        style={{ borderColor: 'rgba(15,23,42,0.08)' }}
                      >
                        <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #ffffff, transparent)' }} />
                        <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #ffffff, transparent)' }} />
                        <div className="flex items-center" style={{ width: 'max-content', animation: 'partners-scroll 60s linear infinite' }}>
                          {(() => {
                            const partners = [
                              { n: 'NASA', l: '/partners/nasa-logo.png' },
                              { n: 'NASA T2', l: '/partners/nasa-t2-logo.webp' },
                              { n: 'NVIDIA Inception', l: '/partners/nvidia-inception-logo.png' },
                              { n: 'Google', l: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png' },
                              { n: 'GitHub', l: '/github-logo.png' },
                              { n: 'Nasdaq', l: '/nasdaq-logo.png' },
                              { n: 'IWG', l: '/partners/iwg-logo.png' },
                              { n: 'HSBC', l: '/partners/hsbc-logo.png' },
                              { n: 'Lehigh University', l: '/lehigh-university-logo.png' },
                              { n: 'MongoDB', l: '/mongodb-logo.webp' },
                              { n: 'F6S', l: '/partners/f6s-logo.png' },
                              { n: 'TradingView', l: '/partners/tradingview-logo.png' },
                              { n: 'Lovable', l: '/partners/lovable-logo.png' },
                              { n: 'Decahedron', l: '/partners/decahedron-ventures-logo.jpg' },
                              { n: 'Flusso Capital', l: '/partners/flusso-capital-logo.png' },
                            ];
                            return [...partners, ...partners].map((p, i) => (
                              <div key={i} className="partner-logo-card flex-shrink-0 px-10 h-18 flex items-center justify-center">
                                <img
                                  src={p.l}
                                  alt={p.n}
                                  className="max-h-16 max-w-[200px] object-contain opacity-80 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                                  onError={(e) => {
                                    const card = e.currentTarget.closest('.partner-logo-card') as HTMLElement | null;
                                    if (card) card.style.display = 'none';
                                  }}
                                />
                              </div>
                            ));
                          })()}
                        </div>
                      </motion.div>
                    </div>
                    <style>{`@keyframes partners-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
                  </section>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 3 — VISION / JOINT VENTURE (cosmopolitan skyline)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="02" label="PROPUESTA" pageNum={3}>
                    <PageTitle kicker="02 · La Oportunidad" title={<>Caracas, la próxima <span style={{ color: NEON.cyan }}>capital de innovación</span> de Latinoamérica.</>} />

                    <div className="flex-1 flex flex-col min-h-0">

                      {/* ---------- MOSAICO BENTO SOBRE FONDO DINÁMICO ---------- */}
                      <div
                        className="relative rounded-2xl overflow-hidden flex-1 min-h-0 border"
                        style={{
                          borderColor: `${NEON.cyan}45`,
                          background: 'linear-gradient(180deg, #060b16 0%, #0b1626 55%, #071018 100%)',
                          boxShadow: `0 18px 50px -18px ${NEON.cyan}55, inset 0 0 0 1px ${NEON.cyan}18`,
                        }}
                      >
                        {/* aurora sky — animated */}
                        <div className="absolute inset-0 bdv-aurora" style={{ background: `radial-gradient(120% 70% at 20% 0%, ${NEON.cyan}30 0%, transparent 60%), radial-gradient(110% 70% at 85% 5%, ${NEON.lime}26 0%, transparent 55%)` }} />
                        {/* drifting grid */}
                        <div className="absolute inset-0 opacity-25 bdv-grid" style={{ backgroundImage: `linear-gradient(${NEON.cyan}55 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan}55 1px, transparent 1px)`, backgroundSize: '46px 46px', maskImage: 'linear-gradient(180deg, transparent 0%, black 45%, transparent 100%)' }} />
                        {/* scanning beam */}
                        <div className="absolute inset-y-0 w-[38%] bdv-scan pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}1f 45%, ${NEON.lime}1a 60%, transparent)` }} />
                        {/* star field */}
                        <div className="absolute inset-0 opacity-60 bdv-stars" style={{ backgroundImage: 'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 38% 9%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 62% 22%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 82% 12%, rgba(255,255,255,0.45), transparent)' }} />

                        {/* CITY SKYLINE — generative towers */}
                        <div className="absolute inset-x-0 bottom-0 h-[150px] flex items-end justify-center gap-[6px] px-6 pointer-events-none opacity-70">
                          {[62, 96, 44, 128, 80, 150, 58, 112, 72, 138, 50, 104, 86, 156, 66, 120, 46, 92, 132, 58, 108, 74, 142, 54, 98, 118, 64, 146, 82, 60].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: h, opacity: 1 }}
                              transition={{ duration: 0.7, delay: 0.05 + i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                              className="relative flex-1 rounded-t-[3px]"
                              style={{
                                background: `linear-gradient(180deg, ${i % 3 === 0 ? NEON.cyan : i % 3 === 1 ? NEON.magenta : NEON.lime}2e 0%, rgba(6,12,22,0.95) 78%)`,
                                borderTop: `2px solid ${i % 3 === 0 ? NEON.cyan : i % 3 === 1 ? NEON.lime : NEON.cyan}`,
                                boxShadow: `0 -8px 26px ${i % 2 === 0 ? NEON.cyan : NEON.lime}22`,
                              }}
                            >
                              <div
                                className="absolute inset-x-[2px] top-[8px] bottom-0 opacity-70"
                                style={{
                                  backgroundImage: `linear-gradient(${NEON.cyan}90 1.5px, transparent 1.5px), linear-gradient(90deg, ${NEON.cyan}70 1.5px, transparent 1.5px)`,
                                  backgroundSize: '7px 11px',
                                  maskImage: 'linear-gradient(180deg, black 0%, transparent 92%)',
                                }}
                              />
                            </motion.div>
                          ))}
                        </div>
                        {/* ground glow + horizon line */}
                        <div className="absolute inset-x-0 bottom-0 h-[70px] pointer-events-none" style={{ background: `linear-gradient(0deg, ${NEON.cyan}30 0%, transparent 100%)` }} />
                        <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)`, boxShadow: `0 0 18px ${NEON.cyan}` }} />

                        {/* ============ CONTENIDO ============ */}
                        <div className="relative z-10 h-full p-3.5 flex flex-col gap-2.5">

                          {/* header */}
                          <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                              <MapPin className="h-4 w-4" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 10px ${NEON.cyan})` }} />
                              <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: NEON.cyan }}>CARACAS · 10.4806° N, 66.9036° O</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: `${NEON.lime}60`, background: `${NEON.lime}12` }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.lime }} />
                              <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: NEON.lime }}>ALIANZA · EN VIVO</span>
                            </div>
                          </div>

                          {/* BENTO GRID */}
                          <div
                            className="flex-1 min-h-0 grid gap-2"
                            style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridTemplateRows: '1.05fr 1.05fr 0.95fr 0.95fr' }}
                          >
                            {/* --- FILA 1 : NODOS --- */}
                            {[
                              { span: 'span 4', code: 'NODO · 01', name: 'BANCO DE VENEZUELA', sub: 'Capital institucional · Red nacional', c: NEON.cyan, d: 0.05 },
                            ].map((n) => (
                              <motion.div
                                key={n.code}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: n.d }}
                                className="bdv-tile relative rounded-xl border px-3.5 py-3 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-center"
                                style={{ gridColumn: n.span, borderColor: `${n.c}70`, background: `linear-gradient(135deg, ${n.c}24, rgba(6,12,22,0.68))`, boxShadow: `inset 0 0 26px ${n.c}20` }}
                              >
                                <div className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: n.c }}>{n.code}</div>
                                <div className="font-futuristic font-black text-[18px] leading-[1.05] tracking-wide mt-1 break-words" style={{ color: '#ffffff', textShadow: `0 0 20px ${n.c}` }}>{n.name}</div>
                                <div className="mt-1 text-[10px] font-semibold leading-tight" style={{ color: '#e2e8f0' }}>{n.sub}</div>
                              </motion.div>
                            ))}

                            {/* operador + */}
                            <div className="rounded-xl border flex items-center justify-center" style={{ gridColumn: 'span 1', borderColor: `${NEON.cyan}55`, background: `${NEON.cyan}14` }}>
                              <span className="font-futuristic font-black text-[26px] leading-none" style={{ color: NEON.cyan, textShadow: `0 0 22px ${NEON.cyan}` }}>+</span>
                            </div>

                            <motion.div
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
                              className="bdv-tile relative rounded-xl border px-3.5 py-3 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-center"
                              style={{ gridColumn: 'span 4', borderColor: `${NEON.magenta}70`, background: `linear-gradient(135deg, ${NEON.magenta}24, rgba(6,12,22,0.68))`, boxShadow: `inset 0 0 26px ${NEON.magenta}20` }}
                            >
                              <div className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: '#f0abfc' }}>NODO · 02</div>
                              <div className="font-futuristic font-black text-[18px] leading-[1.05] tracking-wide mt-1 break-words" style={{ color: '#ffffff', textShadow: `0 0 20px ${NEON.magenta}` }}>STARTUP FACTORY</div>
                              <div className="mt-1 text-[10px] font-semibold leading-tight" style={{ color: '#e2e8f0' }}>Plataforma AI · Mentoría y capital</div>
                            </motion.div>

                            {/* operador = */}
                            <div className="rounded-xl border flex items-center justify-center" style={{ gridColumn: 'span 1', borderColor: `${NEON.lime}55`, background: `${NEON.lime}14` }}>
                              <span className="font-futuristic font-black text-[24px] leading-none" style={{ color: NEON.lime, textShadow: `0 0 22px ${NEON.lime}` }}>=</span>
                            </div>




                            {/* --- FILA 2 : RESULTADO + MANIFIESTO --- */}
                            <motion.div
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
                              className="bdv-tile relative rounded-xl border-2 px-3.5 py-3 backdrop-blur-md min-w-0 overflow-hidden flex flex-col justify-center"
                              style={{ gridColumn: 'span 5', borderColor: `${NEON.lime}85`, background: `linear-gradient(135deg, ${NEON.lime}2a, rgba(6,12,22,0.66))`, boxShadow: `inset 0 0 32px ${NEON.lime}25, 0 0 26px -6px ${NEON.lime}70` }}
                            >
                              <div className="font-mono text-[8px] tracking-[0.35em] uppercase" style={{ color: NEON.lime }}>RESULTADO</div>
                              <div className="font-futuristic font-black text-[19px] leading-[1.05] tracking-wide mt-1 break-words" style={{ color: '#ffffff', textShadow: `0 0 22px ${NEON.lime}` }}>CARACAS · HUB DE INNOVACIÓN</div>
                              <div className="mt-1 text-[10.5px] font-semibold leading-snug" style={{ color: '#f1f5f9' }}>La ciudad cosmopolita que exporta talento y tecnología</div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
                              className="bdv-tile relative rounded-xl border px-4 py-3 backdrop-blur-md min-w-0 overflow-hidden flex items-center"
                              style={{ gridColumn: 'span 7', borderColor: `${NEON.cyan}40`, background: 'rgba(6,12,22,0.62)' }}
                            >
                              <p className="text-[14.5px] leading-[1.3] font-normal tracking-tight" style={{ color: '#f2f7ff', textShadow: '0 2px 14px rgba(0,0,0,0.75)' }}>
                                Una <span className="font-black" style={{ color: NEON.cyan }}>alianza estratégica</span> que une la infraestructura financiera del BDV con el motor de aceleración con AI de Startup Factory Hub para construir, desde Caracas, el <span className="font-black" style={{ color: NEON.lime }}>ecosistema de innovación más relevante de la región</span>.
                              </p>
                            </motion.div>

                          </div>
                        </div>
                      </div>

                      {/* ---------- PILARES (sección propia, fuera del cuadro) ---------- */}
                      <div className="shrink-0 mt-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase" style={{ color: NEON.cyan }}>PILARES DE LA ALIANZA</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${NEON.cyan}70, transparent)` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { i: Globe2, h: 'Corredores de Negocio', l: 'La red del BDV abre mercados.', c: NEON.cyan, code: 'P·01', k: '#1', kl: 'PIB y banca', d: 0.3 },
                            { i: Rocket, h: 'Aceleración con AI', l: 'Cohortes, mentoría y capital.', c: NEON.magenta, code: 'P·02', k: 'T1', kl: 'Arranque 2026', d: 0.36 },
                            { i: GraduationCap, h: 'Talento Venezolano', l: 'UCV · USB · UCAB · UNIMET.', c: NEON.lime, code: 'P·03', k: '5M+', kl: 'Área metro', d: 0.42 },
                          ].map((item) => (
                            <motion.div
                              key={item.code}
                              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: item.d }}
                              className="bdv-tile relative overflow-hidden rounded-xl px-3 py-2.5 flex items-center gap-3 min-w-0"
                              style={{ background: `linear-gradient(150deg, ${item.c}1f, rgba(6,12,22,0.9))`, border: `1px solid ${item.c}60` }}
                            >
                              <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${item.c}, transparent)` }} />
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${item.c}22`, border: `1px solid ${item.c}70` }}>
                                <item.i className="h-4 w-4" style={{ color: item.c }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-[7.5px] tracking-[0.3em] uppercase" style={{ color: item.c }}>{item.code}</div>
                                <div className="font-futuristic font-black uppercase text-[12.5px] tracking-[0.04em] leading-tight" style={{ color: '#ffffff' }}>{item.h}</div>
                                <div className="font-medium text-[9.5px] leading-snug mt-0.5" style={{ color: '#cbd5e1' }}>{item.l}</div>
                              </div>
                              <div className="shrink-0 text-right pl-1.5" style={{ borderLeft: `1px solid ${item.c}35` }}>
                                <div className="font-futuristic font-black text-[16px] leading-none" style={{ color: '#ffffff', textShadow: `0 0 14px ${item.c}` }}>{item.k}</div>
                                <div className="font-mono text-[6.5px] tracking-[0.2em] uppercase mt-0.5" style={{ color: item.c }}>{item.kl}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* ---------- ACCIONES (sección propia) ---------- */}
                      <div className="shrink-0 mt-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[8.5px] tracking-[0.4em] uppercase" style={{ color: NEON.lime }}>PRÓXIMOS PASOS</span>
                          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${NEON.lime}70, transparent)` }} />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { n: '01', t: 'El momento es ahora', s: 'Firmar la carta de intención y activar la JV 50/50 este trimestre.', c: NEON.cyan, i: Zap, d: 0.34 },
                            { n: '02', t: 'Cultivemos el talento', s: 'Primera cohorte con universidades y PyMEs del BDV.', c: NEON.magenta, i: GraduationCap, d: 0.46 },
                            { n: '03', t: 'La Caracas del futuro', s: 'Sede insignia abierta a fundadores y capital global.', c: NEON.lime, i: Building2, d: 0.52 },
                          ].map((a) => (
                            <motion.div
                              key={a.n}
                              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: a.d }}
                              className="bdv-tile relative overflow-hidden rounded-xl px-3.5 py-2.5 flex flex-col justify-center min-w-0"
                              style={{ background: `linear-gradient(150deg, ${a.c}26 0%, rgba(6,12,22,0.94) 60%)`, border: `1px solid ${a.c}75`, boxShadow: `inset 0 0 30px ${a.c}16` }}
                            >
                              <div className="absolute inset-y-0 w-1/2 bdv-sweep pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${a.c}20, transparent)`, animationDelay: `${Number(a.n) * 0.7}s` }} />
                              <div className="absolute -right-1 -bottom-3 font-futuristic font-black text-[46px] leading-none pointer-events-none" style={{ color: `${a.c}22` }}>{a.n}</div>
                              <div className="relative z-10 flex items-center gap-2">
                                <a.i className="h-4 w-4" style={{ color: a.c, filter: `drop-shadow(0 0 8px ${a.c})` }} />
                                <span className="font-mono text-[8px] tracking-[0.35em]" style={{ color: a.c }}>ACCIÓN {a.n}</span>
                              </div>
                              <div className="relative z-10 font-futuristic font-black text-[14px] leading-[1.12] tracking-wide mt-1" style={{ color: '#ffffff', textShadow: `0 0 16px ${a.c}90` }}>{a.t}</div>
                              <div className="relative z-10 text-[9.5px] leading-snug mt-0.5 font-medium" style={{ color: '#d8e2f0' }}>{a.s}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <style>{`
                        @keyframes bdv-aurora-shift { 0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .85 } 50% { transform: translate3d(-3%,2%,0) scale(1.08); opacity: 1 } }
                        @keyframes bdv-grid-drift { from { background-position: 0 0, 0 0 } to { background-position: 46px 46px, 46px 46px } }
                        @keyframes bdv-scan-move { 0% { transform: translateX(-60%) } 100% { transform: translateX(280%) } }
                        @keyframes bdv-stars-twinkle { 0%,100% { opacity: .35 } 50% { opacity: .85 } }
                        @keyframes bdv-sweep-move { 0% { transform: translateX(-120%) } 60%,100% { transform: translateX(260%) } }
                        @keyframes bdv-edge-pulse { 0%,100% { opacity: .45 } 50% { opacity: 1 } }
                        .bdv-aurora { animation: bdv-aurora-shift 12s ease-in-out infinite }
                        .bdv-grid { animation: bdv-grid-drift 14s linear infinite }
                        .bdv-scan { animation: bdv-scan-move 9s linear infinite }
                        .bdv-stars { animation: bdv-stars-twinkle 5s ease-in-out infinite }
                        .bdv-sweep { animation: bdv-sweep-move 5.5s ease-in-out infinite }
                        .bdv-edge { animation: bdv-edge-pulse 2.6s ease-in-out infinite }
                        .bdv-tile { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease }
                        .bdv-tile:hover { transform: translateY(-2px) }
                      `}</style>

                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 4 — THE OPPORTUNITY
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="03" label="OPORTUNIDAD" pageNum={4}>
                    {/* HEADER: title + dual logos */}
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] tracking-[0.4em] uppercase mb-2" style={{ color: NEON.magenta }}>03 · La Oportunidad</div>
                        <h2 className="font-display font-black" style={{ fontSize: '38px', lineHeight: 1.08, paddingBottom: '4px', ...PLATINUM_TITLE }}>
                          Caracas tiene el talento y la escala.<br/>
                          <span style={{ color: NEON.magenta, textShadow: `0 0 28px ${NEON.magenta}90` }}>Le falta la convergencia.</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pt-1">
                        {/* BDV mark */}
                        <div className="flex flex-col items-center justify-center w-[78px] h-[78px] rounded-full border-2 backdrop-blur-md" style={{ borderColor: `${NEON.cyan}90`, background: `${NEON.cyan}15`, boxShadow: `0 0 18px ${NEON.cyan}60` }}>
                          <Globe2 className="w-6 h-6" style={{ color: NEON.cyan }} />
                          <span className="font-futuristic font-black text-[11px] tracking-wider" style={{ color: NEON.cyan }}>BDV</span>
                        </div>
                        <span className="font-mono text-2xl" style={{ color: `${NEON.cyan}80` }}>×</span>
                        {/* SFH logo */}
                        <div className="flex items-center justify-center w-[78px] h-[78px] rounded-full border-2 backdrop-blur-md p-2" style={{ borderColor: `${NEON.lime}90`, background: `${NEON.lime}15`, boxShadow: `0 0 18px ${NEON.lime}60` }}>
                          <img src={sfhLogo} alt="Startup Factory Hub" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC TICKER STRIP */}
                    <div className="relative overflow-hidden rounded-md border mb-4" style={{ borderColor: `${NEON.magenta}40`, background: 'rgba(255,255,255,0.38)' }}>
                      <div className="flex items-center gap-8 py-2 px-4 font-mono text-[11px] tracking-[0.3em] uppercase whitespace-nowrap animate-pulse" style={{ color: `${NEON.cyan}cc` }}>
                        <span>● EN VIVO</span>
                        <span style={{ color: NEON.lime }}>ÁREA METROPOLITANA DE CARACAS</span>
                        <span style={{ color: NEON.magenta }}>CONCENTRACIÓN DE PIB NACIONAL</span>
                        <span style={{ color: NEON.cyan }}>MAYOR DENSIDAD DE TALENTO TÉCNICO</span>
                        <span style={{ color: NEON.amber }}>CONECTIVIDAD LATAM · EEUU · EUROPA</span>
                        <span style={{ color: NEON.lime }}>DIÁSPORA GLOBAL COMO RED</span>
                        <span style={{ color: NEON.magenta }}>HUB DE INNOVACIÓN · POR CONSTRUIR</span>
                      </div>
                    </div>

                    {/* 4-QUADRANT METRIC GRID WITH IMAGES */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1">
                      {[
                        { v: '#1', l: 'Capital y centro financiero del país', c: NEON.cyan, i: Rocket, sub: 'Mayor concentración de PIB y actividad bancaria de Venezuela', img: oppGrowth },
                        { v: '5M+', l: 'Población del área metropolitana de Caracas', c: NEON.magenta, i: Users, sub: 'La mayor densidad de talento universitario y técnico del país (UCV, USB, UCAB, UNIMET)', img: oppPopulation },
                        { v: '4', l: 'Husos horarios de ventaja frente a Europa', c: NEON.lime, i: Globe2, sub: 'Conectividad estratégica con Norteamérica y Europa', img: oppVisitors },
                        { v: '0', l: 'Destino de innovación centralizado', c: NEON.amber, i: Target, sub: 'Hasta ahora — la brecha que cerramos juntos', img: oppGap },
                      ].map((q, i) => (
                        <GlassCard key={i} accent={q.c} padding="p-0" className="relative overflow-hidden flex flex-col">
                          {/* background image */}
                          <div className="absolute inset-0" style={{ backgroundImage: `url(${q.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          {/* darkening + neon wash */}
                          <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, rgba(4,9,18,0.88) 0%, rgba(4,9,18,0.80) 55%, rgba(4,9,18,0.86) 100%)` }} />
                          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 85% 15%, ${q.c}30 0%, transparent 55%)` }} />
                          {/* bottom text shield */}
                          <div className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'linear-gradient(0deg, rgba(2,6,14,0.94) 0%, rgba(2,6,14,0.55) 60%, transparent 100%)' }} />
                          {/* scanning gradient line */}
                          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${q.c}, transparent)`, boxShadow: `0 0 10px ${q.c}` }} />

                          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                              <NeonBadge icon={q.i} color={q.c} size="lg" />
                              <span className="font-mono text-[10px] tracking-[0.35em] uppercase px-2 py-1 rounded border" style={{ color: q.c, borderColor: `${q.c}70`, background: 'rgba(2,6,14,0.65)' }}>MÉTRICA·{String(i+1).padStart(2,'0')}</span>
                            </div>
                            <div>
                              <div className="font-futuristic font-black leading-none mb-2" style={{ fontSize: '54px', color: q.c, textShadow: `0 0 30px ${q.c}, 0 2px 10px rgba(0,0,0,0.95)` }}>{q.v}</div>
                              <div className="text-[18px] font-bold leading-tight" style={{ color: '#ffffff', textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>{q.l}</div>
                              <div className="mt-1.5 text-[13.5px] leading-snug font-medium" style={{ color: '#dbe5f2', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>{q.sub}</div>

                              {/* animated bar */}
                              <div className="mt-3 h-[3px] rounded-full overflow-hidden" style={{ background: `${q.c}20` }}>
                                <div className="h-full rounded-full animate-pulse" style={{ width: '85%', background: `linear-gradient(90deg, ${q.c}, ${q.c}80)`, boxShadow: `0 0 8px ${q.c}` }} />
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 5 — JOINT VENTURE STRUCTURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="04" label="ESTRUCTURA" pageNum={5}>
                    <PageTitle kicker="04 · Joint Venture" title={<>Una misión. Sociedad <span style={{ color: NEON.cyan }}>50</span> / <span style={{ color: NEON.magenta }}>50</span>.</>} />

                    {/* Modern dual-partner composition — bold typography, no photos */}
                    <div className="relative flex-1 grid grid-cols-2 gap-6 min-h-0">
                      {/* BDV PARTNER CARD */}
                      <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative rounded-3xl overflow-hidden border h-full flex flex-col p-8"
                        style={{
                          borderColor: `${NEON.cyan}55`,
                          background: `linear-gradient(155deg, ${NEON.cyan}22 0%, rgba(255,255,255,0.68) 45%, rgba(255,255,255,0.82) 100%)`,
                          boxShadow: `0 0 60px ${NEON.cyan}30, inset 0 0 0 1px ${NEON.cyan}25`,
                        }}
                      >
                        {/* glow orb */}
                        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle, ${NEON.cyan}55, transparent 70%)`, filter: 'blur(20px)' }} />
                        {/* grid texture */}
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(${NEON.cyan} 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                        {/* corner brackets */}
                        <span className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2" style={{ borderColor: NEON.cyan }} />
                        <span className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2" style={{ borderColor: NEON.cyan }} />

                        <div className="relative z-10 flex items-start justify-between">
                          <NeonBadge icon={Building2} color={NEON.cyan} size="lg" />
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.cyan, borderColor: `${NEON.cyan}60`, background: `${NEON.cyan}15` }}>SOCIO · A</span>
                        </div>

                        <div className="relative z-10 mt-6">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.cyan }}>Ancla Institucional</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>Banco de<br/>Venezuela</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4">
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '84px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.cyan}60)`,
                          }}>50<span style={{ fontSize: '40px' }}>%</span></div>
                          <div className="pb-3 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold leading-tight" style={{ color: NEON.cyan }}>Participación<br/>Accionaria</div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 flex-1 flex flex-col gap-2.5">
                          {[
                            { t: 'Sede e Instalaciones Premium', s: 'Espacios de trabajo Clase A' },
                            { t: 'Red Global del BDV', s: 'Más de 300 ciudades en el mundo' },
                            { t: 'Relaciones de Gobierno y Comercio', s: 'Acceso institucional' },
                            { t: 'Autoridad de Marca', s: 'Credibilidad global' },
                          ].map((row) => (
                            <div key={row.t} className="group relative flex items-center gap-3.5 rounded-xl px-4 py-2.5 border flex-1 overflow-hidden" style={{ background: 'rgba(8,14,24,0.55)', borderColor: `${NEON.cyan}50`, boxShadow: `inset 0 0 20px ${NEON.cyan}15, 0 0 18px ${NEON.cyan}10` }}>
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}18, transparent)` }} />
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${NEON.cyan}20`, border: `1px solid ${NEON.cyan}60`, boxShadow: `0 0 14px ${NEON.cyan}40` }}>
                                <Check className="w-4 h-4" style={{ color: '#ffffff', filter: `drop-shadow(0 0 6px ${NEON.cyan})` }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[18px] font-black uppercase tracking-wide leading-tight" style={{ color: '#ffffff', textShadow: `0 0 12px ${NEON.cyan}60`, fontFamily: "'Orbitron', 'Plus Jakarta Sans', system-ui, sans-serif" }}>{row.t}</div>
                                <div className="text-[13px] font-medium leading-tight mt-0.5" style={{ color: '#cbd5e1' }}>{row.s}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* SFH PARTNER CARD */}
                      <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="relative rounded-3xl overflow-hidden border h-full flex flex-col p-8"
                        style={{
                          borderColor: `${NEON.magenta}55`,
                          background: `linear-gradient(205deg, ${NEON.magenta}22 0%, rgba(255,255,255,0.68) 45%, rgba(255,255,255,0.82) 100%)`,
                          boxShadow: `0 0 60px ${NEON.magenta}30, inset 0 0 0 1px ${NEON.magenta}25`,
                        }}
                      >
                        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle, ${NEON.magenta}55, transparent 70%)`, filter: 'blur(20px)' }} />
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(${NEON.magenta} 1px, transparent 1px), linear-gradient(90deg, ${NEON.magenta} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                        <span className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2" style={{ borderColor: NEON.magenta }} />
                        <span className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2" style={{ borderColor: NEON.magenta }} />

                        <div className="relative z-10 flex items-start justify-between">
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.magenta, borderColor: `${NEON.magenta}60`, background: `${NEON.magenta}15` }}>SOCIO · B</span>
                          <NeonBadge icon={Rocket} color={NEON.magenta} size="lg" />
                        </div>

                        <div className="relative z-10 mt-6 text-right">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.magenta }}>Motor Operativo</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>Startup<br/>Factory Hub</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4 justify-end">
                          <div className="pb-3 font-mono text-[10px] uppercase tracking-[0.18em] font-semibold leading-tight text-right" style={{ color: NEON.magenta }}>Participación<br/>Accionaria</div>
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '84px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.magenta} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.magenta}60)`,
                          }}>50<span style={{ fontSize: '40px' }}>%</span></div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 flex-1 flex flex-col gap-2.5">
                          {[
                            { t: 'Operación de la Aceleradora', s: 'Programas y cohortes' },
                            { t: 'Plataforma Digital con AI', s: 'Infraestructura tecnológica' },
                            { t: 'Red de Mentores e Inversionistas', s: 'Más de 500 miembros activos' },
                            { t: 'Marketing, Marca y Crecimiento', s: 'Alcance global' },
                          ].map((row) => (
                            <div key={row.t} className="group relative flex items-center gap-3.5 rounded-xl px-4 py-2.5 border flex-1 overflow-hidden" style={{ background: 'rgba(8,14,24,0.55)', borderColor: `${NEON.magenta}50`, boxShadow: `inset 0 0 20px ${NEON.magenta}15, 0 0 18px ${NEON.magenta}10` }}>
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.magenta}18, transparent)` }} />
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${NEON.magenta}20`, border: `1px solid ${NEON.magenta}60`, boxShadow: `0 0 14px ${NEON.magenta}40` }}>
                                <Check className="w-4 h-4" style={{ color: '#ffffff', filter: `drop-shadow(0 0 6px ${NEON.magenta})` }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[18px] font-black uppercase tracking-wide leading-tight" style={{ color: '#ffffff', textShadow: `0 0 12px ${NEON.magenta}60`, fontFamily: "'Orbitron', 'Plus Jakarta Sans', system-ui, sans-serif" }}>{row.t}</div>
                                <div className="text-[13px] font-medium leading-tight mt-0.5" style={{ color: '#cbd5e1' }}>{row.s}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                    </div>

                    {/* governance strip */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      {[
                        { l: 'Participación Igualitaria', c: NEON.cyan },
                        { l: 'Gobernanza Compartida', c: NEON.lime },
                        { l: 'Autoridad Conjunta', c: NEON.magenta },
                      ].map((g, i) => (
                        <div key={i} className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl border" style={{ borderColor: `${g.c}55`, background: `${g.c}12` }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.c, boxShadow: `0 0 12px ${g.c}` }} />
                          <span className="font-mono text-[13px] tracking-[0.3em] uppercase font-bold" style={{ color: g.c }}>{g.l}</span>
                        </div>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 6 — BDV CONTRIBUTION (timeline rail left → right)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="05" label="APORTE DEL BDV" pageNum={6}>
                    <PageTitle kicker="05 · Lo que aporta el BDV" title={<>Peso institucional. <span style={{ color: NEON.cyan }}>Alcance global.</span></>} />

                    <div className="relative flex-1 pl-16 flex flex-col">
                      {/* animated vertical rail */}
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute left-5 top-0 bottom-0 w-[2px] origin-top"
                        style={{ background: `linear-gradient(180deg, transparent, ${NEON.cyan} 15%, ${NEON.cyan} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.cyan}, 0 0 40px ${NEON.cyan}80` }}
                      />
                      {/* rail scan pulse */}
                      <motion.div
                        initial={{ top: '0%', opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                        className="absolute left-[14px] w-3 h-3 rounded-full"
                        style={{ background: NEON.cyan, boxShadow: `0 0 24px ${NEON.cyan}, 0 0 60px ${NEON.cyan}` }}
                      />

                      <div className="grid grid-cols-1 gap-5 flex-1">
                        {[
                          { i: Building2, t: 'Sede e Instalaciones Premium', b: 'Un destino insignia, de clase ejecutiva, listo para recibir fundadores, capital y delegaciones internacionales.' },
                          { i: Globe2, t: 'Red Banco de Venezuela', b: 'Acceso directo a la mayor red bancaria del país — sucursales, clientes PyME y corporativos en todo el territorio.' },
                          { i: Handshake, t: 'Canales de Comercio Internacional', b: 'Relaciones diplomáticas y comerciales ya establecidas que facilitan la entrada a nuevos mercados para las empresas del portafolio.' },
                          { i: ShieldCheck, t: 'Relaciones de Gobierno y Sociedad Civil', b: 'Vínculos directos con autoridades de desarrollo económico estadales, municipales y nacionales.' },
                          { i: Award, t: 'Credibilidad y Autoridad de Marca', b: 'Un sello de confianza reconocido mundialmente que eleva cada programa, alianza y anuncio.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex-1"
                          >
                            {/* glowing node */}
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.4, delay: 0.6 + idx * 0.22 }}
                              className="absolute -left-[52px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-10"
                              style={{ background: NEON.cyan, boxShadow: `0 0 24px ${NEON.cyan}, 0 0 8px ${NEON.cyan}` }}
                            />
                            <span className="absolute -left-[58px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 animate-pulse" style={{ borderColor: `${NEON.cyan}60` }} />
                            {/* connector line node → card */}
                            <span className="absolute -left-[38px] top-1/2 h-px w-8" style={{ background: `linear-gradient(90deg, ${NEON.cyan}, transparent)` }} />

                            <GlassCard accent={NEON.cyan} padding="p-6" className="flex items-center gap-6 h-full relative overflow-hidden group">
                              {/* corner brackets */}
                              <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: NEON.cyan }} />
                              <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: NEON.cyan }} />
                              {/* scan sweep on hover */}
                              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(110deg, transparent 40%, ${NEON.cyan}25 50%, transparent 60%)` }} />

                              <div className="scale-125 origin-center">
                                <NeonBadge icon={n.i} color={NEON.cyan} />
                              </div>
                              <div className="flex-1 relative z-10">
                                <div className="text-[26px] font-black text-slate-900 leading-tight tracking-tight">{n.t}</div>
                                <div className="text-[15px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1 relative z-10">
                                <span className="font-mono text-[11px] tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>W/{String(idx + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">VECTOR</span>
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 7 — SFH CONTRIBUTION (mirrored, magenta)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="06" label="APORTE DE SFH" pageNum={7}>
                    <PageTitle kicker="06 · Lo que aporta SFH" title={<>Motor emprendedor. <span style={{ color: NEON.magenta }}>Columna vertebral digital.</span></>} accent={NEON.magenta} />

                    <div className="relative flex-1 pr-16 flex flex-col">
                      {/* animated vertical rail */}
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute right-5 top-0 bottom-0 w-[2px] origin-top"
                        style={{ background: `linear-gradient(180deg, transparent, ${NEON.magenta} 15%, ${NEON.magenta} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.magenta}, 0 0 40px ${NEON.magenta}80` }}
                      />
                      {/* rail scan pulse */}
                      <motion.div
                        initial={{ top: '0%', opacity: 0 }}
                        animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                        className="absolute right-[14px] w-3 h-3 rounded-full"
                        style={{ background: NEON.magenta, boxShadow: `0 0 24px ${NEON.magenta}, 0 0 60px ${NEON.magenta}` }}
                      />

                      <div className="grid grid-cols-1 gap-5 flex-1">
                        {[
                          { i: Rocket, t: 'Operación de la Aceleradora', b: 'Diseño integral de programas, gestión de cohortes, acompañamiento a fundadores y reportes de resultados.' },
                          { i: Brain, t: 'Plataforma Digital con AI', b: 'Un sistema operativo propio para miembros, fundadores, mentores e inversionistas. Flujo de negocios en vivo. Inteligencia real.' },
                          { i: GraduationCap, t: 'Red de Mentores y Expertos', b: 'Más de 150 mentores activos. Más de 300 inversionistas. Directorio de más de 1.500 inversionistas. Una máquina de relaciones.' },
                          { i: DollarSign, t: 'Relaciones con Inversionistas y Capital', b: 'Pipelines de capital curados e infraestructura de demo days ajustada desde la Serie A hasta etapas de crecimiento.' },
                          { i: Sparkles, t: 'Marketing, Marca y Crecimiento', b: 'Contenido editorial, eventos y relaciones públicas globales — ya presentes en la Torre Nasdaq, Times Square.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex-1"
                          >
                            {/* glowing node */}
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.4, delay: 0.6 + idx * 0.22 }}
                              className="absolute -right-[52px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-10"
                              style={{ background: NEON.magenta, boxShadow: `0 0 24px ${NEON.magenta}, 0 0 8px ${NEON.magenta}` }}
                            />
                            <span className="absolute -right-[58px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 animate-pulse" style={{ borderColor: `${NEON.magenta}60` }} />
                            {/* connector line card → node */}
                            <span className="absolute -right-[38px] top-1/2 h-px w-8" style={{ background: `linear-gradient(270deg, ${NEON.magenta}, transparent)` }} />

                            <GlassCard accent={NEON.magenta} padding="p-6" className="flex items-center gap-6 h-full relative overflow-hidden group">
                              {/* corner brackets */}
                              <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: NEON.magenta }} />
                              <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: NEON.magenta }} />
                              {/* scan sweep on hover */}
                              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(110deg, transparent 40%, ${NEON.magenta}25 50%, transparent 60%)` }} />

                              <div className="flex flex-col items-start gap-1 relative z-10">
                                <span className="font-mono text-[11px] tracking-[0.3em] font-bold" style={{ color: NEON.magenta }}>S/{String(idx + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">MÓDULO</span>
                              </div>
                              <div className="flex-1 relative z-10">
                                <div className="text-[26px] font-black text-slate-900 leading-tight tracking-tight">{n.t}</div>
                                <div className="text-[15px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
                              </div>
                              <div className="scale-125 origin-center">
                                <NeonBadge icon={n.i} color={NEON.magenta} />
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 8 — CAPABILITY MATRIX (4×4)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="07" label="MATRIZ DE CAPACIDADES" pageNum={8}>
                    <PageTitle kicker="07 · Matriz de Capacidades" title={<>16 capacidades combinadas. <span style={{ color: NEON.lime }}>Una sola plataforma.</span></>} accent={NEON.lime} />

                    <LavaCapabilityMatrix accent={NEON.lime} />
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 9 — DIGITAL PLATFORM
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="08" label="PLATAFORMA DIGITAL" pageNum={9}>
                    <PageTitle kicker="08 · Plataforma Digital" title={<>Prueba en vivo la app <span style={{ color: NEON.cyan }}>Innovation Nexus</span>.</>} />

                    <DigitalPlatformDemo />


                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 10 — AR / IMMERSIVE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="09" label="RA · INMERSIVO" pageNum={10}>
                    <PageTitle kicker="09 · Realidad Aumentada" title={<><span style={{ color: NEON.magenta }}>Apunta.</span> Escanea. Entra.</>} accent={NEON.magenta} />

                    <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ border: `1px solid ${NEON.magenta}50` }}>
                      <img src={moonBackground.url} alt="Moon" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.82) 100%)` }} />
                      <MatrixLayer density={0.18} columns={30} tone="magenta" />

                      <div className="absolute inset-0 flex flex-col justify-between p-8">
                        <div className="flex justify-between items-start gap-6">
                          <GlassCard accent={NEON.magenta} padding="p-6" className="max-w-md">
                            <div className="flex items-center gap-3 mb-3">
                              <Scan className="h-6 w-6" style={{ color: NEON.magenta }} />
                              <span className="font-mono text-xs uppercase tracking-[0.35em] font-bold" style={{ color: NEON.magenta }}>RA · ACTIVA</span>
                            </div>
                            <div className="text-base text-slate-900 leading-relaxed font-medium">
                              Cualquier smartphone se convierte en un portal hacia el Innovation Nexus — pabellones 3D de startups, oradores holográficos, mapa global interactivo del BDV.
                            </div>
                          </GlassCard>
                          <div className="font-mono text-xs uppercase tracking-[0.3em] text-right text-slate-700 font-semibold">
                            <div>LAT 10°28′N</div>
                            <div>LON 66°55′O</div>
                            <div className="mt-1.5 text-sm" style={{ color: NEON.magenta }}>● RASTREANDO</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-futuristic font-black leading-[0.95] mb-4" style={{ fontSize: '38px', color: '#ffffff', textShadow: `0 2px 18px rgba(0,0,0,0.85), 0 0 40px ${NEON.magenta}90` }}>
                            Camina a través del<br /><span style={{ color: '#f9a8d4' }}>futuro del comercio.</span>
                          </h3>

                          {/* AR ROVER VIEWPORT */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="relative rounded-2xl overflow-hidden mb-5"
                            style={{
                              height: '230px',
                              border: `1px solid ${NEON.cyan}60`,
                              boxShadow: `0 0 50px ${NEON.cyan}40, inset 0 0 30px rgba(0,0,0,0.5)`,
                            }}
                          >
                            {/* @ts-ignore */}
                            <model-viewer
                              src={ROVER_GLB}
                              ar
                              ar-modes="webxr scene-viewer quick-look"
                              ar-placement="floor"
                              xr-environment
                              camera-controls
                              auto-rotate
                              touch-action="pan-y"
                              exposure="1"
                              shadow-intensity="1"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
                            />
                            <a
                              href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(ROVER_GLB)}&mode=ar_preferred&title=NASA%20Perseverance%20Rover#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`}
                              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-[0.28em] font-bold"
                              style={{ background: NEON.cyan, color: '#0a1020', boxShadow: `0 0 24px ${NEON.cyan}` }}
                            >
                              <Smartphone className="h-4 w-4" /> Iniciar Google XR
                            </a>
                            <div className="absolute inset-0" style={{
                              background: `linear-gradient(135deg, ${NEON.cyan}20 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.5) 100%)`,
                            }} />

                            {/* AR reticle / HUD */}
                            <div className="absolute inset-0 pointer-events-none">
                              {[
                                'top-4 left-4 border-t-2 border-l-2',
                                'top-4 right-4 border-t-2 border-r-2',
                                'bottom-4 left-4 border-b-2 border-l-2',
                                'bottom-4 right-4 border-b-2 border-r-2',
                              ].map((cls, i) => (
                                <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
                              ))}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 animate-pulse" style={{ borderColor: NEON.cyan, boxShadow: `0 0 18px ${NEON.cyan}, inset 0 0 18px ${NEON.cyan}50` }} />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: NEON.cyan, boxShadow: `0 0 12px ${NEON.cyan}` }} />
                            </div>

                            <div className="absolute top-4 left-4 ml-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
                              background: 'rgba(255,255,255,0.55)',
                              backdropFilter: 'blur(6px)',
                              border: `1px solid ${NEON.cyan}70`,
                            }}>
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-900 font-bold">RA · ESCANEANDO</span>
                            </div>
                            <div className="absolute top-4 right-4 mr-10 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-800 text-right font-semibold">
                              <div>OBJ · ROVER DE LA NASA</div>
                              <div style={{ color: NEON.cyan }}>DIST 4.3M</div>
                            </div>
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                              <div>
                                <div className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>// VISTA EN VIVO</div>
                                <div className="font-futuristic font-black leading-tight mt-1" style={{ ...PLATINUM_TITLE, fontSize: '16px', textShadow: `0 0 14px ${NEON.cyan}`, whiteSpace: 'nowrap' }}>
                                  Rover de Marte · Escaneo
                                </div>
                              </div>
                              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-700 text-right font-semibold">
                                <div>LAT −4.5°  LON 137.4°</div>
                                <div style={{ color: NEON.magenta }}>● RASTREADO</div>
                              </div>
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { i: Smartphone, l: 'WebAR', s: 'Sin instalación' },
                              { i: Box, l: 'Stands 3D', s: 'Pabellones de startups' },
                              { i: Globe2, l: 'Mapa Global', s: 'Interactivo en 3D' },
                              { i: Sparkles, l: 'Oradores Holográficos', s: 'Presencia en vivo' },
                            ].map((p, i) => (
                              <GlassCard key={i} accent={NEON.magenta} padding="p-5" className="text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${NEON.magenta}80, transparent 65%)` }} />
                                <div className="relative">
                                  <p.i className="h-7 w-7 mx-auto mb-2.5" style={{ color: NEON.magenta, filter: `drop-shadow(0 0 10px ${NEON.magenta})` }} />
                                  <div className="font-futuristic font-black text-base text-slate-900 leading-tight">{p.l}</div>
                                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-600 mt-1">{p.s}</div>
                                </div>
                              </GlassCard>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 11b — KPIs / SUCCESS DASHBOARD
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent="hsl(var(--primary))" code="11B" label="TABLERO DE ÉXITO" pageNum={12}>
                    <div className="flex-1 flex flex-col gap-4 min-h-0 relative" style={{ background: 'var(--gradient-hero)' }}>
                      {/* Hero insight card */}
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative tech-card border-0 rounded-2xl p-5 overflow-hidden shrink-0"
                      >
                        <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-12 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex items-center justify-between gap-5">
                          <div className="space-y-2">
                            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1">
                              <Sparkles className="w-3 h-3" /> Trayectoria del Primer Año
                            </Badge>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                              Tablero de <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Éxito</span>
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md">
                              Resultados proyectados en startups, capital, membresía e impacto comunitario.
                            </p>
                            <div className="flex items-center gap-2 pt-1 max-w-md">
                              <Progress value={72} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground tabular-nums">72%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 min-w-[300px]">
                            {[
                              { icon: Rocket, value: '100', label: 'Startups', tone: 'text-primary', delta: '+300%', from: '25 en T1' },
                              { icon: Users, value: '1.000', label: 'Miembros', tone: 'text-emerald-500', delta: '+456%', from: '180 en T1' },
                              { icon: DollarSign, value: '$500M+', label: 'Capital de Red', tone: 'text-amber-500', delta: '+525%', from: '$80M en T1' },
                            ].map((s, i) => {
                              const Icon = s.icon;
                              return (
                                <div key={i} className="rounded-xl bg-background/40 border border-border/40 px-3 py-2.5 backdrop-blur-sm">
                                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <Icon className={`w-3 h-3 ${s.tone}`} />
                                    {s.label}
                                  </div>
                                  <div className={`text-xl font-bold tabular-nums mt-0.5 ${s.tone}`}>{s.value}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-semibold text-emerald-500 tabular-nums">{s.delta}</span>
                                    <span className="text-[9px] text-muted-foreground ml-auto">vs {s.from}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>

                      {/* Main trajectory chart */}
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="relative tech-card border-0 rounded-2xl p-4 flex flex-col flex-1 min-h-0"
                      >
                        <div className="flex items-center justify-between mb-2 shrink-0">
                          <div>
                            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Proyecciones del Primer Año
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 px-1.5 py-0 text-[9px] h-4">
                                  <TrendingUp className="w-2.5 h-2.5" /> +430% interanual
                                </Badge>
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Diferencial trimestral · los seis vectores de crecimiento</div>
                          </div>
                          <div className="flex items-center gap-2.5 text-[10px] flex-wrap justify-end max-w-[55%]">
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(160 84% 39%)' }} /> Startups</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(160 84% 55%)' }} /> Miembros</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(38 92% 50%)' }} /> Capital ($M)</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(262 83% 58%)' }} /> Corporativo</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(190 90% 45%)' }} /> Internacional</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(346 84% 60%)' }} /> Comunidad</span>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[
                                { q: 'T1', startups: 25, members: 180, capital: 80, corporate: 16, intl: 6, community: 40 },
                                { q: 'T2', startups: 55, members: 450, capital: 200, corporate: 28, intl: 12, community: 110 },
                                { q: 'T3', startups: 80, members: 750, capital: 350, corporate: 45, intl: 20, community: 220 },
                                { q: 'T4', startups: 100, members: 1000, capital: 500, corporate: 60, intl: 30, community: 360 },
                              ]}
                              margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                            >
                              <defs>
                                <linearGradient id="sStartups" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="sMembers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(160 84% 55%)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(160 84% 55%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="sCapital" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="sCorporate" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="sIntl" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(190 90% 45%)" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="hsl(190 90% 45%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="sCommunity" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(346 84% 60%)" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="hsl(346 84% 60%)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160 30% 88%)" vertical={false} />
                              <XAxis dataKey="q" tick={{ fontSize: 10, fill: 'hsl(160 20% 40%)' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: 'hsl(160 20% 40%)' }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ background: 'hsl(160 50% 99%)', border: '1px solid hsl(160 30% 88%)', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: 'hsl(160 50% 15%)' }}
                              />
                              <Area type="monotone" dataKey="community" name="Comunidad" stroke="hsl(346 84% 60%)" strokeWidth={1.75} fill="url(#sCommunity)" />
                              <Area type="monotone" dataKey="members" name="Miembros" stroke="hsl(160 84% 55%)" strokeWidth={1.75} fill="url(#sMembers)" />
                              <Area type="monotone" dataKey="capital" name="Capital ($M)" stroke="hsl(38 92% 50%)" strokeWidth={2} fill="url(#sCapital)" />
                              <Area type="monotone" dataKey="startups" name="Startups" stroke="hsl(160 84% 39%)" strokeWidth={2} fill="url(#sStartups)" />
                              <Area type="monotone" dataKey="corporate" name="Corporativo" stroke="hsl(262 83% 58%)" strokeWidth={1.75} fill="url(#sCorporate)" />
                              <Area type="monotone" dataKey="intl" name="Internacional" stroke="hsl(190 90% 45%)" strokeWidth={1.75} fill="url(#sIntl)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>


                      {/* Category insight cards — explanatory bullets instead of duplicate charts */}
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid grid-cols-3 gap-3 shrink-0"
                      >
                        {[
                          {
                            icon: Rocket,
                            title: 'Startups e Innovación',
                            metric: '100 startups',
                            tone: 'text-primary',
                            bg: 'bg-primary/10',
                            accent: 'from-primary to-emerald-400',
                            bullets: [
                              'Impulsado por cohortes de la aceleradora, desarrollos del venture studio y alianzas universitarias.',
                              'Cada startup es evaluada por su potencial de propiedad intelectual, ajuste de mercado y preparación de capital.',
                              'Meta: 25 en el T1 → 100 para el T4 mediante demo days y emparejamiento con IA.',
                            ],
                          },
                          {
                            icon: Users,
                            title: 'Crecimiento de Membresía',
                            metric: '1.000 miembros',
                            tone: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                            accent: 'from-emerald-500 to-teal-400',
                            bullets: [
                              'Acceso escalonado para fundadores, mentores, inversionistas y exploradores corporativos.',
                              'Crecimiento orgánico a partir de eventos, referidos y efectos de red de la plataforma.',
                              'Meta: 180 miembros al lanzamiento → 1.000 perfiles activos para fin de año.',
                            ],
                          },
                          {
                            icon: Building2,
                            title: 'Vinculación Corporativa',
                            metric: '60 aliados',
                            tone: 'text-violet-500',
                            bg: 'bg-violet-500/10',
                            accent: 'from-violet-500 to-fuchsia-400',
                            bullets: [
                              'Empresas Fortune 500 y regionales se suman para sprints de innovación y pilotos.',
                              'Los ingresos incluyen patrocinios, contratos de I+D y membresías corporativas.',
                              'Meta: 16 aliados en el T1 → 60 relaciones corporativas estratégicas para el T4.',
                            ],
                          },
                          {
                            icon: DollarSign,
                            title: 'Capital de la Red',
                            metric: '$500M+',
                            tone: 'text-amber-500',
                            bg: 'bg-amber-500/10',
                            accent: 'from-amber-500 to-orange-400',
                            bullets: [
                              'Incluye rondas de inversión, subvenciones y líneas de deuda en toda la cartera.',
                              'Respaldado por presentaciones a inversionistas (LPs), demo days y horas de oficina con inversionistas.',
                              'Meta: US$80M desplegados en el T1 → más de US$500M en capital registrado para el T4.',
                            ],
                          },
                          {
                            icon: Globe2,
                            title: 'Impacto Internacional',
                            metric: '30 delegaciones',
                            tone: 'text-cyan-500',
                            bg: 'bg-cyan-500/10',
                            accent: 'from-cyan-500 to-blue-400',
                            bullets: [
                              'Los canales de BDV atraen delegaciones globales, misiones comerciales e inversionistas extranjeros.',
                              'Enfoque en corredores de LATAM, el Caribe, EE. UU. y Europa, alineados con las fortalezas comerciales de Caracas.',
                              'Meta: 6 puntos de contacto internacionales en el T1 → 30 vinculaciones activas para el T4.',
                            ],
                          },
                          {
                            icon: Network,
                            title: 'Comunidad e Instalaciones',
                            metric: '360 encuentros',
                            tone: 'text-rose-500',
                            bg: 'bg-rose-500/10',
                            accent: 'from-rose-500 to-pink-400',
                            bullets: [
                              'Cenas semanales de fundadores, cumbres trimestrales y ferias comerciales en el hub.',
                              'La sede reúne capital, talento y compradores empresariales en un solo lugar.',
                              'Meta: 40 eventos en el T1 → 360 puntos de contacto comunitarios en total para fin de año.',
                            ],
                          },
                        ].map((card, idx) => {
                          const Icon = card.icon;
                          return (
                            <div key={idx} className="group relative tech-card border-0 rounded-xl p-3 transition-all hover:-translate-y-0.5">
                              <div className={`absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r opacity-70 ${card.accent}`} />
                              <div className="flex items-center gap-2.5 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                                  <Icon className={`w-4 h-4 ${card.tone}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-semibold text-foreground truncate leading-tight">{card.title}</div>
                                  <div className={`text-sm font-bold tabular-nums ${card.tone}`}>{card.metric}</div>
                                </div>
                              </div>
                              <ul className="space-y-1.5">
                                {card.bullets.map((b, bidx) => (
                                  <li key={bidx} className="flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground">
                                    <span className={`mt-0.5 w-1 h-1 rounded-full shrink-0 ${card.bg.replace('/10', '')} ${card.tone}`} />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </motion.div>

                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 12 — BUSINESS MODELS
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="12" label="ARQUITECTURA DE INGRESOS" pageNum={13}>
                    <PageTitle kicker="12 · Modelos de Negocio" title={<>Una <span style={{ color: NEON.cyan }}>arquitectura de ingresos</span> diversificada en veinte motores.</>} accent={NEON.cyan} />

                    <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
                      {/* LIGHT COIN RAIN BACKDROP — only 2D coins, nothing else */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl" aria-hidden>
                        <div className="absolute inset-0" style={{
                          background: 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 60%, #e6eeff 100%)',
                        }} />
                        <div className="absolute inset-0" style={{
                          background: `radial-gradient(ellipse at 50% 0%, ${NEON.cyan}14, transparent 55%)`,
                        }} />
                        {Array.from({ length: 18 }).map((_, i) => {
                          const left = (i * 13.37) % 100;
                          const dur = 6 + (i % 5) * 0.9;
                          const delay = -((i * 0.53) % 7);
                          const size = 14 + (i % 5) * 6;
                          const palette = [NEON.cyan, NEON.amber, NEON.lime, NEON.emerald, '#a78bfa'];
                          const color = palette[i % palette.length];
                          return (
                            <div
                              key={`coin-${i}`}
                              className="absolute coin-fall motion-reduce:hidden"
                              style={{
                                left: `${left}%`,
                                top: 0,
                                color,
                                opacity: 0.75,
                                willChange: 'transform',
                                animationDuration: `${dur}s`,
                                animationDelay: `${delay}s`,
                              }}
                            >
                              <CircleDollarSign style={{ width: size, height: size, strokeWidth: 1.75 }} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative flex flex-col gap-4 flex-1 min-h-0 z-[1]">

                      {/* 5 category cards */}
                      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                        {[
                          {
                            icon: Users, c: NEON.cyan, code: '01', title: 'Acceso y Membresía',
                            models: ['Suscripciones de membresía', 'Coworking y espacios de trabajo', 'Acceso comunitario', 'Franquicias'],
                          },
                          {
                            icon: Rocket, c: NEON.magenta, code: '02', title: 'Capital de Riesgo y Startups',
                            models: ['Cuotas de aceleradora y participación accionaria', 'Desarrollos del venture studio', 'Carry de capital de riesgo', 'Programas de innovación corporativa'],
                          },
                          {
                            icon: GraduationCap, c: NEON.lime, code: '03', title: 'Conocimiento y Medios',
                            models: ['Educación y capacitación', 'Eventos y conferencias', 'Patrocinios estratégicos', 'Medios y contenido'],
                          },
                          {
                            icon: Cpu, c: NEON.amber, code: '04', title: 'Plataforma y Servicios',
                            models: ['Suscripciones', 'Referidos', 'Eventos', 'Comisiones por transacción'],
                          },
                          {
                            icon: Globe, c: '#a78bfa', code: '05', title: 'Desarrollo Global y Económico',
                            models: ['Aterrizaje internacional (soft-landing)', 'Desarrollo económico', 'Comercio e intercambio', 'Ecosistemas de innovación gestionados'],
                          },
                        ].map((cat, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.12 + idx * 0.08 }}
                            className={`min-h-0 ${idx === 4 ? 'col-span-2' : ''}`}
                          >
                            <div
                              className="relative h-full rounded-2xl overflow-hidden flex flex-col justify-between p-5"
                              style={{
                                background: `linear-gradient(135deg, #f5f7e8 0%, #e8efd6 45%, #dde7c4 100%)`,
                                border: `1.5px solid ${cat.c}`,
                                boxShadow: `0 0 0 1px ${cat.c}30 inset, 0 12px 40px -10px ${cat.c}55, 0 0 30px ${cat.c}25`,
                              }}
                            >
                              {/* Bill guilloché pattern */}
                              <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{
                                backgroundImage: `repeating-linear-gradient(45deg, ${cat.c} 0 1px, transparent 1px 6px), repeating-linear-gradient(-45deg, ${cat.c} 0 1px, transparent 1px 6px)`,
                              }} />
                              {/* Corner denomination seals */}
                              <div className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center font-mono font-black text-[13px]" style={{
                                border: `1.5px solid ${cat.c}`,
                                color: cat.c,
                                background: `radial-gradient(circle, ${cat.c}18, transparent 70%)`,
                              }}>{cat.code}</div>
                              <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full flex items-center justify-center font-mono font-black text-[13px]" style={{
                                border: `1.5px solid ${cat.c}`,
                                color: cat.c,
                                background: `radial-gradient(circle, ${cat.c}18, transparent 70%)`,
                              }}>{cat.code}</div>
                              {/* Watermark icon */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07]">
                                <cat.icon style={{ width: 180, height: 180, color: cat.c }} strokeWidth={1.2} />
                              </div>

                              <div className="relative flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{
                                  background: `linear-gradient(135deg, ${cat.c}, ${cat.c}80)`,
                                  border: `2px solid ${cat.c}`,
                                  boxShadow: `0 0 14px ${cat.c}80, inset 0 0 8px rgba(255,255,255,0.4)`,
                                }}>
                                  <cat.icon className="h-5 w-5" style={{ color: '#0a1014' }} strokeWidth={2.2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-mono text-[8.5px] uppercase tracking-[0.3em]" style={{ color: cat.c }}>NOTA DE INGRESOS · {cat.code}</div>
                                  <div className="font-futuristic font-black text-[16px] leading-tight" style={{ color: '#1a2e1a', textShadow: `0 1px 0 rgba(255,255,255,0.4)` }}>{cat.title}</div>
                                </div>
                              </div>

                              <div className={`relative grid gap-2 ${idx === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                                {cat.models.map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-md backdrop-blur-sm" style={{
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))`,
                                    border: `1px solid ${cat.c}50`,
                                  }}>
                                    <CircleDollarSign className="h-3 w-3 shrink-0" style={{ color: cat.c }} strokeWidth={2.4} />
                                    <span className="text-[11.5px] font-semibold leading-tight" style={{ color: '#1a2e1a' }}>{m}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="relative mt-3 flex items-center justify-between gap-3">
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${cat.c}25` }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${65 + idx * 5}%` }}
                                    transition={{ duration: 1, delay: 0.4 + idx * 0.1, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${cat.c}, ${cat.c}90)`, boxShadow: `0 0 10px ${cat.c}` }}
                                  />
                                </div>
                                <div className="font-mono text-[8.5px] uppercase tracking-[0.25em]" style={{ color: cat.c }}>SFH · MONEDA DE CURSO LEGAL</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Hybrid recommendation banner */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        <GlassCard accent={NEON.lime} padding="p-5" className="relative overflow-hidden">
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: `linear-gradient(90deg, ${NEON.cyan}10, ${NEON.magenta}10, ${NEON.lime}10)`,
                          }} />
                          <div className="relative flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                                background: `linear-gradient(135deg, ${NEON.cyan}30, ${NEON.magenta}30)`,
                                border: `1px solid ${NEON.lime}60`,
                                boxShadow: `0 0 20px ${NEON.lime}40`,
                              }}>
                                <Orbit className="h-6 w-6" style={{ color: NEON.lime }} />
                              </div>
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.35em] mb-1" style={{ color: NEON.lime }}>Modelo Híbrido Recomendado</div>
                                <div className="font-futuristic font-black text-[18px] leading-tight" style={PLATINUM_TITLE}>Nueve motores integrados que impulsan el Hub de Innovación BDV</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 max-w-[55%]">
                              {['Membresía','Plataforma de Innovación','Innovación Corporativa','Aceleradora','Educación','Eventos','Comercio Internacional','Espacio de Trabajo','Capital de Riesgo'].map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.15em]" style={{
                                  background: `${NEON.lime}18`, border: `1px solid ${NEON.lime}55`, color: '#0b3b1f',
                                }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                      </div>
                    </div>
                  </PageFrame>

                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 13 — NASDAQ FEATURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="13" label="VISIBILIDAD GLOBAL" pageNum={14}>
                    <PageTitle kicker="13 · Torre Nasdaq · Times Square" title={<>Presentes en el <span style={{ color: NEON.lime }}>escenario mundial.</span></>} />

                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="relative flex-1 rounded-3xl overflow-hidden"
                      style={{
                        border: `1px solid ${NEON.lime}55`,
                        boxShadow: `0 0 60px ${NEON.lime}25, inset 0 0 40px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {/* Full-bleed hero image */}
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url(${nasdaqFeature})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(180deg, rgba(2,4,10,0.10) 0%, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0.93) 72%, rgba(255,255,255,0.97) 100%)`,
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `radial-gradient(ellipse at 50% 20%, ${NEON.lime}22, transparent 60%)`,
                      }} />
                      <Scanlines />

                      {/* Top-left live badge */}
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${DEEP_LIME}55`,
                          boxShadow: `0 6px 20px rgba(2,4,10,0.35)`,
                        }}
                      >
                        <Radio className="h-3 w-3 animate-pulse" style={{ color: DEEP_LIME }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900">EN VIVO · TIMES SQUARE</span>
                      </motion.div>

                      {/* Bottom content panel */}
                      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-7 pt-6">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                        >
                          <div className="font-mono text-[11px] uppercase tracking-[0.4em] mb-3" style={{ color: DEEP_LIME }}>// DESTACADO</div>
                          <h3 className="font-futuristic font-black leading-[1.05] mb-3" style={{
                            fontSize: '34px',
                            ...PLATINUM_TITLE,
                            textShadow: 'none',
                          }}>
                            Startup Factory Hub<br />
                            <span style={{ color: DEEP_LIME, WebkitTextFillColor: DEEP_LIME }}>en la Torre Nasdaq</span>
                          </h3>
                          <p className="text-sm text-slate-800 leading-relaxed max-w-xl mb-4 font-medium">
                            Transmisión en vivo en Times Square, Nueva York — la marca del ecosistema proyectada en la pantalla de la Torre Nasdaq ante millones de personas.
                          </p>
                        </motion.div>

                        {/* Inline metric strip */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55, duration: 0.6, staggerChildren: 0.08 }}
                          className="grid grid-cols-4 gap-3"
                        >
                          {[
                            { k: '350K+', l: 'Espectadores diarios' },
                            { k: 'NYC', l: 'Times Square' },
                            { k: 'Global', l: 'Alcance mediático' },
                            { k: '24/7', l: 'Presencia de marca' },
                          ].map((m, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 16 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + i * 0.08, duration: 0.45 }}
                              className="rounded-xl px-2.5 py-2.5 min-w-0"
                              style={{
                                background: 'rgba(255,255,255,0.9)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${DEEP_LIME}35`,
                                boxShadow: `0 6px 18px rgba(2,4,10,0.18)`,
                              }}
                            >
                              <div className="font-futuristic font-black text-base leading-none whitespace-nowrap" style={{ color: DEEP_LIME }}>{m.k}</div>
                              <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-700 mt-1 leading-tight break-words">{m.l}</div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>

                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 14 — CLOSING
                  ==================================================== */}

              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff 0%, #f9fafc 100%)` }}>
                    <MatrixLayer density={0.4} columns={40} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${NEON.cyan}20 0%, transparent 60%), radial-gradient(circle at 50% 100%, ${NEON.magenta}25, transparent 50%)` }} />
                    <Scanlines />
                    <NeonEmeraldFrame inset={20} radius="32px" />

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[600px] h-[600px] rounded-full border" style={{ borderColor: `${NEON.cyan}20`, animation: 'slow-spin 60s linear infinite' }} />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[440px] h-[440px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.magenta}25`, animation: 'slow-spin-reverse 45s linear infinite' }} />
                    </div>

                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-14">
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                        className="mb-5"
                      >
                        <img
                          src={sfhLogo}
                          alt="Startup Factory Hub"
                          className="h-20 object-contain"
                          style={{ filter: `drop-shadow(0 0 24px ${NEON.cyan}80)` }}
                        />
                      </motion.div>

                      <Orbit className="h-10 w-10 mb-6" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 18px ${NEON.cyan})` }} />

                      <div className="font-mono text-[11px] uppercase tracking-[0.45em] mb-6" style={{ color: NEON.cyan }}>// TRANSMISIÓN DE CIERRE</div>

                      <h1 className="font-futuristic font-black leading-[0.9] tracking-tight" style={{
                        fontSize: '62px',
                        ...PLATINUM_TITLE,
                        backgroundImage: `
                          repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                          repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                          linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                        `,
                        textShadow: `0 0 60px ${NEON.cyan}50`,
                      }}>
                        CONSTRUYAMOS<br />EL FUTURO
                      </h1>

                      <div className="mt-6 h-[3px] w-[280px]" style={{
                        background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                        boxShadow: `0 0 20px ${NEON.cyan}`,
                      }} />

                      <p className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed">
                        La sede insignia de Caracas para la innovación y el comercio global está lista para construirse — juntos.
                      </p>

                      <a
                        href="mailto:partnerships@startupfactoryhub.com"
                        className="mt-10 inline-flex items-center gap-4 px-8 py-5 rounded-2xl transition hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${NEON.cyan}25, ${NEON.magenta}25)`,
                          border: `1px solid ${NEON.cyan}80`,
                          boxShadow: `0 0 40px ${NEON.cyan}40, inset 0 0 20px ${NEON.cyan}10`,
                        }}
                      >
                        <Mail className="h-5 w-5" style={{ color: NEON.cyan }} />
                        <span className="text-base font-bold tracking-[0.18em] uppercase text-slate-900">Agenda una Presentación</span>
                        <ArrowUpRight className="h-5 w-5" style={{ color: NEON.cyan }} />
                      </a>

                      <div className="mt-12 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />CARACAS</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.magenta }} />SANTIAGO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.lime }} />TOKIO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.amber }} />SEVILLA</div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
                      <span className="text-slate-500">// startupfactoryhub.com</span>
                      <span style={{ color: NEON.cyan }}>FIN · TRANSMISIÓN</span>
                    </div>
                  </section>
                </A4Wrapper>
              </BookPage>
            </>
          );

          if (!flipbookSupported) {
            return (
              <div className="w-full max-w-[560px] md:max-w-[780px] mx-auto flex flex-col gap-4 sm:gap-6">
                {pages}
              </div>
            );
          }
          return (
            <HTMLFlipBook
              ref={bookRef}
              width={595}
              height={841}
              size="stretch"
              minWidth={300}
              maxWidth={700}
              minHeight={420}
              maxHeight={990}
              showCover={false}
              mobileScrollSupport={true}
              drawShadow={true}
              flippingTime={700}
              maxShadowOpacity={0.5}
              usePortrait={true}
              startPage={0}
              startZIndex={0}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={false}
              disableFlipByClick={false}
              className="mx-auto shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
              style={{}}
              onFlip={(e: any) => setCurrentPage(e.data)}
              onInit={(e: any) => setTotalPages(e.data?.pages ?? totalPages)}
            >
              {Children.toArray((pages as any).props.children)}
            </HTMLFlipBook>
          );
        })()}
      </div>
    </div>
  );
}
