import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, Children } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const BATCH_APPLY_URL = 'https://startupfactoryhub.com/auth?batch=accelerator';

import {
  Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail,
  Network, BarChart3, GraduationCap, Building2, Cpu, DollarSign,
  Handshake, MapPin, Brain, Briefcase, ShieldCheck, Sparkles,
  Globe2, Scan, Box, Eye, Smartphone, Zap, Orbit, ArrowUpRight,
  ChevronLeft, ChevronRight, CircuitBoard, Radio, Check,
  Play, Pause, Volume2, VolumeX, CircleDollarSign, Book, BookOpen,
  CalendarDays,
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
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
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

/* -------------------------------------------------------------
   Typographic scale for the COMMERCIAL MODEL (page 04)
   A single system of sizes / weights / tracking for the whole slide.
------------------------------------------------------------- */
const ct = (compact: boolean) => ({
  // mono uppercase labels (codes, kickers, units)
  eyebrow: { fontSize: compact ? 20 : 14, fontWeight: 700, letterSpacing: '0.28em', lineHeight: 1.35 },
  // row / header titles
  title: { fontSize: compact ? 28 : 19, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.01em' },
  // descriptive text
  body: { fontSize: compact ? 22 : 15.5, fontWeight: 500, lineHeight: 1.55 },
  // notes and secondary data
  meta: { fontSize: compact ? 20 : 14, fontWeight: 600, lineHeight: 1.45 },
  // line figures
  price: { fontSize: compact ? 44 : 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' },
  // per-line total chip
  chip: { fontSize: compact ? 19 : 13.5, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1.25 },
  // grand total
  grand: { fontSize: compact ? 60 : 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' },
});

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
    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.32em] uppercase pointer-events-none z-20">
      <div className="flex items-center gap-2" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span>SEC // {code}</span>
      </div>
      <div className="text-slate-500">{label}</div>
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, '0')} · 12</div>
    </div>

    {/* bottom hud bar */}
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-12 pb-4 pt-3"
      style={{ background: 'linear-gradient(180deg, rgba(238,242,248,0) 0%, rgba(238,242,248,0.92) 45%)' }}>
      <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
        <span className="text-slate-500 truncate">STARTUP FACTORY HUB · ACCELERATOR AS A SERVICE</span>
        <span className="shrink-0" style={{ color: accent }}>GLOBAL · REMOTE + ON-SITE</span>
      </div>
    </div>

    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full h-full flex flex-col"
        style={{ padding: '70px 50px 74px 50px' }}
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
    { i: Building2, l: 'Corporate HQ', tag: 'CLIENT·01' },
    { i: Globe2, l: 'Global Network', tag: 'CLIENT·02' },
    { i: Handshake, l: 'Commercial Channels', tag: 'CLIENT·03' },
    { i: ShieldCheck, l: 'Institutional Relationships', tag: 'CLIENT·04' },
    { i: Award, l: 'Brand Authority', tag: 'CLIENT·05' },
    { i: Users, l: 'Corporate Members', tag: 'CLIENT·06' },
    { i: MapPin, l: 'Intl. Delegations', tag: 'CLIENT·07' },
    { i: Briefcase, l: 'Executive Spaces', tag: 'CLIENT·08' },
    { i: Rocket, l: 'Accelerator', tag: 'SFH·01' },
    { i: Brain, l: 'AI Platform', tag: 'SFH·02' },
    { i: GraduationCap, l: 'Mentor Network', tag: 'SFH·03' },
    { i: DollarSign, l: 'Investment Operations', tag: 'SFH·04' },
    { i: Lightbulb, l: 'Corporate Innovation', tag: 'SFH·05' },
    { i: BarChart3, l: 'Executive Programs', tag: 'SFH·06' },
    { i: Cpu, l: 'Digital Infrastructure', tag: 'SFH·07' },
    { i: TrendingUp, l: 'Growth Engine', tag: 'SFH·08' },
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
                className="font-mono text-[16px] tracking-[0.3em] mt-1"
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
        className="absolute top-4 left-4 font-mono text-[16px] uppercase tracking-[0.3em]"
        style={{ color: '#3a5066' }}
      >
        ● LAVA · LIVE SYNTHESIS
      </div>
      <div
        className="absolute top-4 right-4 font-mono text-[16px] uppercase tracking-[0.3em] text-right"
        style={{ color: '#3a5066' }}
      >
        16 / 16 CAPABILITIES
        <br />
        <span style={{ color: accent, opacity: 0.85 }}>FUSED · ONE PLATFORM</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[17px] uppercase tracking-[0.3em]" style={{ color: '#56697f' }}>
        <span>CLIENT × SFH · FUSION CORE</span>
        <span>STATUS: FLUID · MOVE THE CURSOR</span>
      </div>
    </div>
  );
};


/* =========================================================================
   DEMO CREDENTIAL GRID — copyable role cards for the Digital Platform page
   ========================================================================= */
const DEMO_CREDS = [
  { role: 'Startup',  email: 'demo-startup@startupfactoryhub.com', color: '#0ea5b7' },
  { role: 'Investor', email: 'demo-investor@startupfactoryhub.com', color: '#3b82f6' },
  { role: 'Mentor',   email: 'demo-mentor@startupfactoryhub.com', color: '#8b5cf6' },
  { role: 'Advisor',  email: 'demo-advisor@startupfactoryhub.com', color: '#10b981' },
  { role: 'Student',  email: 'demo-student@startupfactoryhub.com', color: '#f59e0b' },
  { role: 'Member',   email: 'demo-member@startupfactoryhub.com', color: '#ec4899' },
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
          title={`Sign in as ${c.role}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-futuristic font-black text-xs uppercase tracking-[0.08em] truncate" style={{ color: c.color }}>{c.role}</span>
            <span className="font-mono text-[17px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap" style={{ background: `${c.color}20`, color: c.color }}>
              {isActive ? 'ACTIVE' : 'SIGN IN'}
            </span>
          </div>
          <span
            onClick={(e) => copy(c.email, `${c.role}-email`, e)}
            className="text-left font-mono text-xs text-slate-800 truncate transition-all hover:opacity-80"
            title="Click to copy the email"
          >
            {c.email}
          </span>
          <span
            onClick={(e) => copy(COMMON_PASSWORD, `${c.role}-pass`, e)}
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all hover:brightness-110"
            style={{ background: c.color, color: '#ffffff' }}
            title="Click to copy the password"
          >
            <span>PASS:</span>
            <span>{COMMON_PASSWORD}</span>
            {copied === `${c.role}-pass` ? <Check className="h-3 w-3" /> : null}
          </span>

          <span
            onClick={(e) => copy(`${c.email}\n${COMMON_PASSWORD}`, `${c.role}-all`, e)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy email + password"
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
              className="absolute bottom-2 right-3 font-mono text-[17px] uppercase tracking-wider"
              style={{ color: c.color }}
            >
              Copied
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
  const [loading, setLoading] = useState(true);
  const src = `/auth?demo=${role}&redirect=${encodeURIComponent('/dashboard?tab=social')}`;
  const selectRole = (r: string) => { setLoading(true); setRole(r); };

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
            <span className="font-mono text-sm uppercase tracking-[0.22em] font-bold text-slate-900">Demo Access Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[16px] uppercase tracking-[0.2em]" style={{ color: NEON.cyan }}>● CLICK A ROLE TO SIGN IN</span>
          </div>
        </div>
        <div className="p-5">
          <DemoCredentialGrid activeRole={role} onSelect={selectRole} />
        </div>
      </div>

      <GlassCard accent={NEON.cyan} padding="p-0" className="flex-1 overflow-hidden relative">
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[16px] uppercase tracking-[0.3em] pointer-events-none">
          <span style={{ color: NEON.cyan }}>● LIVE EMULATOR · SESSION {role.toUpperCase()}</span>
          <span className="text-slate-500">startupfactoryhub.com</span>
        </div>
        <div className="absolute inset-0 pt-8 p-2">
          <div className="relative w-full h-full">
            <iframe
              key={role}
              src={src}
              title={`Startup Factory Hub — live demo (${role})`}
              loading="lazy"
              onLoad={() => setLoading(false)}
              className="w-full h-full rounded-2xl bg-white"
              style={{ border: `1px solid ${NEON.cyan}40`, boxShadow: `0 0 40px ${NEON.cyan}30` }}
            />
            {loading && (
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(150deg, rgba(255,255,255,0.94) 0%, rgba(236,254,255,0.92) 100%)',
                  border: `1px solid ${NEON.cyan}40`,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="absolute inset-0 opacity-[0.35] pointer-events-none" style={{
                  backgroundImage: `linear-gradient(${NEON.cyan}22 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan}22 1px, transparent 1px)`,
                  backgroundSize: '38px 38px',
                }} />
                <div className="absolute left-0 right-0 h-24 pointer-events-none" style={{
                  background: `linear-gradient(180deg, transparent, ${NEON.cyan}25, transparent)`,
                  animation: 'bdv-emu-scan 2.4s linear infinite',
                }} />
                <div className="relative w-16 h-16">
                  <span className="absolute inset-0 rounded-full" style={{
                    border: `2px solid ${NEON.cyan}25`,
                  }} />
                  <span className="absolute inset-0 rounded-full" style={{
                    borderTop: `2px solid ${NEON.cyan}`,
                    borderRight: '2px solid transparent',
                    borderBottom: '2px solid transparent',
                    borderLeft: '2px solid transparent',
                    animation: 'bdv-emu-spin 0.9s linear infinite',
                    boxShadow: `0 0 18px ${NEON.cyan}80`,
                  }} />
                  <span className="absolute inset-3 rounded-full animate-pulse" style={{
                    background: `${NEON.cyan}22`,
                    boxShadow: `0 0 24px ${NEON.cyan}60 inset`,
                  }} />
                </div>
                <div className="relative text-center">
                  <div className="font-mono text-[13px] uppercase tracking-[0.34em] font-bold text-slate-900">
                    Initializing emulator
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.28em] mt-2" style={{ color: NEON.cyan }}>
                    Session {role.toUpperCase()} · connecting to startupfactoryhub.com
                  </div>
                </div>
                <div className="relative w-52 h-[3px] rounded-full overflow-hidden" style={{ background: `${NEON.cyan}22` }}>
                  <div className="h-full w-1/3 rounded-full" style={{
                    background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)`,
                    animation: 'bdv-emu-bar 1.35s ease-in-out infinite',
                  }} />
                </div>
                <style>{`
                  @keyframes bdv-emu-spin { to { transform: rotate(360deg) } }
                  @keyframes bdv-emu-bar { 0% { transform: translateX(-120%) } 100% { transform: translateX(320%) } }
                  @keyframes bdv-emu-scan { 0% { top: -20% } 100% { top: 110% } }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </>
  );
};


const PageTitle = ({ kicker, title, accent = NEON.cyan }: { kicker: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-5">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[16px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-futuristic font-black tracking-tight break-words" style={{
      fontSize: 'clamp(32px, 5vw, 46px)',
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
/* The flipbook now runs on every modern browser (desktop + touch).
   Desktop >= 1024px gets a real two-page book spread, smaller screens get
   a single-page portrait book with swipe support. */
const readFlipEnv = () => {
  if (typeof window === 'undefined') return { supported: true, spread: true, width: 1280, height: 900 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  return { supported: w >= 360 && !reduced, spread: w >= 1024, width: w, height: h };
};

const useFlipEnv = () => {
  const [env, setEnv] = useState(readFlipEnv);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setEnv((prev) => {
          const next = readFlipEnv();
          return prev.supported === next.supported &&
            prev.spread === next.spread &&
            Math.abs(prev.width - next.width) < 24 &&
            Math.abs(prev.height - next.height) < 24
            ? prev
            : next;
        });
      });
    };
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return env;
};


/* Compact mode: the A4 canvas is scaled down heavily on phones/tablets,
   so slides opt into a stacked layout with larger base type. */
const useCompactBrochure = () => {
  const [compact, setCompact] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return compact;
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
    <div ref={containerRef} className="w-full" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden', height: `${BASE_H * scale}px` }}>
      <div style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: 0,
        marginLeft: -(BASE_W / 2),
        transform: `scale(${scale})`, transformOrigin: 'top center',
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
export default function AcceleratorBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(12);
  const compact = useCompactBrochure();
  const [batchForm, setBatchForm] = useState({ founder: '', startup: '', email: '', phone: '', stage: '' });

  const submitBatchRequest = useCallback(() => {
    const { founder, startup, email, phone, stage } = batchForm;
    if (!founder.trim() || !startup.trim() || !email.trim()) {
      toast.error('Please fill in your name, company and email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }
    const body = [
      `Name: ${founder.trim()}`,
      `Company: ${startup.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim() || '—'}`,
      `Program type: ${stage.trim() || '—'}`,
      '',
      'We would like to engage Startup Factory Hub to operate our accelerator-as-a-service program.',
    ].join('\n');
    window.location.href = `mailto:info@startupfactoryhub.com?subject=${encodeURIComponent(
      `Accelerator Service Proposal — ${startup.trim()}`
    )}&body=${encodeURIComponent(body)}`;
    toast.success('Your request is ready to send from your email client.');
  }, [batchForm]);

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
    document.title = "Startup Factory Hub — Accelerator as a Service";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') flipPrev();
      else if (e.key === 'ArrowRight') flipNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipPrev, flipNext]);

  const flipEnv = useFlipEnv();
  const [spreadPref, setSpreadPref] = useState(true);
  const flipbookSupported = flipEnv.supported;
  const spread = flipEnv.spread && spreadPref;

  /* Fixed page geometry keeps react-pageflip from collapsing when the
     A4 slides re-measure (maps, iframes, 3D models). */
  const { pageW, pageH } = useMemo(() => {
    const chromeY = flipEnv.spread ? 150 : 120;
    const availH = Math.max(360, flipEnv.height - chromeY);
    const availW = Math.max(300, flipEnv.width - (flipEnv.spread ? 72 : 24));
    const ratio = BASE_H / BASE_W;
    let h = Math.min(availH, 1000);
    let w = h / ratio;
    const maxW = spread ? availW / 2 : availW;
    if (w > maxW) {
      w = maxW;
      h = w * ratio;
    }
    return { pageW: Math.floor(w), pageH: Math.floor(h) };
  }, [flipEnv.width, flipEnv.height, flipEnv.spread, spread]);


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
          <span className="hidden sm:inline">Home</span>
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
                : `${String(totalPages).padStart(2, '0')} pages`}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={flipNext} className="h-8 w-8 hover:bg-slate-900/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {flipEnv.spread && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSpreadPref((s) => !s)}
              aria-label={spread ? 'View single page' : 'View spread'}
              title={spread ? 'Single page view' : 'Spread view'}
              className="hidden lg:flex h-8 w-8 hover:bg-slate-900/5"
              style={{ color: spread ? NEON.cyan : 'rgba(15,23,42,0.45)' }}
            >
              {spread ? <BookOpen className="h-4 w-4" /> : <Book className="h-4 w-4" />}
            </Button>
          )}
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
          aria-label={audioPlaying ? 'Pause music' : 'Play music'}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-900/5"
          style={{ color: NEON.cyan }}
        >
          {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setAudioMuted((m) => !m)}
          aria-label={audioMuted ? 'Unmute' : 'Mute'}
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
        className={`min-h-screen flex justify-center ${
          flipbookSupported
            ? 'pt-14 sm:pt-16 pb-14 sm:pb-10 px-1.5 sm:px-4 items-center overflow-hidden'
            : 'pt-16 sm:pt-20 pb-20 sm:pb-12 px-3 sm:px-6 items-start lg:items-center'
        }`}

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
                    <div className="absolute top-8 left-10 right-10 flex items-center justify-between font-mono text-[16px] tracking-[0.4em] uppercase z-20">
                      <span style={{ color: NEON.cyan }}>// CONFIDENTIAL · ACCELERATOR SERVICE PROPOSAL</span>
                      <span style={{ color: NEON.magenta }}>2026 · GLOBAL · REMOTE + ON-SITE</span>
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
                        className="font-mono text-[16px] tracking-[0.5em] uppercase mb-6"
                        style={{ color: NEON.cyan, textShadow: `0 0 12px ${NEON.cyan}` }}
                      >
                        Your Organization  ×  Startup Factory Hub
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
                        ACCELERATOR<br />AS A<br />SERVICE
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
                        A next-generation innovation program where founders, capital, corporations and global commerce converge.
                      </motion.p>
                    </div>

                    {/* bottom hud */}
                    <div className="absolute bottom-8 left-10 right-10 z-20">
                      <div className="flex items-center justify-between font-mono text-[16px] tracking-[0.4em] uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 8px ${NEON.lime}` }} />
                          <span style={{ color: NEON.lime }}>SYSTEM · ONLINE</span>
                        </div>
                        <span style={{ color: NEON.cyan }}>SERVICE · PER BATCH</span>
                        <span style={{ color: NEON.magenta }}>VERSION · v1.0</span>
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
                    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.32em] uppercase z-20">
                      <div className="flex items-center gap-2" style={{ color: NEON.cyan }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                        <span>SEC // 01 · EDITION 01</span>
                      </div>
                      <div className="text-slate-500">INTRODUCTION · STARTUP FACTORY HUB</div>
                      <div style={{ color: NEON.cyan }}>P/02 · 12</div>
                    </div>

                    {/* Bottom HUD bar */}
                    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase z-20">
                      <span className="text-slate-900/35">// STARTUP FACTORY HUB · GLOBAL ACCELERATOR</span>
                      <span className="text-slate-900/35">GLOBAL · REMOTE + ON-SITE</span>
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
                          <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">
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
                          <span className="text-[16px] font-bold tracking-[0.32em] uppercase mb-5" style={{ color: NEON.cyan }}>
                            About Startup Factory Hub
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
                            The Operating System<br />
                            for the Next{' '}
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
                              Generation
                            </span>
                            <br />
                            of Founders.
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
                                Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI era — connecting{' '}
                                <span className="font-semibold text-slate-900">founders, investors, mentors, advisors, accelerators</span>{' '}
                                and <span className="font-semibold text-slate-900">students</span> through an integrated
                                AI-powered acceleration platform, strategic capital and a globally connected innovation network.
                              </p>
                              <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                                <p
                                  className="text-slate-900 italic font-medium leading-snug"
                                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}
                                >
                                  "Infrastructure is the new intellectual property. The platforms that accompany the founder's journey will define the future of innovation."
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
                              <span className="text-[16px] font-black tracking-[0.5em] text-white/40 uppercase whitespace-nowrap">
                                Infrastructure First
                              </span>
                            </div>

                            {/* Floating stat card */}
                            <div
                              className="absolute inset-x-5 bottom-5 p-4 sm:p-5 backdrop-blur-xl border"
                              style={{
                                background: 'rgba(2,6,23,0.88)',
                                borderColor: 'rgba(255,255,255,0.1)',
                              }}
                            >
                              <div className="text-[12px] sm:text-[13px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-3">
                                The Platform by the Numbers
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {[
                                  { v: '$200M+', l: 'Capital Raised', c: NEON.lime },
                                  { v: '40+', l: 'Startups Accelerated', c: NEON.cyan },
                                  { v: '350+', l: 'Network Members', c: NEON.magenta },
                                  { v: '04', l: 'Global Hubs', c: NEON.amber },
                                ].map((s, i) => (
                                  <div key={i} className="min-w-0">
                                    <div className="text-white font-extrabold mb-1 whitespace-nowrap" style={{ fontSize: '18px', lineHeight: 1 }}>
                                      {s.v}
                                    </div>
                                    <div className="h-[2px] w-6 mb-1.5" style={{ background: s.c }} />
                                    <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] text-slate-400 font-bold leading-tight">{s.l}</div>
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
                   PAGE 3 — THE OPPORTUNITY
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="03" label="OPPORTUNITY" pageNum={3}>
                    {/* ================= EDITORIAL FUTURISTA ================= */}
                    <div
                      className="relative flex-1 min-h-0 rounded-[26px] overflow-hidden border flex flex-col"
                      style={{
                        borderColor: `${NEON.cyan}45`,
                        background: 'linear-gradient(155deg, #050b16 0%, #08182a 45%, #04121b 100%)',
                        boxShadow: `0 24px 60px -24px ${NEON.cyan}66, inset 0 0 0 1px ${NEON.cyan}18`,
                      }}
                    >
                      {/* aurora + grid + scan */}
                      <div className="absolute inset-0 pointer-events-none bdv-aurora" style={{ background: `radial-gradient(60% 45% at 12% 0%, ${NEON.cyan}33 0%, transparent 65%), radial-gradient(55% 45% at 92% 100%, ${NEON.lime}2e 0%, transparent 65%), radial-gradient(45% 40% at 70% 12%, #38bdf82e 0%, transparent 70%)` }} />
                      <div className="absolute inset-0 pointer-events-none bdv-grid opacity-[0.18]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)`, backgroundSize: '44px 44px', maskImage: 'radial-gradient(85% 75% at 50% 35%, #000 30%, transparent 100%)' }} />
                      <div className="absolute inset-y-0 w-40 bdv-scan pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}1f, transparent)` }} />

                      <div className="relative z-10 flex flex-col h-full p-5 gap-3">

                        {/* ---- HEADLINE ROW ---- */}
                        <div className="flex items-start justify-between gap-5">
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] tracking-[0.42em] uppercase mb-1.5" style={{ color: NEON.cyan }}>03 · The Opportunity · Global</div>
                            <h2 className="font-display font-black text-white" style={{ fontSize: '34px', lineHeight: 1.04, textShadow: `0 0 30px ${NEON.cyan}55` }}>
                              Your organization has the talent and the scale.{' '}
                              <span style={{ color: NEON.cyan, textShadow: `0 0 26px ${NEON.cyan}` }}>It's missing the convergence.</span>
                            </h2>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex flex-col items-center justify-center w-[62px] h-[62px] rounded-full border-2 backdrop-blur-md" style={{ borderColor: `${NEON.cyan}90`, background: `${NEON.cyan}18`, boxShadow: `0 0 22px ${NEON.cyan}70` }}>
                              <Globe2 className="w-4 h-4" style={{ color: NEON.cyan }} />
                              <span className="font-futuristic font-black text-[12px] tracking-wider" style={{ color: NEON.cyan }}>YOU</span>
                            </div>
                            <span className="font-mono text-lg" style={{ color: `${NEON.cyan}90` }}>×</span>
                            <div className="flex items-center justify-center w-[62px] h-[62px] rounded-full border-2 backdrop-blur-md p-1.5" style={{ borderColor: `${NEON.lime}90`, background: `${NEON.lime}18`, boxShadow: `0 0 22px ${NEON.lime}70` }}>
                              <img src={sfhLogo} alt="Startup Factory Hub" className="w-full h-full object-contain" />
                            </div>
                          </div>
                        </div>

                        {/* ---- MAIN GRID ---- */}
                        <div className="grid gap-3 flex-1 min-h-0" style={{ gridTemplateColumns: '1.45fr 1fr' }}>

                          {/* LEFT COLUMN: COORDINATE CHART + AR MODEL */}
                          <div className="flex flex-col gap-2.5 min-h-0">

                            {/* MAPA — SEDE PRINCIPAL BANCO DE VENEZUELA */}
                            <motion.div
                              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                              className="relative rounded-2xl overflow-hidden border flex-1 min-h-0 bdv-tile"
                              style={{ borderColor: `${NEON.lime}55`, background: 'radial-gradient(70% 70% at 50% 45%, #0a2438 0%, #04101c 70%)', boxShadow: `inset 0 0 44px ${NEON.lime}12` }}
                            >
                              <div className="absolute inset-0" style={{ backgroundImage: `url(${visionHub.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(4,16,28,0.15) 0%, rgba(4,16,28,0.65) 100%)' }} />
                              <div className="absolute top-0 inset-x-0 h-[2px] z-10 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.lime}, #ffffffaa, ${NEON.cyan}, transparent)` }} />
                              <div className="absolute top-2 left-3 z-10 font-mono text-[9px] tracking-[0.3em] uppercase pointer-events-none" style={{ color: NEON.lime, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>Global Innovation Network</div>
                              <div className="absolute bottom-2 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
                                <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase truncate" style={{ color: '#eaf6ff', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>Global · Remote + On-Site</span>
                                <span className="font-mono text-[8.5px] px-2 py-0.5 rounded-full border shrink-0" style={{ color: NEON.cyan, borderColor: `${NEON.cyan}60`, background: 'rgba(3,16,26,0.75)' }}>360°</span>
                              </div>
                            </motion.div>

                          </div>


                          {/* METRIC STACK */}
                          <div className="grid grid-rows-4 gap-2.5 min-h-0">
                            {[
                              { v: '#1', c: NEON.cyan, i: Rocket, t: 'Category leader in your market', s: 'Strongest concentration of capital and enterprise activity in your sector', p: 100, d: [40, 55, 62, 78, 92, 100] },
                              { v: '5M+', c: NEON.lime, i: Users, t: 'Addressable talent pool', s: 'Deep density of university and technical talent across partner institutions', p: 88, d: [30, 44, 58, 66, 80, 88] },
                              { v: '4', c: '#38bdf8', i: Globe2, t: 'Time zones of advantage vs. Europe', s: 'Strategic connectivity across North America and Europe', p: 72, d: [22, 35, 48, 55, 64, 72] },
                              { v: '0', c: NEON.amber, i: Target, t: 'Centralized innovation destination', s: 'Until now — the gap we close together', p: 12, d: [4, 5, 7, 8, 10, 12] },
                            ].map((q, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                                className="relative rounded-2xl overflow-hidden border px-3.5 py-2.5 flex items-center gap-3 bdv-tile min-h-0"
                                style={{ borderColor: `${q.c}70`, background: `linear-gradient(120deg, ${q.c}22 0%, rgba(5,14,24,0.9) 60%)`, boxShadow: `0 10px 30px -20px ${q.c}` }}
                              >
                                <div className="absolute inset-y-0 w-1/2 bdv-sweep pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${q.c}1f, transparent)`, animationDelay: `${i * 0.6}s` }} />
                                <div className="relative z-10 flex flex-col items-center justify-center shrink-0" style={{ width: 62 }}>
                                  <q.i className="h-3.5 w-3.5 mb-0.5" style={{ color: q.c, filter: `drop-shadow(0 0 8px ${q.c})` }} />
                                  <div className="font-futuristic font-black leading-none" style={{ fontSize: '26px', color: q.c, textShadow: `0 0 20px ${q.c}` }}>{q.v}</div>
                                </div>
                                <div className="relative z-10 min-w-0 flex-1">
                                  <div className="text-white font-bold leading-tight" style={{ fontSize: '12.5px' }}>{q.t}</div>
                                  <div className="text-[9.5px] leading-snug mt-0.5" style={{ color: '#c6dcea' }}>{q.s}</div>
                                  <div className="mt-1.5 h-[3px] rounded-full overflow-hidden" style={{ background: `${q.c}25` }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${q.p}%` }} transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${q.c}, #ffffffcc)`, boxShadow: `0 0 8px ${q.c}` }} />
                                  </div>
                                </div>
                                <div className="relative z-10 w-[54px] h-[34px] shrink-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={q.d.map((v, k) => ({ k, v }))}>
                                      <Bar dataKey="v" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={1200}>
                                        {q.d.map((_, k) => <Cell key={k} fill={q.c} fillOpacity={0.35 + k * 0.11} />)}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* ---- TICKER ---- */}
                        <div className="relative overflow-hidden rounded-xl border shrink-0" style={{ borderColor: `${NEON.cyan}40`, background: 'rgba(4,12,22,0.7)' }}>
                          <div className="flex items-center gap-8 py-1.5 px-4 font-mono text-[9.5px] tracking-[0.3em] uppercase whitespace-nowrap" style={{ width: 'max-content', animation: 'bdv-ticker 26s linear infinite' }}>
                            {[...Array(2)].map((_, r) => (
                              <React.Fragment key={r}>
                                <span style={{ color: NEON.cyan }}>● LIVE</span>
                                <span style={{ color: NEON.lime }}>GLOBAL ENTERPRISE NETWORK</span>
                                <span style={{ color: '#38bdf8' }}>CONCENTRATED CAPITAL & DEMAND</span>
                                <span style={{ color: NEON.cyan }}>HIGH DENSITY OF TECHNICAL TALENT</span>
                                <span style={{ color: NEON.amber }}>CONNECTIVITY ACROSS THE AMERICAS · EUROPE · ASIA</span>
                                <span style={{ color: NEON.lime }}>GLOBAL DIASPORA AS A NETWORK</span>
                                <span style={{ color: '#38bdf8' }}>INNOVATION HUB · TO BE BUILT</span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                      <style>{`
                        @keyframes bdv-ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
                        @keyframes bdv-aurora-shift { 0%,100% { transform: translate3d(0,0,0) scale(1); opacity: .85 } 50% { transform: translate3d(-3%,2%,0) scale(1.08); opacity: 1 } }
                        @keyframes bdv-grid-drift { from { background-position: 0 0, 0 0 } to { background-position: 44px 44px, 44px 44px } }
                        @keyframes bdv-scan-move { 0% { transform: translateX(-60%) } 100% { transform: translateX(280%) } }
                        @keyframes bdv-stars-twinkle { 0%,100% { opacity: .35 } 50% { opacity: .85 } }
                        .bdv-aurora { animation: bdv-aurora-shift 12s ease-in-out infinite }
                        .bdv-grid { animation: bdv-grid-drift 14s linear infinite }
                        .bdv-scan { animation: bdv-scan-move 9s linear infinite }
                        .bdv-stars { animation: bdv-stars-twinkle 5s ease-in-out infinite }
                      `}</style>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>



              {/* ====================================================
                   PAGE 4 — JOINT VENTURE STRUCTURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="04" label="COMMERCIAL MODEL" pageNum={4}>
                    <PageTitle kicker="04 · Commercial Model" title={<>You drive the vision. We <span style={{ color: NEON.cyan }}>accelerate the impact</span>.</>} />

                    {/* ---------- FACTURA DE BATCH ---------- */}
                    <div className="relative flex-1 flex flex-col min-h-0 gap-4 rounded-3xl overflow-hidden p-5"
                      style={{
                        background: `linear-gradient(135deg, #064e3b 0%, #065f46 25%, #10b981 50%, #059669 75%, #022c22 100%)`,
                        border: `1px solid rgba(255,255,255,0.35)`,
                        boxShadow: `0 0 80px -20px rgba(16,185,129,0.55), inset 0 0 120px -50px rgba(255,255,255,0.15)`,
                      }}
                    >
                      {/* animated aurora backdrop */}
                      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: `radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(52,211,153,0.25) 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(16,185,129,0.2) 0%, transparent 60%)` }} />
                      <div className="absolute inset-0 pointer-events-none opacity-[0.18]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)`, backgroundSize: '46px 46px', maskImage: 'radial-gradient(80% 70% at 50% 30%, #000 30%, transparent 100%)' }} />
                      <motion.div
                        aria-hidden
                        className="absolute -top-32 -left-16 w-[520px] h-[520px] rounded-full pointer-events-none"
                        style={{ background: `radial-gradient(circle, rgba(52,211,153,0.35), transparent 68%)`, filter: 'blur(60px)' }}
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1], x: [0, 30, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        aria-hidden
                        className="absolute -bottom-40 -right-20 w-[560px] h-[560px] rounded-full pointer-events-none"
                        style={{ background: `radial-gradient(circle, rgba(16,185,129,0.35), transparent 68%)`, filter: 'blur(64px)' }}
                        animate={{ opacity: [0.25, 0.65, 0.25], scale: [1.1, 1, 1.1], x: [0, -20, 0] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <motion.div
                        aria-hidden
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
                        style={{ background: `radial-gradient(circle, rgba(110,231,183,0.28), transparent 65%)`, filter: 'blur(80px)' }}
                        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.08, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      {/* ---------- INVOICE HEADER ---------- */}
                      <div className={`relative z-10 shrink-0 rounded-2xl ${compact ? 'flex flex-col gap-4 px-6 py-5' : 'flex items-center justify-between px-6 py-4'}`}
                        style={{ background: 'rgba(2,44,34,0.72)', border: `1px solid rgba(255,255,255,0.35)`, backdropFilter: 'blur(10px)' }}>
                        <div className="flex items-center gap-5 min-w-0">
                          <div className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'h-20 w-20' : 'h-14 w-14'}`} style={{ background: `${NEON.lime}22`, border: `1px solid ${NEON.lime}` }}>
                            <Handshake className={compact ? 'w-10 h-10' : 'w-7 h-7'} style={{ color: NEON.lime, filter: `drop-shadow(0 0 8px ${NEON.lime})` }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono uppercase" style={{ color: NEON.lime, ...ct(compact).eyebrow }}>Accelerator Service Agreement</div>
                            <div className="text-white" style={{ ...ct(compact).title }}>Accelerator Batch · Startup Factory Hub</div>
                          </div>
                        </div>
                        <div className={`flex items-center shrink-0 ${compact ? 'gap-8' : 'gap-5'}`}>
                          <div className={compact ? 'text-left' : 'text-right'}>
                            <div className="font-mono uppercase" style={{ color: '#6ee7b7', ...ct(compact).eyebrow }}>Duration</div>
                            <div className="text-white" style={{ ...ct(compact).title }}>4 MONTHS</div>
                          </div>
                          <div className={compact ? 'h-14 w-[1px]' : 'h-10 w-[1px]'} style={{ background: `${NEON.lime}40` }} />
                          <div className={compact ? 'text-left' : 'text-right'}>
                            <div className="font-mono uppercase" style={{ color: '#6ee7b7', ...ct(compact).eyebrow }}>Minimum</div>
                            <div className="text-white" style={{ ...ct(compact).title }}>15 STARTUPS</div>
                          </div>
                        </div>
                      </div>

                      {/* ---------- INVOICE LINE ITEMS ---------- */}
                      <div className="relative z-10 flex-1 flex flex-col gap-3 min-h-0">
                        {[
                          {
                            code: 'LINE · 01',
                            t: 'Acceleration Batch',
                            price: '$3,500',
                            unit: 'per startup',
                            note: 'Minimum 15 startups · 4-month program',
                            desc: 'A full 4-month program with weekly mentorship, investment readiness and a Demo Day with your organization\'s network.',
                            total: '$52,500 / batch',
                            c: NEON.cyan,
                          },
                          {
                            code: 'LINE · 02',
                            t: 'Platform & License',
                            price: '$5,000',
                            unit: 'monthly',
                            note: 'Comprehensive software and services license',
                            desc: 'Investment and capital network, management and operations, AI tooling, Business Intelligence Engine and co-branding with your organization.',
                            total: '$20,000 / 4 months',
                            c: NEON.magenta,
                          },
                          {
                            code: 'LINE · 03',
                            t: 'Mentor Certification',
                            price: '$1,000',
                            unit: 'per course',
                            note: 'Official 10-hour training for your mentors',
                            desc: 'Official 10-hour mentorship curriculum, evaluation and digital credential, access to the SFH mentor network and program updates.',
                            total: 'Per certified mentor',
                            c: NEON.lime,
                          },
                        ].map((p, idx) => (
                          <motion.div
                            key={p.code}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 * idx }}
                            className={`relative rounded-2xl overflow-hidden flex-1 ${compact ? 'flex flex-col gap-2 px-6 py-4' : 'flex items-center gap-6 px-6 py-4'}`}
                            style={{
                              borderBottom: `1px solid ${p.c}40`,
                              background: 'transparent',
                            }}
                          >
                            {/* left: code + title + note */}
                            <div className={`min-w-0 ${compact ? 'w-full' : 'w-[190px] shrink-0'}`}>
                              <div className="font-mono uppercase" style={{ color: p.c, ...ct(compact).eyebrow }}>{p.code}</div>
                              <div className="text-white" style={{ ...ct(compact).title }}>{p.t}</div>
                              <div className="mt-0.5" style={{ color: '#ffffff', ...ct(compact).meta }}>{p.note}</div>
                            </div>

                            {/* middle: description text only */}
                            <div className={`min-w-0 ${compact ? 'w-full' : 'flex-1 px-4'}`}>
                              <p className="text-white" style={{ ...ct(compact).body }}>{p.desc}</p>
                            </div>

                            {/* right: price + total */}
                            <div className={compact ? 'w-full flex items-end justify-between gap-4 flex-wrap' : 'w-[150px] shrink-0 text-right'}>
                              <div>
                                <div className="font-futuristic" style={{ ...ct(compact).price, color: '#ffffff', textShadow: `0 0 20px ${p.c}` }}>{p.price}</div>
                                <div className="font-mono uppercase" style={{ color: p.c, ...ct(compact).eyebrow }}>{p.unit}</div>
                              </div>
                              <div className="mt-2 inline-block rounded-md px-3 py-1.5 uppercase" style={{ color: '#ffffff', background: `${p.c}22`, border: `1px solid ${p.c}60`, ...ct(compact).chip }}>{p.total}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* ---------- TOTAL BAR ---------- */}
                      <motion.div
                        className={`relative z-10 shrink-0 rounded-2xl overflow-hidden ${compact ? 'flex flex-col gap-3 px-6 py-5' : 'flex items-center justify-between px-6 py-4'}`}
                        style={{ border: `1.5px solid rgba(255,255,255,0.45)`, background: `linear-gradient(90deg, rgba(16,185,129,0.25), rgba(14,165,183,0.20))` }}
                        animate={{ boxShadow: [`0 0 22px -8px ${NEON.lime}`, `0 0 44px -6px ${NEON.lime}`, `0 0 22px -8px ${NEON.lime}`] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? 'h-16 w-16' : 'h-12 w-12'}`} style={{ background: `${NEON.lime}22`, border: `1px solid ${NEON.lime}` }}>
                            <CircleDollarSign className={compact ? 'w-8 h-8' : 'w-6 h-6'} style={{ color: NEON.lime, filter: `drop-shadow(0 0 8px ${NEON.lime})` }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono uppercase" style={{ color: NEON.lime, ...ct(compact).eyebrow }}>Base total per batch · 15 startups · 4 months</div>
                            <div className={`text-white ${compact ? '' : 'truncate'}`} style={{ ...ct(compact).meta }}>Includes acceleration, platform and 1 certification course</div>
                          </div>
                        </div>
                        <div className={compact ? 'flex items-end justify-between gap-4' : 'text-right shrink-0'}>
                          <div className="font-futuristic" style={{ ...ct(compact).grand, color: '#ffffff', textShadow: `0 0 24px ${NEON.lime}` }}>$72,500</div>
                          <div className="font-mono uppercase" style={{ color: NEON.lime, ...ct(compact).eyebrow }}>USD / batch</div>
                        </div>
                      </motion.div>

                    </div>


                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 5 — BDV CONTRIBUTION (timeline rail left → right)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="05" label="SFH CAPABILITIES" pageNum={5}>
                    <PageTitle kicker="05 · SFH Capabilities" title={<>Global platform. <span style={{ color: NEON.cyan }}>Proven execution.</span></>} />


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
                          { i: CalendarDays, t: 'Events Platform', b: 'Demo days, summits and hybrid events with registration, ticketing, live streaming and immersive rooms — operated end-to-end from the platform.' },
                          { i: Cpu, t: 'Open Source Technologies', b: 'A repository of 200+ open source and open code technologies ready for each startup to integrate, adapt and scale without license costs.' },
                          { i: Award, t: 'Credibility & Brand Authority', b: 'Presence on the Nasdaq Tower in Times Square, partnerships with NVIDIA Inception and VC funds that back every program and announcement.' },
                          { i: Building2, t: 'Offices Worldwide', b: 'Access to a global network of hubs and workspaces, enabling startups to land immediately in key markets.' },
                          { i: Handshake, t: 'International Trade Channels', b: 'Established trade routes and corporate relationships that open markets and customers beyond your home market.' },

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
                                <div className="text-[17px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
                              </div>
                              <div className="flex flex-col items-end gap-1 relative z-10">
                                <span className="font-mono text-[16px] tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>W/{String(idx + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[17px] tracking-[0.25em] text-slate-500">VECTOR</span>
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
                   PAGE 6 — SFH CONTRIBUTION (mirrored, magenta)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="06" label="SFH CONTRIBUTION" pageNum={6}>
                    <PageTitle kicker="06 · What SFH Brings" title={<>Entrepreneurial engine. <span style={{ color: NEON.magenta }}>Digital backbone.</span></>} accent={NEON.magenta} />

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
                          { i: Rocket, t: 'Accelerator Operations', b: 'End-to-end program design, batch management, founder support and results reporting.' },
                          { i: Brain, t: 'AI-Powered Digital Platform', b: 'A proprietary operating system for members, founders, mentors and investors. Live deal flow. Real intelligence.' },
                          { i: GraduationCap, t: 'Mentor & Expert Network', b: '150+ active mentors. 300+ investors. A directory of 1,500+ investors. A relationship-building machine.' },
                          { i: DollarSign, t: 'Investor & Capital Relationships', b: 'Curated capital pipelines and demo-day infrastructure tuned from Series A through growth stages.' },
                          { i: Sparkles, t: 'Marketing, Brand & Growth', b: 'Editorial content, events and global PR — already featured on the Nasdaq Tower, Times Square.' },
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
                                <span className="font-mono text-[16px] tracking-[0.3em] font-bold" style={{ color: NEON.magenta }}>S/{String(idx + 1).padStart(2, '0')}</span>
                                <span className="font-mono text-[17px] tracking-[0.25em] text-slate-500">MÓDULO</span>
                              </div>
                              <div className="flex-1 relative z-10">
                                <div className="text-[26px] font-black text-slate-900 leading-tight tracking-tight">{n.t}</div>
                                <div className="text-[17px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
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
                   PAGE 7 — CAPABILITY MATRIX (4×4)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="07" label="CAPABILITY MATRIX" pageNum={7}>
                    <PageTitle kicker="07 · Capability Matrix" title={<>16 combined capabilities. <span style={{ color: NEON.lime }}>One single platform.</span></>} accent={NEON.lime} />

                    <LavaCapabilityMatrix accent={NEON.lime} />
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 8 — DIGITAL PLATFORM
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="08" label="DIGITAL PLATFORM" pageNum={8}>
                    <PageTitle kicker="08 · Digital Platform" title={<>Try the <span style={{ color: NEON.cyan }}>Innovation Nexus</span> app live.</>} />

                    <DigitalPlatformDemo />


                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 9 — AR / IMMERSIVE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="09" label="AR · IMMERSIVE" pageNum={9}>
                    <PageTitle kicker="09 · Virtual & Augmented Reality" title={<><span style={{ color: NEON.magenta }}>VR events.</span> No borders.</>} accent={NEON.magenta} />

                    <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ border: `1px solid ${NEON.magenta}50` }}>
                      <img src={moonBackground.url} alt="Moon" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.82) 100%)` }} />
                      <MatrixLayer density={0.18} columns={30} tone="magenta" />

                      <div className="absolute inset-0 flex flex-col justify-between p-8">
                        <div className="flex justify-between items-start gap-6">
                          <GlassCard accent={NEON.magenta} padding="p-6" className="max-w-md">
                            <div className="flex items-center gap-3 mb-3">
                              <Scan className="h-6 w-6" style={{ color: NEON.magenta }} />
                              <span className="font-mono text-xs uppercase tracking-[0.35em] font-bold" style={{ color: NEON.magenta }}>VR · LIVE EVENTS</span>
                            </div>
                            <div className="text-base text-slate-900 leading-relaxed font-medium">
                              Our platform hosts any accelerator event in Virtual Reality: Demo Days, investor rounds, masterclasses and talent fairs in 3D venues with avatars, holographic stages and spatial networking. Attendees join from their browser or headset — no installs, no travel.
                            </div>

                          </GlassCard>
                          <div className="font-mono text-xs uppercase tracking-[0.3em] text-right text-slate-700 font-semibold">
                            <div>GLOBAL</div>
                            <div>REMOTE + ON-SITE</div>
                            <div className="mt-1.5 text-sm" style={{ color: NEON.magenta }}>● TRACKING</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-futuristic font-black leading-[0.95] mb-4" style={{ fontSize: '38px', color: '#ffffff', textShadow: `0 2px 18px rgba(0,0,0,0.85), 0 0 40px ${NEON.magenta}90` }}>
                            Every accelerator event,<br /><span style={{ color: '#f9a8d4' }}>an immersive experience.</span>
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
                              interaction-prompt="none"
                              auto-rotate
                              auto-rotate-delay="0"
                              rotation-per-second="20deg"
                              touch-action="none"
                              exposure="1"
                              shadow-intensity="1"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', zIndex: 10, cursor: 'grab', touchAction: 'none' }}
                            />
                            <a
                              href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(ROVER_GLB)}&mode=ar_preferred&title=NASA%20Perseverance%20Rover#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`}
                              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-[0.28em] font-bold"
                              style={{ background: NEON.cyan, color: '#0a1020', boxShadow: `0 0 24px ${NEON.cyan}` }}
                            >
                              <Smartphone className="h-4 w-4" /> Launch Google XR
                            </a>
                            <div className="absolute inset-0 pointer-events-none" style={{
                              background: `linear-gradient(135deg, ${NEON.cyan}20 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.5) 100%)`,
                              zIndex: 11,
                            }} />


                            {/* AR reticle / HUD */}
                            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12 }}>
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

                            <div className="absolute top-4 left-4 ml-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none" style={{
                              background: 'rgba(255,255,255,0.55)',
                              backdropFilter: 'blur(6px)',
                              border: `1px solid ${NEON.cyan}70`,
                              zIndex: 12,
                            }}>
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                              <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-900 font-bold">AR · SCANNING</span>
                            </div>
                            <div className="absolute top-4 right-4 mr-10 font-mono text-[16px] uppercase tracking-[0.28em] text-slate-800 text-right font-semibold pointer-events-none" style={{ zIndex: 12 }}>
                              <div>OBJ · NASA ROVER</div>
                              <div style={{ color: NEON.cyan }}>DIST 4.3M</div>
                            </div>
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between pointer-events-none" style={{ zIndex: 12 }}>

                              <div>
                                <div className="font-mono text-[16px] uppercase tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>// LIVE VIEW</div>
                                <div className="font-futuristic font-black leading-tight mt-1" style={{ ...PLATINUM_TITLE, fontSize: '16px', textShadow: `0 0 14px ${NEON.cyan}`, whiteSpace: 'nowrap' }}>
                                  Mars Rover · Scanning
                                </div>
                              </div>
                              <div className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-700 text-right font-semibold">
                                <div>LAT −4.5°  LON 137.4°</div>
                                <div style={{ color: NEON.magenta }}>● TRACKED</div>
                              </div>
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { i: Smartphone, l: 'VR Demo Day', s: '3D stage, no install required' },
                              { i: Box, l: 'Startup Pavilions', s: 'Navigable virtual booths' },
                              { i: Globe2, l: 'Global Audience', s: 'Investors joining from anywhere' },
                              { i: Sparkles, l: 'Holographic Speakers', s: 'Networking with avatars' },
                            ].map((p, i) => (

                              <GlassCard key={i} accent={NEON.magenta} padding="p-5" className="text-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${NEON.magenta}80, transparent 65%)` }} />
                                <div className="relative">
                                  <p.i className="h-7 w-7 mx-auto mb-2.5" style={{ color: NEON.magenta, filter: `drop-shadow(0 0 10px ${NEON.magenta})` }} />
                                  <div className="font-futuristic font-black text-base text-slate-900 leading-tight">{p.l}</div>
                                  <div className="font-mono text-[16px] uppercase tracking-[0.22em] text-slate-600 mt-1">{p.s}</div>
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
                   PAGE 10 — NASDAQ FEATURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="10" label="GLOBAL VISIBILITY" pageNum={10}>
                    <PageTitle kicker="10 · Nasdaq Tower · Times Square" title={<>On the <span style={{ color: NEON.lime }}>world stage.</span></>} />

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
                        <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-900">LIVE · TIMES SQUARE</span>
                      </motion.div>

                      {/* Bottom content panel */}
                      <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-7 pt-6">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                        >
                          <div className="font-mono text-[16px] uppercase tracking-[0.4em] mb-3" style={{ color: DEEP_LIME }}>// FEATURED</div>
                          <h3 className="font-futuristic font-black leading-[1.05] mb-3" style={{
                            fontSize: '34px',
                            ...PLATINUM_TITLE,
                            textShadow: 'none',
                          }}>
                            Startup Factory Hub<br />
                            <span style={{ color: DEEP_LIME, WebkitTextFillColor: DEEP_LIME }}>on the Nasdaq Tower</span>
                          </h3>
                          <p className="text-sm text-slate-800 leading-relaxed max-w-xl mb-4 font-medium">
                            Live broadcast in Times Square, New York — the ecosystem's brand projected on the Nasdaq Tower screen in front of millions.
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
                            { k: '350K+', l: 'Daily viewers' },
                            { k: 'NYC', l: 'Times Square' },
                            { k: 'Global', l: 'Media reach' },
                            { k: '24/7', l: 'Brand presence' },
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
                              <div className="font-mono text-[16px] uppercase tracking-[0.12em] text-slate-700 mt-1 leading-tight break-words">{m.l}</div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>

                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 11 — CTA · CONTRATA EL PROGRAMA (QR + FORMULARIO)
                  ==================================================== */}

              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="11" label="ENGAGE THE PROGRAM" pageNum={11}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 15% 10%, ${NEON.cyan}22, transparent 55%), radial-gradient(circle at 85% 90%, ${NEON.magenta}20, transparent 55%)` }} />

                    <div className="relative z-10 h-full flex flex-col px-10 pt-6 pb-8">
                      <PageTitle kicker="CALL TO ACTION" title={<>ENGAGE THE<br />ACCELERATOR PROGRAM</>} accent={NEON.cyan} />

                      <p className="mt-3 text-[17px] leading-snug text-slate-700 max-w-[430px]">
                        Your organization can engage Startup Factory Hub to operate its innovation program: <strong>4 months</strong>, a minimum of <strong>15 startups</strong>, and the full events, technology, mentorship and investment platform ready to execute.
                      </p>

                      <div className="mt-4 grid grid-cols-[190px_1fr] gap-4 flex-1 min-h-0">
                        {/* QR */}
                        <div className="rounded-2xl p-4 flex flex-col items-center justify-center text-center"
                          style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${NEON.cyan}55`, boxShadow: `0 0 30px ${NEON.cyan}25` }}>
                          <div className="font-mono text-[16px] uppercase tracking-[0.3em] mb-3" style={{ color: NEON.cyan }}>// SCAN TO GET IN TOUCH</div>
                          <div className="p-2 rounded-xl bg-white" style={{ border: `1px solid ${NEON.cyan}40` }}>
                            <QRCodeSVG value={BATCH_APPLY_URL} size={126} level="M" fgColor="#0b1220" bgColor="#ffffff" />
                          </div>
                          <div className="mt-3 font-mono text-[16px] tracking-[0.14em] text-slate-600 break-all leading-tight">info@startupfactoryhub.com</div>
                          <div className="mt-3 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)` }} />
                          <div className="mt-3 font-futuristic font-black text-[16px]" style={{ color: NEON.magenta }}>$3,500 / STARTUP</div>
                          <div className="font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500 mt-1">4 MONTHS · MIN. 15 STARTUPS</div>
                        </div>

                        {/* FORM */}
                        <div className="rounded-2xl p-5 flex flex-col min-h-0"
                          style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${NEON.magenta}45`, boxShadow: `0 0 30px ${NEON.magenta}20` }}>
                          <div className="font-mono text-[16px] uppercase tracking-[0.3em] mb-3" style={{ color: NEON.magenta }}>// SHORT FORM · GET IN TOUCH</div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { k: 'founder', label: 'Full name', ph: 'Jane Smith' },
                              { k: 'startup', label: 'Company / Organization', ph: 'Your Organization' },
                              { k: 'email', label: 'Email address', ph: 'name@yourcompany.com' },
                              { k: 'phone', label: 'Phone', ph: '+1 555 000 0000' },
                            ].map((f) => (
                              <div key={f.k} className="min-w-0">
                                <label className="font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500">{f.label}</label>
                                <input
                                  value={(batchForm as any)[f.k]}
                                  onChange={(e) => setBatchForm((p) => ({ ...p, [f.k]: e.target.value }))}
                                  placeholder={f.ph}
                                  maxLength={120}
                                  className="mt-1 w-full rounded-lg px-2.5 py-2 text-[16px] text-slate-900 bg-white outline-none focus:ring-2"
                                  style={{ border: `1px solid ${NEON.cyan}45` }}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="mt-3">
                            <label className="font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500">What type of program do you need? (optional)</label>
                            <input
                              value={batchForm.stage}
                              onChange={(e) => setBatchForm((p) => ({ ...p, stage: e.target.value }))}
                              placeholder="Acceleration · Corporate innovation · Events · Mentorship"
                              maxLength={160}
                              className="mt-1 w-full rounded-lg px-2.5 py-2 text-[16px] text-slate-900 bg-white outline-none focus:ring-2"
                              style={{ border: `1px solid ${NEON.cyan}45` }}
                            />
                          </div>

                          <button
                            onClick={submitBatchRequest}
                            className="mt-4 w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl transition hover:scale-[1.02]"
                            style={{
                              background: `linear-gradient(135deg, ${NEON.cyan}30, ${NEON.magenta}30)`,
                              border: `1px solid ${NEON.cyan}80`,
                              boxShadow: `0 0 26px ${NEON.cyan}35`,
                            }}
                          >
                            <Mail className="h-4 w-4" style={{ color: NEON.cyan }} />
                            <span className="text-[16px] font-bold tracking-[0.18em] uppercase text-slate-900">Send service proposal</span>
                            <ArrowUpRight className="h-4 w-4" style={{ color: NEON.magenta }} />
                          </button>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { n: '01', t: 'You reach out', d: 'QR or form' },
                              { n: '02', t: 'Proposal', d: 'Within 48 hours' },
                              { n: '03', t: 'You launch', d: '4-month batch' },
                            ].map((s) => (
                              <div key={s.n} className="rounded-lg px-2 py-2" style={{ background: `${NEON.cyan}0f`, border: `1px solid ${NEON.cyan}30` }}>
                                <div className="font-futuristic font-black text-[17px]" style={{ color: NEON.cyan }}>{s.n}</div>
                                <div className="text-[17px] font-bold text-slate-800 leading-tight">{s.t}</div>
                                <div className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-slate-500 leading-tight">{s.d}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-3 font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500">
                            info@startupfactoryhub.com · Global · Remote + On-Site
                          </div>
                        </div>
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 12 — CLOSING
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

                      <div className="font-mono text-[16px] uppercase tracking-[0.45em] mb-6" style={{ color: NEON.cyan }}>// TRANSMISIÓN DE CIERRE</div>

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
                        LET'S BUILD<br />THE FUTURE
                      </h1>

                      <div className="mt-6 h-[3px] w-[280px]" style={{
                        background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                        boxShadow: `0 0 20px ${NEON.cyan}`,
                      }} />

                      <p className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed">
                        Your organization's flagship innovation program is ready to be built — together.
                      </p>

                      <a
                        href="mailto:info@startupfactoryhub.com"
                        className="mt-10 inline-flex items-center gap-4 px-8 py-5 rounded-2xl transition hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${NEON.cyan}25, ${NEON.magenta}25)`,
                          border: `1px solid ${NEON.cyan}80`,
                          boxShadow: `0 0 40px ${NEON.cyan}40, inset 0 0 20px ${NEON.cyan}10`,
                        }}
                      >
                        <Mail className="h-5 w-5" style={{ color: NEON.cyan }} />
                        <span className="text-base font-bold tracking-[0.18em] uppercase text-slate-900">Book a Presentation</span>
                        <ArrowUpRight className="h-5 w-5" style={{ color: NEON.cyan }} />
                      </a>

                      <div className="mt-12 flex items-center gap-8 font-mono text-[16px] uppercase tracking-[0.35em] text-slate-500">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />ORLANDO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.magenta }} />SANTIAGO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.lime }} />TOKYO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.amber }} />SEVILLE</div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.4em] uppercase z-20">
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
            <div
              className="mx-auto"
              style={{ width: spread ? pageW * 2 : pageW, maxWidth: '100%', touchAction: 'pan-y' }}
            >
              <HTMLFlipBook
                key={`${spread ? 'spread' : 'single'}-${pageW}x${pageH}`}
                ref={bookRef}
                width={pageW}
                height={pageH}
                size="fixed"
                minWidth={280}
                maxWidth={900}
                minHeight={396}
                maxHeight={1280}
                showCover={false}
                mobileScrollSupport={true}
                drawShadow={spread}
                flippingTime={spread ? 650 : 450}
                maxShadowOpacity={spread ? 0.45 : 0.2}
                usePortrait={!spread}
                startPage={Math.min(currentPage, 14)}
                startZIndex={0}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={spread ? 30 : 18}
                showPageCorners={spread}
                disableFlipByClick={false}
                className="mx-auto"
                style={{ margin: '0 auto' }}
                onFlip={(e: any) => setCurrentPage(e.data)}
                onInit={(e: any) => setTotalPages(e.data?.pages ?? totalPages)}
              >
                {Children.toArray((pages as any).props.children)}
              </HTMLFlipBook>
            </div>
          );

        })()}
      </div>
    </div>
  );
}
