import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, Children, memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const BATCH_APPLY_URL = 'https://startupfactoryhub.com/cohorts/1b95239b-622b-4838-9b63-cfff2c54269e/apply';

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

import BrochureResourceMap from '@/components/brochure/BrochureResourceMap';

import GrowthSection from '@/components/brochure/GrowthSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  Tooltip,
  Cell,
} from 'recharts';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import mvpHeroLogo from '@/assets/sfh-logo-emblem.png';
import mvpHeroBg from '@/assets/mvp-program-bg.jpg';
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
import eventArtemisWatchParty from '@/assets/event-artemis-watch-party.png';
import eventVoyagerOsu from '@/assets/event-voyager-osu.jpg.asset.json';
import eventLaunchingOrlando from '@/assets/event-launching-orlando.jpg';
import eventLakeCounty from '@/assets/event-lake-county.jpg';
import eventPlugAndPlay from '@/assets/event-plug-and-play.jpg';
import nasaLogo from '@/assets/nasa-logo.png';
import nasaTechTransfer from '@/assets/nasa-tech-transfer.webp';
import nvidiaLogo from '@/assets/NVIDIA.jpeg';
import githubLogo from '@/assets/github-logo.png';
import { useNoFlipGuard, isTypingTarget } from '@/hooks/useNoFlipGuard';

/* =========================================================================
   NEON COLOR TOKENS — used throughout via inline style for max fidelity
   ========================================================================= */
const GROWTH_BENEFITS = [
  { id: 'pipeline', stage: 0, label: 'Innovation pipeline', line: 'Continuous access to vetted, buildable ventures.' },
  { id: 'brand', stage: 0, label: 'Brand equity', line: 'Positioned as the innovation anchor of your sector.' },
  { id: 'talent', stage: 1, label: 'Talent & culture', line: 'Teams exposed to startup velocity and modern tooling.' },
  { id: 'dealflow', stage: 2, label: 'Deal flow & optionality', line: 'Early sight of investable companies.' },
  { id: 'gravity', stage: 2, label: 'Ecosystem gravity', line: 'Mentors, investors and partners orbiting your name.' },
  { id: 'impact', stage: 3, label: 'Measurable impact', line: 'Ventures, jobs and capital mobilized — reported.' },
];

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
  eyebrow: { fontSize: compact ? 14 : 13, fontWeight: 700, letterSpacing: '0.18em', lineHeight: 1.3 },
  // row / header titles
  title: { fontSize: compact ? 20 : 18, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.01em' },
  // descriptive text
  body: { fontSize: compact ? 15 : 15, fontWeight: 500, lineHeight: 1.5 },
  // notes and secondary data
  meta: { fontSize: compact ? 14 : 13.5, fontWeight: 600, lineHeight: 1.4 },

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
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, "0")} · 13</div>
    </div>

    {/* bottom hud bar */}
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-12 pb-4 pt-3"
      style={{ background: 'linear-gradient(180deg, rgba(238,242,248,0) 0%, rgba(238,242,248,0.92) 45%)' }}>
      <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
        <span className="text-slate-500 truncate">STARTUP FACTORY HUB · MVP DEVELOPMENT PROGRAM</span>
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
    { i: Building2, l: 'Corporate HQ', tag: 'SFH·01' },
    { i: Globe2, l: 'Global Network', tag: 'SFH·02' },
    { i: Handshake, l: 'Commercial Channels', tag: 'SFH·03' },
    { i: ShieldCheck, l: 'Institutional Relationships', tag: 'SFH·04' },
    { i: Award, l: 'Brand Authority', tag: 'SFH·05' },
    { i: Users, l: 'Corporate Members', tag: 'SFH·06' },
    { i: MapPin, l: 'Intl. Delegations', tag: 'SFH·07' },
    { i: Briefcase, l: 'Executive Spaces', tag: 'SFH·08' },
    { i: Rocket, l: 'Accelerator', tag: 'SFH·09' },
    { i: Brain, l: 'AI Platform', tag: 'SFH·10' },
    { i: GraduationCap, l: 'Mentor Network', tag: 'SFH·11' },
    { i: DollarSign, l: 'Investment Operations', tag: 'SFH·12' },
    { i: Lightbulb, l: 'Corporate Innovation', tag: 'SFH·13' },
    { i: BarChart3, l: 'Executive Programs', tag: 'SFH·14' },
    { i: Cpu, l: 'Digital Infrastructure', tag: 'SFH·15' },
    { i: TrendingUp, l: 'Growth Engine', tag: 'SFH·16' },
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
        <span>SFH · FUSION CORE</span>
        <span>STATUS: FLUID · MOVE THE CURSOR</span>
      </div>
    </div>
  );
};


/* =========================================================================
   DEMO CREDENTIAL GRID — copyable role cards for the Digital Platform page
   ========================================================================= */
const DEMO_CREDS = [
  { id: 'startup',    label: 'Startup',  email: 'demo-startup@startupfactoryhub.com', color: '#0ea5b7' },
  { id: 'investor',   label: 'Investor', email: 'demo-investor@startupfactoryhub.com', color: '#3b82f6' },
  { id: 'mentor',     label: 'Mentor',   email: 'demo-mentor@startupfactoryhub.com', color: '#8b5cf6' },
  { id: 'advisor',    label: 'Advisor',  email: 'demo-advisor@startupfactoryhub.com', color: '#10b981' },
  { id: 'student',    label: 'Student',  email: 'demo-student@startupfactoryhub.com', color: '#f59e0b' },
  { id: 'accelerator', label: 'Accelerator (Partners)', email: 'demo-accelerator@startupfactoryhub.com', color: '#f43f5e' },
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
        const isActive = activeRole === c.id;
        return (
        <button
          type="button"
          key={c.id}
          onClick={() => onSelect?.(c.id)}
          className="relative rounded-xl p-4 flex flex-col gap-2 group text-left cursor-pointer transition-transform hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)',
            border: `1px solid ${c.color}${isActive ? 'cc' : '45'}`,
            boxShadow: isActive
              ? `0 10px 30px -8px rgba(15,23,42,0.18), 0 0 0 2px ${c.color}aa inset, 0 0 36px ${c.color}55`
              : `0 8px 24px -8px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 0 20px ${c.color}18`,
          }}
          title={`Sign in as ${c.label}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-futuristic font-black text-xs uppercase tracking-[0.08em] truncate" style={{ color: c.color }}>{c.label}</span>
            <span className="font-mono text-[17px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap" style={{ background: `${c.color}20`, color: c.color }}>
              {isActive ? 'ACTIVE' : 'SIGN IN'}
            </span>
          </div>
          <span
            onClick={(e) => copy(c.email, `${c.id}-email`, e)}
            className="text-left font-mono text-xs text-slate-800 truncate transition-all hover:opacity-80"
            title="Click to copy the email"
          >
            {c.email}
          </span>
          <span
            onClick={(e) => copy(COMMON_PASSWORD, `${c.id}-pass`, e)}
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all hover:brightness-110"
            style={{ background: c.color, color: '#ffffff' }}
            title="Click to copy the password"
          >
            <span>PASS:</span>
            <span>{COMMON_PASSWORD}</span>
            {copied === `${c.id}-pass` ? <Check className="h-3 w-3" /> : null}
          </span>

          <span
            onClick={(e) => copy(`${c.email}\n${COMMON_PASSWORD}`, `${c.id}-all`, e)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy email + password"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}18`, border: `1px solid ${c.color}40` }}>
              {copied === `${c.id}-all` ? (
                <Check className="h-3.5 w-3.5" style={{ color: c.color }} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              )}
            </div>
          </span>

          {copied && (copied === `${c.id}-email` || copied === `${c.id}-pass` || copied === `${c.id}-all`) && (
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
/* Self-contained so typing never re-renders (and never re-mounts) the flipbook. */
const BatchRequestForm = memo(() => {
  const [form, setForm] = useState({ founder: '', startup: '', email: '', phone: '', stage: '' });

  const submit = useCallback(() => {
    const { founder, startup, email, phone, stage } = form;
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
      'We would like to join the Startup Factory Hub MVP Development Program.',
    ].join('\n');
    window.location.href = `mailto:info@startupfactoryhub.com?subject=${encodeURIComponent(
      `MVP Program Application — ${startup.trim()}`
    )}&body=${encodeURIComponent(body)}`;
    toast.success('Your request is ready to send from your email client.');
  }, [form]);

  return (
    <div data-no-flip>
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
              value={(form as any)[f.k]}
              onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))}
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
          value={form.stage}
          onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
          placeholder="Acceleration · Corporate innovation · Events · Mentorship"
          maxLength={160}
          className="mt-1 w-full rounded-lg px-2.5 py-2 text-[16px] text-slate-900 bg-white outline-none focus:ring-2"
          style={{ border: `1px solid ${NEON.cyan}45` }}
        />
      </div>

      <button
        onClick={submit}
        className="mt-4 w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl transition hover:scale-[1.02]"
        style={{
          background: `linear-gradient(135deg, ${NEON.cyan}30, ${NEON.magenta}30)`,
          border: `1px solid ${NEON.cyan}80`,
          boxShadow: `0 0 26px ${NEON.cyan}35`,
        }}
      >
        <Mail className="h-4 w-4" style={{ color: NEON.cyan }} />
        <span className="text-[16px] font-bold tracking-[0.18em] uppercase text-slate-900">Apply to the MVP Batch</span>
        <ArrowUpRight className="h-4 w-4" style={{ color: NEON.magenta }} />
      </button>
    </div>
  );
});
BatchRequestForm.displayName = 'BatchRequestForm';


/* =========================================================================
   MVP PROGRAM — 4 WEEK AGENDA SLIDES
   ========================================================================= */
const MVP_ACCENT = '#10b981';

type WeekSpec = {
  code: string;
  week: string;
  title: string;
  lead: string;
  accent: string;
  days: { d: string; t: string; s: string }[];
  outputs: string[];
  metric: { k: string; v: string }[];
};

const MVP_WEEKS: WeekSpec[] = [
  {
    code: '07', week: 'WEEK 01', title: 'Foundations & Scope', accent: '#10b981',
    lead: 'We compress discovery into five days: problem, user, scope and architecture are locked before a single line of production code is written.',
    days: [
      { d: 'DAY 1', t: 'Kickoff & onboarding', s: 'Platform access, build squad assignment, program rituals.' },
      { d: 'DAY 2', t: 'Problem validation', s: 'Customer interviews, pain mapping, assumption backlog.' },
      { d: 'DAY 3', t: 'MVP scope lock', s: 'Feature cut-line, must-have vs. later, success criteria.' },
      { d: 'DAY 4', t: 'Architecture & stack', s: 'Data model, integrations, security and infrastructure plan.' },
      { d: 'DAY 5', t: 'Design system', s: 'Brand tokens, key screens, clickable flow of the product.' },
    ],
    outputs: ['Validated problem statement', 'Locked MVP scope document', 'Technical architecture', 'Clickable prototype'],
    metric: [{ k: 'Interviews', v: '10+' }, { k: 'Scope', v: 'Locked' }, { k: 'Squad', v: 'Assigned' }],
  },
  {
    code: '08', week: 'WEEK 02', title: 'Core Build Sprint', accent: '#0ea5b7',
    lead: 'The engine gets built. Auth, data, core flows and the first deployable version of your product go live on a production-grade stack.',
    days: [
      { d: 'DAY 6', t: 'Foundation code', s: 'Repo, CI, environments, database schema and auth.' },
      { d: 'DAY 7', t: 'Core flow #1', s: 'The primary job-to-be-done shipped end to end.' },
      { d: 'DAY 8', t: 'Core flow #2', s: 'Secondary flows, roles, permissions and state.' },
      { d: 'DAY 9', t: 'Mentor checkpoint', s: '1:1 operator review of build velocity and product logic.' },
      { d: 'DAY 10', t: 'Internal release', s: 'First deployed build on a live URL for the team.' },
    ],
    outputs: ['Deployed staging build', 'Authentication & database', 'Two core product flows', 'Weekly shipping cadence'],
    metric: [{ k: 'Deploys', v: 'Daily' }, { k: 'Flows live', v: '2' }, { k: 'Mentor 1:1', v: '1' }],
  },
  {
    code: '09', week: 'WEEK 03', title: 'Integrate, Test & Validate', accent: '#7c3aed',
    lead: 'AI capabilities, integrations and telemetry go in — then real users touch the product and the data starts telling the story.',
    days: [
      { d: 'DAY 11', t: 'AI & automation layer', s: 'Genius AI tooling, workflows and intelligent features.' },
      { d: 'DAY 12', t: 'Integrations', s: 'Payments, email, analytics and third-party services.' },
      { d: 'DAY 13', t: 'QA hardening', s: 'Security review, edge cases, performance and mobile.' },
      { d: 'DAY 14', t: 'Beta cohort', s: 'Real users onboarded, guided sessions, feedback capture.' },
      { d: 'DAY 15', t: 'Telemetry review', s: 'Activation, retention and funnel instrumentation reviewed.' },
    ],
    outputs: ['AI features shipped', 'Payments & integrations live', 'Beta user feedback loop', 'Product analytics dashboard'],
    metric: [{ k: 'Beta users', v: 'Live' }, { k: 'Integrations', v: 'Wired' }, { k: 'Telemetry', v: 'On' }],
  },
  {
    code: '10', week: 'WEEK 04', title: 'Launch & Demo Day', accent: '#1f2a44',
    lead: 'Polish, launch and pitch. You leave with a functional product in production, a data room and a stage in front of investors.',
    days: [
      { d: 'DAY 16', t: 'Polish & performance', s: 'Design refinement, copy, speed and accessibility.' },
      { d: 'DAY 17', t: 'Production launch', s: 'Domain, monitoring, support and go-live checklist.' },
      { d: 'DAY 18', t: 'Investor materials', s: 'Deck, financial model, cap table and data room.' },
      { d: 'DAY 19', t: 'Pitch rehearsal', s: 'Narrative coaching and live demo run-throughs.' },
      { d: 'DAY 20', t: 'Demo Day', s: 'Pitch to investors, corporates and the SFH network.' },
    ],
    outputs: ['Product live in production', 'Investor data room', 'Pitch deck & narrative', 'Demo Day exposure'],
    metric: [{ k: 'Status', v: 'Launched' }, { k: 'Data room', v: 'Ready' }, { k: 'Demo Day', v: 'Stage' }],
  },
];

const WeekAgendaSlide = ({ spec }: { spec: WeekSpec }) => (
  <PageFrame accent={spec.accent} code={spec.code} label={`${spec.week} · AGENDA`} pageNum={Number(spec.code)}>
    <PageTitle
      kicker={`${spec.week} · MVP Program`}
      title={<>{spec.title.split(' ')[0]} <span style={{ color: spec.accent }}>{spec.title.split(' ').slice(1).join(' ')}</span></>}
      accent={spec.accent}
    />

    <p className="text-[15px] leading-relaxed text-slate-600 max-w-3xl -mt-2 mb-3">{spec.lead}</p>

    <div className="flex-1 min-h-0 grid grid-cols-[1.55fr_1fr] gap-4">
      {/* day rail */}
      <div className="relative flex flex-col gap-2 min-h-0">
        <div
          className="absolute left-[74px] top-2 bottom-2 w-[2px]"
          style={{ background: `linear-gradient(180deg, transparent, ${spec.accent}, transparent)`, boxShadow: `0 0 14px ${spec.accent}80` }}
        />
        {spec.days.map((d, i) => (
          <motion.div
            key={d.d}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="relative flex items-start gap-3 rounded-xl px-3 py-2.5 flex-1 min-h-0"
            style={{ background: 'rgba(255,255,255,0.78)', border: `1px solid ${spec.accent}26`, boxShadow: `0 6px 22px -18px ${spec.accent}` }}
          >
            <span
              className="font-mono text-[11px] font-bold tracking-[0.14em] shrink-0 w-[58px] text-right pt-[3px]"
              style={{ color: spec.accent }}
            >
              {d.d}
            </span>
            <span className="relative z-10 mt-[6px] h-2.5 w-2.5 rounded-full shrink-0" style={{ background: spec.accent, boxShadow: `0 0 12px ${spec.accent}` }} />
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-slate-900 leading-tight">{d.t}</span>
              <span className="block text-[13.5px] leading-snug text-slate-600">{d.s}</span>
            </span>
          </motion.div>
        ))}
      </div>

      {/* outputs + metrics */}
      <div className="flex flex-col gap-3 min-h-0">
        <div className="rounded-2xl p-4 flex-1 min-h-0" style={{ background: `linear-gradient(150deg, ${spec.accent}14, rgba(255,255,255,0.9))`, border: `1px solid ${spec.accent}33` }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] font-bold" style={{ color: spec.accent }}>Deliverables</span>
          <div className="mt-3 flex flex-col gap-2.5">
            {spec.outputs.map((o) => (
              <div key={o} className="flex items-start gap-2">
                <Check className="h-4 w-4 mt-[2px] shrink-0" style={{ color: spec.accent }} />
                <span className="text-[14px] leading-snug text-slate-700">{o}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 shrink-0">
          {spec.metric.map((m) => (
            <div key={m.k} className="rounded-xl px-2 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${spec.accent}2e` }}>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{m.k}</span>
              <span className="block text-[15px] font-black mt-0.5" style={{ color: spec.accent }}>{m.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PageFrame>
);

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function MVPBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  useNoFlipGuard();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(13);
  const compact = useCompactBrochure();


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
    document.title = "Startup Factory Hub — MVP Development Program";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;
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
                  <section
                    className="absolute inset-0 overflow-hidden"
                    style={{ background: 'radial-gradient(120% 90% at 78% 12%, #0a2033 0%, #061426 38%, #03070f 100%)' }}
                  >
                    <style>{`
                      @keyframes mvp-trace { 0% { stroke-dashoffset: 600; } 100% { stroke-dashoffset: 0; } }
                      @keyframes mvp-node { 0%,100% { opacity:.2; transform: scale(.8);} 50% { opacity:1; transform: scale(1.25);} }
                      @keyframes mvp-orbit { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
                      @keyframes mvp-orbit-rev { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
                      @keyframes mvp-scan { 0% { transform: translateY(-12%); opacity:0;} 12% { opacity:.85;} 88% { opacity:.85;} 100% { transform: translateY(1000%); opacity:0;} }
                      @keyframes mvp-drift { 0%,100% { transform: translate3d(0,0,0);} 50% { transform: translate3d(0,-14px,0);} }
                      @keyframes mvp-sheen { 0% { background-position: -120% 0; } 100% { background-position: 220% 0; } }
                    `}</style>

                    {/* photographic plate, heavily graded */}
                    <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.28]" style={{ backgroundImage: `url(${mvpHeroBg})`, filter: 'saturate(1.3) contrast(1.1)' }} />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(105deg, rgba(2,7,14,0.97) 0%, rgba(3,11,22,0.9) 42%, rgba(4,18,32,0.72) 72%, rgba(2,8,16,0.94) 100%)',
                      }}
                    />

                    {/* fine engineering grid */}
                    <div
                      className="pointer-events-none absolute inset-0 opacity-90"
                      style={{
                        backgroundImage:
                          'linear-gradient(rgba(20,184,166,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.05) 1px, transparent 1px), linear-gradient(rgba(34,211,238,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.09) 1px, transparent 1px)',
                        backgroundSize: '26px 26px, 26px 26px, 130px 130px, 130px 130px',
                        maskImage: 'radial-gradient(120% 90% at 70% 20%, #000 20%, transparent 85%)',
                        WebkitMaskImage: 'radial-gradient(120% 90% at 70% 20%, #000 20%, transparent 85%)',
                      }}
                    />

                    {/* orbital system, right side */}
                    <div className="pointer-events-none absolute right-[-140px] top-1/2 -translate-y-1/2" style={{ animation: 'mvp-drift 11s ease-in-out infinite' }}>
                      <div className="relative h-[560px] w-[560px]">
                        {[
                          { s: 560, o: 0.22, d: '46s', rev: false },
                          { s: 430, o: 0.3, d: '34s', rev: true },
                          { s: 300, o: 0.4, d: '24s', rev: false },
                        ].map((r) => (
                          <div
                            key={r.s}
                            className="absolute left-1/2 top-1/2 rounded-full"
                            style={{
                              width: r.s, height: r.s, marginLeft: -r.s / 2, marginTop: -r.s / 2,
                              border: `1px solid rgba(34,211,238,${r.o})`,
                              boxShadow: `inset 0 0 60px rgba(20,184,166,${r.o * 0.25})`,
                              animation: `${r.rev ? 'mvp-orbit-rev' : 'mvp-orbit'} ${r.d} linear infinite`,
                            }}
                          >
                            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                              style={{ background: '#22d3ee', boxShadow: '0 0 14px #22d3ee' }} />
                          </div>
                        ))}
                        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
                          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.45), transparent 70%)' }} />
                      </div>
                    </div>

                    {/* circuit traces */}
                    <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1200 1600" aria-hidden>
                      {['M0,220 L300,220 L420,340 L420,900', 'M0,980 L200,980 L340,1120 L1200,1120', 'M120,1600 L120,1240 L260,1100', 'M1200,300 L900,300 L780,420 L780,760'].map((d, i) => (
                        <path key={d} d={d} stroke="rgba(34,211,238,0.28)" strokeWidth="1.1" fill="none" strokeDasharray="8 16"
                          style={{ animation: `mvp-trace ${16 + i * 4}s linear infinite` }} />
                      ))}
                      {[[420, 340], [340, 1120], [780, 420], [120, 1240]].map(([cx, cy], i) => (
                        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill={i % 2 ? '#22d3ee' : '#14b8a6'}
                          style={{ animation: `mvp-node ${3 + i * 0.7}s ease-in-out infinite` }} />
                      ))}
                    </svg>

                    {/* scanning beam */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[8%]"
                      style={{ background: 'linear-gradient(180deg, transparent, rgba(34,211,238,0.10), transparent)', animation: 'mvp-scan 9s linear infinite' }} />

                    <div className="pointer-events-none absolute left-0 right-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg,#14b8a6,#22d3ee,#818cf8,#14b8a6)' }} />
                    <div className="pointer-events-none absolute -left-40 top-[18%] h-96 w-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(20,184,166,0.22),transparent 70%)' }} />
                    <div className="pointer-events-none absolute -right-32 bottom-[6%] h-[26rem] w-[26rem] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(129,140,248,0.22),transparent 70%)' }} />

                    {/* corner brackets */}
                    <span aria-hidden className="pointer-events-none absolute left-7 top-7 h-14 w-14 border-l border-t" style={{ borderColor: 'rgba(34,211,238,0.55)' }} />
                    <span aria-hidden className="pointer-events-none absolute right-7 top-7 h-14 w-14 border-r border-t" style={{ borderColor: 'rgba(34,211,238,0.55)' }} />
                    <span aria-hidden className="pointer-events-none absolute bottom-7 left-7 h-14 w-14 border-b border-l" style={{ borderColor: 'rgba(34,211,238,0.55)' }} />
                    <span aria-hidden className="pointer-events-none absolute bottom-7 right-7 h-14 w-14 border-b border-r" style={{ borderColor: 'rgba(34,211,238,0.55)' }} />

                    {/* top hud strip */}
                    <div className="absolute top-14 left-14 right-14 flex items-center justify-between font-mono text-[11px] tracking-[0.34em] uppercase z-20">
                      <span className="flex items-center gap-3" style={{ color: '#14b8a6' }}>
                        <img src={mvpHeroLogo} alt="Startup Factory Hub" className="h-9 w-9 rounded-full object-contain ring-1 ring-teal-400/50" />
                        MVP Development Program
                      </span>
                      <span style={{ color: '#818cf8' }}>2026 · Remote · Worldwide</span>
                    </div>

                    {/* editorial left-aligned stack */}
                    <div className="absolute inset-0 z-10 flex flex-col justify-center px-16">
                      <div className="max-w-[78%]">
                        <span
                          className="inline-flex items-center gap-2 rounded-sm px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.3em]"
                          style={{
                            color: '#5eead4',
                            border: '1px solid rgba(20,184,166,0.45)',
                            background: 'linear-gradient(90deg, rgba(20,184,166,0.18), transparent)',
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
                          Startup Factory Hub · 4-Week Build Sprint
                        </span>

                        <h1 className="mt-9 font-black uppercase leading-[0.86] tracking-tight">
                          <span className="block text-[26px] font-light tracking-[0.34em] text-white/55">Launch your</span>
                          <span
                            className="block"
                            style={{
                              fontSize: 'clamp(88px, 13vw, 168px)',
                              lineHeight: 0.82,
                              backgroundImage: 'linear-gradient(100deg,#5eead4 0%,#22d3ee 38%,#818cf8 72%,#f0abfc 100%)',
                              backgroundSize: '200% 100%',
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              color: 'transparent',
                              filter: 'drop-shadow(0 0 40px rgba(34,211,238,0.45))',
                              animation: 'mvp-sheen 8s linear infinite',
                            }}
                          >
                            MVP
                          </span>
                          <span className="mt-3 block text-[30px] font-light tracking-[0.12em] text-white/85">Software Startup</span>
                        </h1>

                        <div className="mt-9 flex items-center gap-4">
                          <span className="h-px w-24" style={{ background: 'linear-gradient(90deg,#14b8a6,transparent)' }} />
                          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-300/70">State-of-the-art engineering</span>
                        </div>

                        <p className="mt-7 max-w-xl text-[17px] leading-relaxed" style={{ color: 'rgba(94,234,212,0.92)' }}>
                          Functionally complete MVP software — architected, built, validated and launched in four weeks.
                        </p>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
                          An intensive build sprint with senior engineering, mentorship, investor access and a global distribution mesh deployed around your team.
                        </p>

                        {/* spec readouts */}
                        <div className="mt-11 grid max-w-2xl grid-cols-4 gap-px overflow-hidden rounded-sm" style={{ background: 'rgba(34,211,238,0.18)' }}>
                          {[
                            ['04', 'Weeks'],
                            ['$5K', 'Program cost'],
                            ['1:1', 'Mentorship'],
                            ['∞', 'Global reach'],
                          ].map(([v, l]) => (
                            <div key={l} className="px-4 py-4" style={{ background: 'rgba(3,12,22,0.88)' }}>
                              <div className="font-black text-2xl leading-none" style={{ color: '#22d3ee' }}>{v}</div>
                              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/45">{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* bottom hud */}
                    <div className="absolute bottom-14 left-14 right-14 z-20">
                      <div className="mb-4 h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.5), rgba(129,140,248,0.35), transparent)' }} />
                      <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.3em] uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
                          <span style={{ color: '#22d3ee' }}>Applications Open</span>
                        </div>
                        <span style={{ color: '#14b8a6' }}>Build · Validate · Launch</span>
                        <span style={{ color: '#818cf8' }}>startupfactoryhub.com</span>
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
                            {/* City / hub imagery */}
                            <img src={visionHub.url} alt="Startup Factory Hub innovation district" className="absolute inset-0 w-full h-full object-cover" />

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
                                  { v: '200+', l: 'Members on the Platform', c: NEON.lime },
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
                   PAGE 3 — EVENTS & ACTIVATIONS (Magazine Style)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="03" label="EVENTS & ACTIVATIONS" pageNum={3}>
                    {/* Ghost numeral */}
                    <div
                      className="absolute select-none pointer-events-none font-extrabold leading-none tracking-tighter z-0"
                      style={{
                        top: '-8%',
                        left: '-6%',
                        fontSize: '780px',
                        color: 'rgba(15,23,42,0.035)',
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      03
                    </div>

                    <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                      {/* Editorial header */}
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-start justify-between mb-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-px w-16" style={{ background: NEON.magenta }} />
                          <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                            Events &amp; Activations · Vol. 01
                          </span>
                        </div>
                        <span
                          className="text-[44px] font-light tracking-tighter italic"
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            color: 'rgba(15,23,42,0.18)',
                            textDecoration: 'underline',
                            textDecorationColor: NEON.magenta,
                            textUnderlineOffset: '8px',
                          }}
                        >
                          P/03
                        </span>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.05 }}
                        className="font-extrabold tracking-tight text-slate-900 mb-5"
                        style={{ fontSize: '46px', lineHeight: 1.04, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        Where the{' '}
                        <span
                          className="font-extrabold"
                          style={{
                            background: `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.cyan} 60%, ${NEON.lime} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          ecosystem meets.
                        </span>
                      </motion.h1>

                      {/* Featured — editorial split */}
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="relative overflow-hidden shrink-0"
                        style={{ height: '33%', boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}
                      >
                        <img src={eventArtemisWatchParty} alt="Artemis 2 Watch Party AR Experience" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.72) 42%, rgba(255,255,255,0.05) 74%, transparent 100%)' }} />
                        <div className="relative z-10 h-full flex gap-6 items-center px-6 max-w-[68%]">
                          <div className="shrink-0 self-stretch py-4">
                            <div className="w-[6px] h-full rounded-full" style={{ background: `linear-gradient(180deg, ${NEON.magenta}, ${NEON.cyan}, ${NEON.lime})` }} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[13px] font-bold tracking-[0.32em] uppercase" style={{ color: NEON.magenta }}>
                              Official Host · Featured
                            </span>
                            <h3
                              className="font-extrabold tracking-tight text-slate-900 leading-[1.06] mt-2"
                              style={{ fontSize: '30px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                            >
                              Artemis 2 Watch Party — AR Experience
                            </h3>
                            <p className="text-[16px] leading-[1.5] text-slate-600 font-light mt-2">
                              Startup Factory Hub is the <span className="font-semibold text-slate-900">Official Host</span> of the Artemis 2
                              Watch Party, delivering an immersive AR experience celebrating humanity's return to the Moon.
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Grid of four — magazine plates */}
                      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4 mt-4">
                        {[
                          { img: eventVoyagerOsu.url, kicker: 'Pitch Competition', title: 'Voyager Technologies · Ohio State University', desc: 'High-energy pitch competition connecting startups with NASA technologies, space leaders and venture capital.', accent: NEON.cyan },
                          { img: eventLaunchingOrlando, kicker: 'Community', title: 'Startup Factory Hub Launching Party', desc: 'Founders, mentors and investors gathering for the official platform launch.', accent: NEON.magenta },
                          { img: eventLakeCounty, kicker: 'Institutional · NASA', title: 'Lake County Mayor · UCF Incubation · NASA', desc: 'Public-private collaboration expanding regional entrepreneurship and space-tech infrastructure.', accent: NEON.lime, logo: nasaLogo, logoAlt: 'NASA logo' },
                          { img: eventPlugAndPlay, kicker: 'Deal Flow', title: 'Plug and Play · Accelerator Selection Day', desc: 'Screening and selecting high-potential ventures alongside global accelerators.', accent: NEON.cyan },
                        ].map((e, i) => (
                          <motion.div
                            key={e.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                            className="relative overflow-hidden min-h-0"
                            style={{ boxShadow: '0 26px 50px -26px rgba(15,23,42,0.4)' }}
                          >
                            <img src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 34%, rgba(255,255,255,0.9) 62%, rgba(255,255,255,0.97) 100%)' }} />
                            {e.logo && (
                              <div className="absolute top-3 right-3 z-20 bg-white/90 p-1.5 shadow-md">
                                <img src={e.logo} alt={e.logoAlt} className="h-6 w-auto object-contain" />
                              </div>
                            )}
                            <div className="relative z-10 h-full flex flex-col justify-end p-4">
                              <div className="h-[3px] w-8 mb-2" style={{ background: e.accent }} />
                              <span className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: e.accent }}>{e.kicker}</span>
                              <h4
                                className="font-extrabold tracking-tight text-slate-900 leading-[1.1] mt-1 break-words"
                                style={{ fontSize: '18px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                              >
                                {e.title}
                              </h4>
                              <p className="text-[13px] leading-[1.45] text-slate-600 font-light mt-1">{e.desc}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Upcoming — editorial pull quote strip */}
                      <div className="shrink-0 mt-4 flex items-center gap-5 p-5 bg-slate-50 border-l-4" style={{ borderColor: NEON.magenta }}>
                        <span className="text-[11px] font-bold tracking-[0.32em] uppercase shrink-0" style={{ color: NEON.magenta }}>
                          Upcoming
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-slate-900 italic font-medium leading-snug"
                            style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px' }}
                          >
                            "Space Symposium — Times Square XR Experience: an immersive activation showcasing space technology innovation."
                          </p>
                        </div>
                        <Smartphone className="h-6 w-6 shrink-0 ml-auto" style={{ color: NEON.magenta }} />
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 4 — THE OPPORTUNITY
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="04" label="OPPORTUNITY" pageNum={4}>
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

                      {/* ---- FULL-BLEED RESOURCE MAP ---- */}
                      <div className="absolute inset-0 z-0">
                        <BrochureResourceMap fallbackImage={visionHub.url} />
                        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(4,12,22,0.45) 0%, rgba(4,12,22,0.05) 45%, rgba(4,12,22,0.55) 100%)' }} />
                      </div>


                      <div className="relative z-10 flex flex-col h-full p-5 gap-3">

                        {/* ---- HEADLINE ROW ---- */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] tracking-[0.42em] uppercase mb-1.5" style={{ color: NEON.cyan }}>04 · The Opportunity · For Founders</div>
                            <h2 className="font-display font-black text-white" style={{ fontSize: '34px', lineHeight: 1.04, textShadow: `0 0 30px ${NEON.cyan}55` }}>
                              Build Your Startup Worldwide.{' '}
                              <span style={{ color: NEON.cyan, textShadow: `0 0 26px ${NEON.cyan}` }}>Talent, capital & offices on tap.</span>
                            </h2>
                            <p className="mt-2 text-[13px] leading-relaxed max-w-[520px]" style={{ color: '#c6dcea' }}>
                              From day one your startup operates globally. Land in key cities through partner workspaces, hire vetted engineers and operators wherever you grow, and get in front of investors ready to back your next round.
                            </p>
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

                          {/* LEFT COLUMN: map shows through */}
                          <div className="min-h-0" />



                          {/* WORLDWIDE VENTURE STACK */}
                          <div className="grid grid-rows-3 gap-3 min-h-0">
                            {[
                              {
                                i: Globe2,
                                c: NEON.cyan,
                                k: 'Global Landing Pads',
                                t: 'Launch in any market you target',
                                s: 'Work from SFH partner workspaces across the Americas, Europe and Asia — test new markets, meet customers and hire locally without signing a lease.',
                              },
                              {
                                i: Users,
                                c: '#38bdf8',
                                k: 'Talent On Demand',
                                t: 'Engineers, operators and mentors',
                                s: 'Plug into a vetted pool of engineers, designers and operators, plus 10-hour mentor tracks with founders who have already shipped and scaled.',
                              },
                              {
                                i: DollarSign,
                                c: NEON.lime,
                                k: 'Investor Access',
                                t: 'Get in front of real capital',
                                s: 'Pitch angels, syndicates, family offices and funds inside the SFH investor community — with Demo Day exposure and warm intros after your MVP ships.',
                              },
                            ].map((q, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                                className="relative rounded-2xl overflow-hidden border px-5 py-4 flex flex-col justify-center bdv-tile min-h-0"
                                style={{ borderColor: `${q.c}60`, background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(5,14,24,0.92) 60%)`, boxShadow: `0 10px 30px -20px ${q.c}` }}
                              >
                                <div className="absolute inset-y-0 w-1/2 bdv-sweep pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${q.c}12, transparent)`, animationDelay: `${i * 0.6}s` }} />
                                <div className="relative z-10 flex items-start gap-4">
                                  <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: `${q.c}18`, border: `1px solid ${q.c}50`, boxShadow: `0 0 18px ${q.c}30` }}>
                                    <q.i className="h-5 w-5" style={{ color: q.c }} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-mono text-[9px] tracking-[0.28em] uppercase mb-1" style={{ color: q.c }}>{q.k}</div>
                                    <div className="text-white font-bold leading-tight" style={{ fontSize: '15px' }}>{q.t}</div>
                                    <div className="text-[11.5px] leading-relaxed mt-1.5" style={{ color: '#c6dcea' }}>{q.s}</div>
                                  </div>
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
                                <span style={{ color: NEON.lime }}>BUILD YOUR STARTUP WORLDWIDE</span>
                                <span style={{ color: '#38bdf8' }}>GLOBAL WORKSPACE ACCESS</span>
                                <span style={{ color: NEON.cyan }}>ENGINEERS · MENTORS · OPERATORS</span>
                                <span style={{ color: NEON.amber }}>INVESTOR ACCESS & DEMO DAY</span>
                                <span style={{ color: NEON.lime }}>HIRE WHERE YOU GROW</span>
                                <span style={{ color: '#38bdf8' }}>AMERICAS · EUROPE · ASIA</span>
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
                   PAGE 6 — PARTNER CONTRIBUTION (timeline rail left → right)
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
                   PAGE 7 — SFH CONTRIBUTION (mirrored, magenta)
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
                          { i: Users, t: 'Community Access', b: 'Plug into a curated network of founders, mentors, investors and corporate partners — built for introductions, not impressions.' },
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
                   PAGES 07-10 — 4 WEEK PROGRAM AGENDA
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <WeekAgendaSlide spec={MVP_WEEKS[0]} />
                </A4Wrapper>
              </BookPage>
              <BookPage>
                <A4Wrapper>
                  <WeekAgendaSlide spec={MVP_WEEKS[1]} />
                </A4Wrapper>
              </BookPage>
              <BookPage>
                <A4Wrapper>
                  <WeekAgendaSlide spec={MVP_WEEKS[2]} />
                </A4Wrapper>
              </BookPage>
              <BookPage>
                <A4Wrapper>
                  <WeekAgendaSlide spec={MVP_WEEKS[3]} />
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 11 — NASDAQ TOWER · GLOBAL VISIBILITY
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="11" label="GLOBAL VISIBILITY" pageNum={11}>
                    <PageTitle kicker="11 · NASDAQ TOWER · TIMES SQUARE" accent={NEON.lime} title={<>Featured on the <span style={{ color: NEON.lime }}>world's stage.</span></>} />

                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="relative flex-1 rounded-3xl overflow-hidden"
                      style={{
                        border: `1px solid ${NEON.lime}55`,
                        boxShadow: `0 0 60px ${NEON.lime}25, inset 0 0 40px rgba(0,0,0,0.6)`,
                      }}
                    >
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url(${nasdaqFeature})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(180deg, rgba(2,4,10,0.15) 0%, rgba(255,255,255,0.42) 55%, rgba(2,4,10,0.96) 100%)`,
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `radial-gradient(ellipse at 50% 20%, ${NEON.lime}22, transparent 60%)`,
                      }} />
                      <Scanlines />

                      <div
                        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                        style={{
                          background: 'rgba(2,4,10,0.65)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${NEON.lime}70`,
                          boxShadow: `0 0 18px ${NEON.lime}50`,
                        }}
                      >
                        <Radio className="h-3 w-3 animate-pulse" style={{ color: NEON.lime }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white">LIVE · TIMES SQUARE</span>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 z-10 p-10">
                        <div className="font-mono text-[11px] uppercase tracking-[0.4em] mb-3" style={{ color: NEON.lime }}>// FEATURED</div>
                        <h3 className="font-futuristic font-black leading-[1.05] mb-4" style={{
                          fontSize: '44px',
                          ...PLATINUM_TITLE,
                          textShadow: `0 2px 14px rgba(0,0,0,0.95), 0 0 30px ${NEON.lime}40`,
                        }}>
                          Startup Factory Hub<br />
                          <span style={{ color: NEON.lime }}>on the Nasdaq Tower</span>
                        </h3>
                        <p className="text-base text-slate-900/85 leading-relaxed max-w-xl mb-6">
                          MVP Program startups launch inside a brand already broadcast to Times Square — visibility your product inherits from day one.
                        </p>

                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { k: '350K+', l: 'Daily viewers' },
                            { k: 'NYC', l: 'Times Square' },
                            { k: 'Global', l: 'Press reach' },
                            { k: '24/7', l: 'Brand presence' },
                          ].map((m) => (
                            <div
                              key={m.l}
                              className="rounded-xl px-4 py-3"
                              style={{
                                background: 'rgba(255,255,255,0.42)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${NEON.lime}40`,
                                boxShadow: `inset 0 0 18px ${NEON.lime}10`,
                              }}
                            >
                              <div className="font-futuristic font-black text-xl" style={{ color: NEON.lime, textShadow: `0 0 14px ${NEON.lime}70` }}>{m.k}</div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-900/65 mt-0.5">{m.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>
                   PAGE 11 — CTA · CONTRATA EL PROGRAMA (QR + FORMULARIO)
                  ==================================================== */}

              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="12" label="APPLY TO THE MVP PROGRAM" pageNum={12}>
                    <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 15% 10%, ${NEON.cyan}22, transparent 55%), radial-gradient(circle at 85% 90%, ${NEON.magenta}20, transparent 55%)` }} />

                    <div className="relative z-10 h-full flex flex-col px-10 pt-6 pb-8">
                      <PageTitle kicker="CALL TO ACTION" title={<>APPLY TO THE<br />MVP PROGRAM</>} accent={NEON.cyan} />

                      <p className="mt-3 text-[17px] leading-snug text-slate-700 max-w-[430px]">
                        Bring your idea and leave with functional software: <strong>4 weeks</strong>, a dedicated build squad, <strong>10 hours</strong> of 1:1 mentorship and Demo Day exposure — <strong>$5,000</strong> program cost per startup.
                      </p>

                      <div className="mt-4 grid grid-cols-[190px_1fr] gap-4 flex-1 min-h-0">
                        {/* QR */}
                        <div className="rounded-2xl p-4 flex flex-col items-center justify-center text-center"
                          style={{ background: 'rgba(255,255,255,0.92)', border: `1px solid ${NEON.cyan}55`, boxShadow: `0 0 30px ${NEON.cyan}25` }}>
                          <div className="font-mono text-[16px] uppercase tracking-[0.3em] mb-3" style={{ color: NEON.cyan }}>// SCAN TO APPLY</div>
                          <div className="p-2 rounded-xl bg-white" style={{ border: `1px solid ${NEON.cyan}40` }}>
                            <QRCodeSVG value={BATCH_APPLY_URL} size={126} level="M" fgColor="#0b1220" bgColor="#ffffff" />
                          </div>
                          <div className="mt-3 font-mono text-[16px] tracking-[0.14em] text-slate-600 break-all leading-tight">info@startupfactoryhub.com</div>
                          <div className="mt-3 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)` }} />
                          <div className="font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500 mt-1">4 WEEKS · $5,000 PROGRAM COST</div>
                        </div>

                        {/* FORM */}
                        <div className="rounded-2xl p-5 flex flex-col min-h-0"
                          style={{ background: 'rgba(255,255,255,0.9)', border: `1px solid ${NEON.magenta}45`, boxShadow: `0 0 30px ${NEON.magenta}20` }}>
                          <div className="font-mono text-[16px] uppercase tracking-[0.3em] mb-3" style={{ color: NEON.magenta }}>// SHORT FORM · START YOUR APPLICATION</div>

                          <BatchRequestForm />


                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { n: '01', t: 'You apply', d: 'QR or form' },
                              { n: '02', t: '1:1 interview', d: 'Within 48 hours' },
                              { n: '03', t: 'You build', d: '4-week sprint' },
                            ].map((s) => (
                              <div key={s.n} className="rounded-lg px-2 py-2" style={{ background: `${NEON.cyan}0f`, border: `1px solid ${NEON.cyan}30` }}>
                                <div className="font-futuristic font-black text-[17px]" style={{ color: NEON.cyan }}>{s.n}</div>
                                <div className="text-[17px] font-bold text-slate-800 leading-tight">{s.t}</div>
                                <div className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-slate-500 leading-tight">{s.d}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-3 font-mono text-[16px] uppercase tracking-[0.16em] text-slate-500">
                            info@startupfactoryhub.com · 100% Remote · Worldwide
                          </div>
                        </div>
                      </div>
                    </div>


                  </PageFrame>
                </A4Wrapper>
              </BookPage>
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
                      <span style={{ color: NEON.cyan }}>END · TRANSMISSION</span>
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
                showCover={true}
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
                swipeDistance={spread ? 120 : 90}
                showPageCorners={spread}
                disableFlipByClick={true}
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
