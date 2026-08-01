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
      <span className="text-slate-900/35">28°32′N · 81°22′W</span>
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
    { i: Building2, l: 'HQ Facility', tag: 'BDV·01' },
    { i: Globe2, l: 'Global Network', tag: 'BDV·02' },
    { i: Handshake, l: 'Trade Channels', tag: 'BDV·03' },
    { i: ShieldCheck, l: 'Govt Relations', tag: 'BDV·04' },
    { i: Award, l: 'Brand Authority', tag: 'BDV·05' },
    { i: Users, l: 'Corp Members', tag: 'BDV·06' },
    { i: MapPin, l: 'Intl Delegations', tag: 'BDV·07' },
    { i: Briefcase, l: 'Exec Spaces', tag: 'BDV·08' },
    { i: Rocket, l: 'Accelerator', tag: 'SFH·01' },
    { i: Brain, l: 'AI Platform', tag: 'SFH·02' },
    { i: GraduationCap, l: 'Mentor Net', tag: 'SFH·03' },
    { i: DollarSign, l: 'Investor Ops', tag: 'SFH·04' },
    { i: Lightbulb, l: 'Corp Innov', tag: 'SFH·05' },
    { i: BarChart3, l: 'Exec Programs', tag: 'SFH·06' },
    { i: Cpu, l: 'Digital Infra', tag: 'SFH·07' },
    { i: TrendingUp, l: 'Growth Eng', tag: 'SFH·08' },
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
        ● LAVA · LIVE SYNTHESIS
      </div>
      <div
        className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.3em] text-right"
        style={{ color: '#3a5066' }}
      >
        16 / 16 CAPABILITIES
        <br />
        <span style={{ color: accent, opacity: 0.85 }}>MERGED · ONE PLATFORM</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: '#56697f' }}>
        <span>BDV × SFH · FUSION CORE</span>
        <span>STATE: FLUID · MOVE CURSOR</span>
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
            <span className="font-futuristic font-black text-sm uppercase tracking-[0.12em]" style={{ color: c.color }}>{c.role}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded" style={{ background: `${c.color}20`, color: c.color }}>
              {isActive ? 'SIGNED IN' : 'CLICK TO SIGN IN'}
            </span>
          </div>
          <span
            onClick={(e) => copy(c.email, `${c.role}-email`, e)}
            className="text-left font-mono text-xs text-slate-800 truncate transition-all hover:opacity-80"
            title="Click to copy email"
          >
            {c.email}
          </span>
          <span
            onClick={(e) => copy(COMMON_PASSWORD, `${c.role}-pass`, e)}
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-bold transition-all hover:brightness-110"
            style={{ background: c.color, color: '#ffffff' }}
            title="Click to copy password"
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
              className="absolute bottom-2 right-3 font-mono text-[9px] uppercase tracking-wider"
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
            <span className="font-mono text-sm uppercase tracking-[0.22em] font-bold text-slate-900">Demo Access Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: NEON.cyan }}>● CLICK ROLE TO SIGN IN</span>
          </div>
        </div>
        <div className="p-5">
          <DemoCredentialGrid activeRole={role} onSelect={setRole} />
        </div>
      </div>

      <GlassCard accent={NEON.cyan} padding="p-0" className="flex-1 overflow-hidden relative">
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] pointer-events-none">
          <span style={{ color: NEON.cyan }}>● LIVE EMULATOR · {role.toUpperCase()} SESSION</span>
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
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-futuristic font-black leading-[0.95] tracking-tight" style={{
      fontSize: 'clamp(34px, 5vw, 56px)',
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
    return isChromium && !isMobile;
  });
  useEffect(() => { setSupported((s) => s); }, []);
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
        </div>
        <div className="w-[88px]" />
      </div>

      {/* Background audio element (no autoplay) */}
      <audio ref={audioRef} src={luminousAudio.url} loop preload="auto" autoPlay />

      {/* Floating audio control */}
      <div
        className="fixed bottom-5 left-5 z-50 flex items-center gap-3 rounded-full px-3 py-2"
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
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-900/5"
          style={{ color: NEON.cyan }}
        >
          {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setAudioMuted((m) => !m)}
          aria-label={audioMuted ? 'Unmute' : 'Mute'}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-slate-900/5"
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
          className="w-28 sm:w-36 accent-current cursor-pointer"
          style={{ color: NEON.cyan }}
        />
      </div>


      <div
        className="pt-20 pb-12 min-h-screen flex items-center justify-center px-2 sm:px-6"
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
                      <span style={{ color: NEON.cyan }}>// CLASSIFIED · JV PROPOSAL</span>
                      <span style={{ color: NEON.magenta }}>JUNE 2026 · ORLANDO FL</span>
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
                        ORLANDO<br />INNOVATION<br />NEXUS
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
                        A next-generation innovation destination where founders, capital, corporations and global commerce converge.
                      </motion.p>
                    </div>

                    {/* bottom hud */}
                    <div className="absolute bottom-8 left-10 right-10 z-20">
                      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 8px ${NEON.lime}` }} />
                          <span style={{ color: NEON.lime }}>SYS · ONLINE</span>
                        </div>
                        <span style={{ color: NEON.cyan }}>JV · 50 / 50</span>
                        <span style={{ color: NEON.magenta }}>BUILD · v1.0</span>
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
                        <span>SEC // 01 · ISSUE 01</span>
                      </div>
                      <div className="text-slate-500">INTRODUCTION · STARTUP FACTORY HUB</div>
                      <div style={{ color: NEON.cyan }}>P/02 · 16</div>
                    </div>

                    {/* Bottom HUD bar */}
                    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] uppercase z-20">
                      <span className="text-slate-900/35">// STARTUP FACTORY HUB · GLOBAL ACCELERATOR</span>
                      <span className="text-slate-900/35">EST · ORLANDO · USA</span>
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
                            About Startup Factory
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
                            for the{' '}
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
                              World's Next
                            </span>
                            <br />
                            Founders.
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
                                Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI age — uniting{' '}
                                <span className="font-semibold text-slate-900">founders, investors, mentors, advisors, accelerators</span>{' '}
                                and <span className="font-semibold text-slate-900">students</span> through one integrated platform for
                                AI-enabled acceleration, strategic capital, and a globally connected innovation network.
                              </p>
                              <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                                <p
                                  className="text-slate-900 italic font-medium leading-snug"
                                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}
                                >
                                  "Infrastructure is the new IP. The platforms that own the founder journey will shape the future of innovation."
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
                                Infrastructure First
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
                                Platform by the Numbers
                              </div>
                              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                                {[
                                  { v: '$200M+', l: 'Capital Raised', c: NEON.lime },
                                  { v: '40+', l: 'Startups Accelerated', c: NEON.cyan },
                                  { v: '350+', l: 'Network Members', c: NEON.magenta },
                                  { v: '04', l: 'Global Hubs', c: NEON.amber },
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
                   PAGE 3 — VISION
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="02" label="PROPOSAL" pageNum={3}>
                    <PageTitle kicker="02 · The Opportunity" title={<>A joint venture to build the <span style={{ color: NEON.cyan }}>next innovation capital</span> of the world.</>} />

                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                      {/* HERO: holographic alliance interface */}
                      <GlassCard accent={NEON.cyan} padding="p-0" className="relative overflow-hidden flex-1 min-h-0">
                        {/* background image */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${visionHub.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        {/* deep tech wash + neon tint — kept light so content remains readable */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(115deg, rgba(15,23,42,0.58) 0%, rgba(15,23,42,0.40) 42%, rgba(15,23,42,0.20) 100%), radial-gradient(ellipse at 85% 15%, ${NEON.cyan}22 0%, transparent 55%), radial-gradient(ellipse at 15% 90%, ${NEON.magenta}16 0%, transparent 60%)`,
                          }}
                        />
                        {/* grid overlay */}
                        <div
                          className="absolute inset-0 opacity-[0.22] pointer-events-none"
                          style={{
                            backgroundImage: `linear-gradient(${NEON.cyan}60 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan}60 1px, transparent 1px)`,
                            backgroundSize: '48px 48px',
                            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
                          }}
                        />
                        {/* rotating rings cluster */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute right-[-180px] top-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full border" style={{ borderColor: `${NEON.cyan}30`, animation: 'slow-spin 80s linear infinite' }} />
                          <div className="absolute right-[-120px] top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}40`, animation: 'slow-spin-reverse 55s linear infinite' }} />
                          <div className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border" style={{ borderColor: `${NEON.magenta}40`, animation: 'slow-spin 35s linear infinite' }} />
                        </div>
                        {/* scan line */}
                        <div className="absolute inset-x-0 h-[2px] pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}, transparent)`, top: '0%', animation: 'scan 6s ease-in-out infinite', boxShadow: `0 0 18px ${NEON.cyan}` }} />

                        <div className="relative p-6 h-full flex flex-col justify-between gap-4">
                          {/* HUD top bar */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Handshake className="h-6 w-6" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 14px ${NEON.cyan})` }} />
                                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 10px ${NEON.lime}` }} />
                              </div>
                              <span className="font-mono text-[10px] tracking-[0.45em] uppercase" style={{ color: NEON.cyan, textShadow: `0 0 10px ${NEON.cyan}` }}>// ALLIANCE PROTOCOL · ACTIVE</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: `${NEON.lime}60`, background: `${NEON.lime}10` }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.lime }} />
                              <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: NEON.lime }}>SIGNAL · LIVE</span>
                            </div>
                          </div>

                          {/* Alliance equation: BDV + SFH = NEXT */}
                          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-3">
                            {/* BDV node */}
                            <div className="relative rounded-xl border p-4 backdrop-blur-md min-w-0 flex flex-col justify-between" style={{ borderColor: `${NEON.cyan}70`, background: `linear-gradient(135deg, ${NEON.cyan}18, transparent)`, boxShadow: `inset 0 0 30px ${NEON.cyan}20, 0 0 24px ${NEON.cyan}30` }}>
                              <div>
                                <div className="font-mono text-[9px] tracking-[0.35em] uppercase mb-1" style={{ color: NEON.cyan }}>NODE · 01</div>
                                <div className="font-futuristic font-black text-[26px] leading-none tracking-wide" style={{ color: '#ffffff', textShadow: `0 0 22px ${NEON.cyan}, 0 0 42px ${NEON.cyan}60` }}>BANCO DE VENEZUELA</div>
                              </div>
                              <div className="mt-2 text-[12px] font-semibold" style={{ color: '#e2e8f0' }}>Global trade · Corporate authority</div>
                            </div>

                            <div className="font-futuristic font-black text-[34px] leading-none self-center" style={{ color: NEON.cyan, textShadow: `0 0 28px ${NEON.cyan}` }}>+</div>

                            {/* SFH node */}
                            <div className="relative rounded-xl border p-4 backdrop-blur-md min-w-0 flex flex-col justify-between" style={{ borderColor: `${NEON.magenta}70`, background: `linear-gradient(135deg, ${NEON.magenta}18, transparent)`, boxShadow: `inset 0 0 30px ${NEON.magenta}20, 0 0 24px ${NEON.magenta}30` }}>
                              <div>
                                <div className="font-mono text-[9px] tracking-[0.35em] uppercase mb-1" style={{ color: NEON.magenta }}>NODE · 02</div>
                                <div className="font-futuristic font-black text-[26px] leading-none tracking-wide" style={{ color: '#ffffff', textShadow: `0 0 22px ${NEON.magenta}, 0 0 42px ${NEON.magenta}60` }}>STARTUP FACTORY</div>
                              </div>
                              <div className="mt-2 text-[12px] font-semibold" style={{ color: '#e2e8f0' }}>AI platform · Mentor & capital engine</div>
                            </div>

                            <div className="font-futuristic font-black text-[34px] leading-none self-center" style={{ color: NEON.lime, textShadow: `0 0 28px ${NEON.lime}` }}>=</div>

                            {/* OUTPUT node */}
                            <div className="relative rounded-xl border-2 p-4 backdrop-blur-md overflow-hidden min-w-0 flex flex-col justify-between" style={{ borderColor: `${NEON.lime}80`, background: `linear-gradient(135deg, ${NEON.lime}22, ${NEON.cyan}10)`, boxShadow: `inset 0 0 36px ${NEON.lime}25, 0 0 32px ${NEON.lime}50` }}>
                              <div>
                                <div className="font-mono text-[9px] tracking-[0.35em] uppercase mb-1" style={{ color: NEON.lime }}>OUTPUT</div>
                                <div className="font-futuristic font-black text-[20px] leading-tight tracking-wide break-words" style={{ color: '#ffffff', textShadow: `0 0 24px ${NEON.lime}, 0 0 48px ${NEON.lime}60` }}>INNOVATION CAPITAL</div>
                              </div>
                              <div className="mt-2 text-[12px] font-semibold" style={{ color: '#f1f5f9' }}>The next global hub · co-built</div>
                            </div>
                          </div>

                          {/* Manifesto statement */}
                          <div className="max-w-[96%]">
                            <p className="text-[26px] leading-[1.32] font-light tracking-tight" style={{ color: '#f1f5f9', textShadow: '0 2px 18px rgba(0,0,0,0.5)' }}>
                              A <span className="font-black" style={{ color: NEON.cyan, textShadow: `0 0 24px ${NEON.cyan}` }}>strategic alliance</span> that fuses el BDV's <span className="font-bold" style={{ color: '#fff' }}>global trade infrastructure</span> with SFH's <span className="font-black" style={{ color: NEON.magenta, textShadow: `0 0 24px ${NEON.magenta}` }}>AI-driven acceleration engine</span> — engineered to position our joint venture as the <span className="font-black" style={{ color: NEON.lime, textShadow: `0 0 24px ${NEON.lime}` }}>next innovation capital of the world</span>.
                            </p>
                          </div>

                          {/* Pillars */}
                          <div className="grid grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: `${NEON.cyan}40` }}>
                            {[
                              { i: Globe2, h: 'Trade Corridors', l: 'Canales del BDV abiertos a las startups de SFH', c: NEON.cyan, code: 'P·01' },
                              { i: Rocket, h: 'Acceleration', l: 'SFH pipeline fed into BDV corporate network', c: NEON.magenta, code: 'P·02' },
                              { i: TrendingUp, h: 'Innovation Capital', l: 'Joint venture as the next global hub', c: NEON.lime, code: 'P·03' },
                            ].map((item, idx) => (
                              <div key={idx} className="relative overflow-hidden rounded-xl p-3" style={{ background: `linear-gradient(155deg, ${item.c}1a 0%, rgba(8,14,24,0.55) 70%)`, border: `1px solid ${item.c}55`, boxShadow: `inset 0 1px 0 ${item.c}30, 0 0 22px ${item.c}22` }}>
                                <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${item.c}, transparent)` }} />
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${item.c}25`, border: `1px solid ${item.c}60`, boxShadow: `0 0 18px ${item.c}55` }}>
                                    <item.i className="h-4 w-4" style={{ color: '#ffffff', filter: `drop-shadow(0 0 8px ${item.c})` }} />
                                  </div>
                                  <span className="font-mono text-[8px] tracking-[0.35em] uppercase px-2 py-0.5 rounded-full border" style={{ color: item.c, borderColor: `${item.c}50`, background: `${item.c}15` }}>{item.code}</span>
                                </div>
                                <div className="font-futuristic font-black uppercase text-[15px] tracking-[0.1em] leading-tight" style={{ color: '#ffffff', textShadow: `0 0 18px ${item.c}99` }}>{item.h}</div>
                                <div className="mt-1.5 font-medium text-[11px] leading-snug tracking-wide" style={{ color: '#e2e8f0' }}>{item.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </GlassCard>

                      {/* BOTTOM STAT STRIP — what the partnership unlocks */}
                      <div className="grid grid-cols-3 gap-4 h-[170px]">
                        {[
                          { v: '1', l: 'Unified Innovation Destination', c: NEON.cyan, i: Building2, img: kpiCities, sub: 'BDV facility + SFH platform' },
                          { v: '∞', l: 'Cross-Border Deal Flow', c: NEON.magenta, i: Network, img: kpiNetwork, sub: 'Corporations, investors, founders' },
                          { v: '$10B+', l: 'Addressable Ecosystem Value', c: NEON.lime, i: TrendingUp, img: kpiCapital, sub: 'Capital, trade & talent combined' },
                        ].map((s, i) => (
                          <GlassCard key={i} accent={s.c} padding="p-0" className="relative overflow-hidden min-w-0">
                            {/* bg image */}
                            <div className="absolute inset-0" style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            {/* dark tech wash + neon */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, rgba(8,14,24,0.85) 0%, rgba(10,18,30,0.65) 55%, rgba(12,22,36,0.55) 100%), radial-gradient(ellipse at 100% 100%, ${s.c}40 0%, transparent 60%)` }} />
                            {/* mini grid */}
                            <div className="absolute inset-0 opacity-[0.18] pointer-events-none" style={{ backgroundImage: `linear-gradient(${s.c}80 1px, transparent 1px), linear-gradient(90deg, ${s.c}80 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
                            {/* top accent bar */}
                            <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${s.c}, transparent)`, boxShadow: `0 0 12px ${s.c}` }} />

                            <div className="relative p-4 h-full flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <NeonBadge icon={s.i} color={s.c} size="md" />
                                <span className="font-mono text-[9px] tracking-[0.35em] uppercase px-2 py-0.5 rounded-full border" style={{ color: s.c, borderColor: `${s.c}60`, background: `${s.c}12` }}>JV·{String(i+1).padStart(2,'0')}</span>
                              </div>
                              <div className="min-w-0">
                              <div className="font-futuristic font-black leading-none truncate" style={{ fontSize: '42px', color: s.c, textShadow: `0 0 8px #000, 0 0 18px ${s.c}, 0 0 32px ${s.c}80, 0 2px 6px rgba(0,0,0,0.8)` }}>{s.v}</div>
                                <div className="mt-1.5 font-bold text-[15px] leading-tight" style={{ color: '#f1f5f9', textShadow: `0 0 12px ${s.c}55` }}>{s.l}</div>
                                <div className="mt-1 font-semibold text-[10px] uppercase tracking-[0.18em] leading-snug" style={{ color: '#e2e8f0' }}>{s.sub}</div>
                              </div>
                            </div>

                          </GlassCard>
                        ))}
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
                  <PageFrame accent={NEON.magenta} code="03" label="OPPORTUNITY" pageNum={4}>
                    {/* HEADER: title + dual logos */}
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] tracking-[0.4em] uppercase mb-2" style={{ color: NEON.magenta }}>03 · The Opportunity</div>
                        <h2 className="font-display font-black leading-[0.95]" style={{ fontSize: '46px', ...PLATINUM_TITLE }}>
                          Orlando has the growth.<br/>
                          <span style={{ color: NEON.magenta, textShadow: `0 0 28px ${NEON.magenta}90` }}>It needs the convergence.</span>
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
                        <span>● LIVE</span>
                        <span style={{ color: NEON.lime }}>ORLANDO MSA</span>
                        <span style={{ color: NEON.magenta }}>GDP +5.4% YoY</span>
                        <span style={{ color: NEON.cyan }}>JOBS +52K</span>
                        <span style={{ color: NEON.amber }}>VC INFLOW $1.2B</span>
                        <span style={{ color: NEON.lime }}>TOURISM #1 USA</span>
                        <span style={{ color: NEON.magenta }}>INNOV HUB · MISSING</span>
                      </div>
                    </div>

                    {/* 4-QUADRANT METRIC GRID WITH IMAGES */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1">
                      {[
                        { v: '#1', l: 'Fastest growing metro in the U.S.', c: NEON.cyan, i: Rocket, sub: 'Sustained population & GDP growth', img: oppGrowth },
                        { v: '2.8M', l: 'Central Florida population', c: NEON.magenta, i: Users, sub: 'Diverse, multilingual talent base', img: oppPopulation },
                        { v: '76M', l: 'Annual international visitors', c: NEON.lime, i: Globe2, sub: "World's #1 tourism destination", img: oppVisitors },
                        { v: '0', l: 'Centralized innovation destination', c: NEON.amber, i: Target, sub: 'Until now — the gap we close', img: oppGap },
                      ].map((q, i) => (
                        <GlassCard key={i} accent={q.c} padding="p-0" className="relative overflow-hidden flex flex-col">
                          {/* background image */}
                          <div className="absolute inset-0" style={{ backgroundImage: `url(${q.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          {/* darkening + neon wash */}
                          <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.42) 100%)` }} />
                          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 85% 15%, ${q.c}35 0%, transparent 55%)` }} />
                          {/* scanning gradient line */}
                          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${q.c}, transparent)`, boxShadow: `0 0 10px ${q.c}` }} />

                          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                              <NeonBadge icon={q.i} color={q.c} size="lg" />
                              <span className="font-mono text-[10px] tracking-[0.35em] uppercase px-2 py-1 rounded border" style={{ color: q.c, borderColor: `${q.c}60`, background: `${q.c}10` }}>METRIC·{String(i+1).padStart(2,'0')}</span>
                            </div>
                            <div>
                              <div className="font-futuristic font-black leading-none mb-2" style={{ fontSize: '68px', color: q.c, textShadow: `0 0 28px ${q.c}90, 0 2px 8px rgba(0,0,0,0.9)` }}>{q.v}</div>
                              <div className="text-[17px] font-bold text-slate-900 leading-tight">{q.l}</div>
                              <div className="mt-1.5 text-[13px] text-slate-700 leading-snug">{q.sub}</div>
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
                  <PageFrame accent={NEON.cyan} code="04" label="STRUCTURE" pageNum={5}>
                    <PageTitle kicker="04 · Joint Venture" title={<>One mission. <span style={{ color: NEON.cyan }}>50</span> / <span style={{ color: NEON.magenta }}>50</span> partnership.</>} />

                    {/* Modern dual-partner composition — bold typography, no photos */}
                    <div className="relative flex-1 grid grid-cols-2 gap-6 min-h-0">
                      {/* BDV PARTNER CARD */}
                      <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
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
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.cyan, borderColor: `${NEON.cyan}60`, background: `${NEON.cyan}15` }}>PARTNER · A</span>
                        </div>

                        <div className="relative z-10 mt-6">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.cyan }}>Institutional Anchor</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>Banco de<br/>Venezuela</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4">
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '108px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.cyan}60)`,
                          }}>50<span style={{ fontSize: '52px' }}>%</span></div>
                          <div className="pb-3 font-mono text-[12px] uppercase tracking-[0.3em] font-semibold" style={{ color: NEON.cyan }}>Equity<br/>Stake</div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 flex-1 flex flex-col gap-2.5">
                          {[
                            { t: 'Premium HQ & Facilities', s: 'Class-A workspace' },
                            { t: 'BDV Global Network', s: '300+ cities worldwide' },
                            { t: 'Government & Trade Relations', s: 'Institutional access' },
                            { t: 'Brand Authority', s: 'Global credibility' },
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
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
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
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.magenta, borderColor: `${NEON.magenta}60`, background: `${NEON.magenta}15` }}>PARTNER · B</span>
                          <NeonBadge icon={Rocket} color={NEON.magenta} size="lg" />
                        </div>

                        <div className="relative z-10 mt-6 text-right">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.magenta }}>Operating Engine</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>Startup<br/>Factory Hub</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4 justify-end">
                          <div className="pb-3 font-mono text-[12px] uppercase tracking-[0.3em] font-semibold text-right" style={{ color: NEON.magenta }}>Equity<br/>Stake</div>
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '108px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.magenta} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.magenta}60)`,
                          }}>50<span style={{ fontSize: '52px' }}>%</span></div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 flex-1 flex flex-col gap-2.5">
                          {[
                            { t: 'Accelerator Operations', s: 'Programs & cohorts' },
                            { t: 'AI-Powered Digital Platform', s: 'Tech infrastructure' },
                            { t: 'Mentor & Investor Network', s: '500+ active members' },
                            { t: 'Marketing, Brand & Growth', s: 'Global outreach' },
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
                        { l: 'Equal Equity', c: NEON.cyan },
                        { l: 'Shared Governance', c: NEON.lime },
                        { l: 'Joint Authority', c: NEON.magenta },
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
                  <PageFrame accent={NEON.cyan} code="05" label="BDV CONTRIBUTION" pageNum={6}>
                    <PageTitle kicker="05 · BDV Brings" title={<>Institutional gravity. <span style={{ color: NEON.cyan }}>Global reach.</span></>} />

                    <div className="relative flex-1 pl-16 flex flex-col">
                      {/* animated vertical rail */}
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute left-5 top-0 bottom-0 w-[2px] origin-top"
                        style={{ background: `linear-gradient(180deg, transparent, ${NEON.cyan} 15%, ${NEON.cyan} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.cyan}, 0 0 40px ${NEON.cyan}80` }}
                      />
                      {/* rail scan pulse */}
                      <motion.div
                        initial={{ top: '0%', opacity: 0 }}
                        whileInView={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                        className="absolute left-[14px] w-3 h-3 rounded-full"
                        style={{ background: NEON.cyan, boxShadow: `0 0 24px ${NEON.cyan}, 0 0 60px ${NEON.cyan}` }}
                      />

                      <div className="grid grid-cols-1 gap-5 flex-1">
                        {[
                          { i: Building2, t: 'Premium HQ & Facilities', b: 'A signature, executive-class destination ready to host founders, capital and global delegations.' },
                          { i: Globe2, t: 'Red Banco de Venezuela', b: 'Acceso directo a la mayor red bancaria del país — sucursales, clientes PyME y corporativos en todo el territorio.' },
                          { i: Handshake, t: 'International Trade Channels', b: 'Established diplomatic and trade relationships unlocking market entry for portfolio companies.' },
                          { i: ShieldCheck, t: 'Government & Civic Relations', b: 'Direct lines to state, municipal and federal economic development authorities.' },
                          { i: Award, t: 'Brand Credibility & Authority', b: 'A world-renowned mark of trust that elevates every program, partner and announcement.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex-1"
                          >
                            {/* glowing node */}
                            <motion.span
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true, amount: 0.2 }}
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
                  <PageFrame accent={NEON.magenta} code="06" label="SFH CONTRIBUTION" pageNum={7}>
                    <PageTitle kicker="06 · SFH Brings" title={<>Entrepreneurial engine. <span style={{ color: NEON.magenta }}>Digital backbone.</span></>} accent={NEON.magenta} />

                    <div className="relative flex-1 pr-16 flex flex-col">
                      {/* animated vertical rail */}
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute right-5 top-0 bottom-0 w-[2px] origin-top"
                        style={{ background: `linear-gradient(180deg, transparent, ${NEON.magenta} 15%, ${NEON.magenta} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.magenta}, 0 0 40px ${NEON.magenta}80` }}
                      />
                      {/* rail scan pulse */}
                      <motion.div
                        initial={{ top: '0%', opacity: 0 }}
                        whileInView={{ top: '100%', opacity: [0, 1, 1, 0] }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                        className="absolute right-[14px] w-3 h-3 rounded-full"
                        style={{ background: NEON.magenta, boxShadow: `0 0 24px ${NEON.magenta}, 0 0 60px ${NEON.magenta}` }}
                      />

                      <div className="grid grid-cols-1 gap-5 flex-1">
                        {[
                          { i: Rocket, t: 'Accelerator Operations', b: 'End-to-end program design, cohort delivery, founder support and outcome reporting.' },
                          { i: Brain, t: 'AI-Powered Digital Platform', b: 'A proprietary OS for members, founders, mentors and investors. Live deal flow. Real intelligence.' },
                          { i: GraduationCap, t: 'Mentor & Expert Network', b: '150+ active mentors. 300+ investors. 1,500+ investor directory. A relationship machine.' },
                          { i: DollarSign, t: 'Investor & Capital Relations', b: 'Curated capital pipelines and demo day infrastructure tuned for Series A through growth.' },
                          { i: Sparkles, t: 'Marketing, Brand & Growth', b: 'Editorial, content, events and global PR — already featured on Nasdaq Tower, Times Square.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                            whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                            viewport={{ once: true, amount: 0.2 }}
                            transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="relative flex-1"
                          >
                            {/* glowing node */}
                            <motion.span
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true, amount: 0.2 }}
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
                                <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">MODULE</span>
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
                  <PageFrame accent={NEON.lime} code="07" label="CAPABILITY MATRIX" pageNum={8}>
                    <PageTitle kicker="07 · Capability Matrix" title={<>16 combined capabilities. <span style={{ color: NEON.lime }}>One platform.</span></>} accent={NEON.lime} />

                    <LavaCapabilityMatrix accent={NEON.lime} />
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 9 — DIGITAL PLATFORM
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="08" label="DIGITAL PLATFORM" pageNum={9}>
                    <PageTitle kicker="08 · Digital Platform" title={<>Try the live <span style={{ color: NEON.cyan }}>Innovation Nexus</span> app.</>} />

                    <DigitalPlatformDemo />


                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 10 — AR / IMMERSIVE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="09" label="AR · IMMERSIVE" pageNum={10}>
                    <PageTitle kicker="09 · Augmented Reality" title={<><span style={{ color: NEON.magenta }}>Point.</span> Scan. Step inside.</>} accent={NEON.magenta} />

                    <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ border: `1px solid ${NEON.magenta}50` }}>
                      <img src={moonBackground.url} alt="Moon" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.82) 100%)` }} />
                      <MatrixLayer density={0.18} columns={30} tone="magenta" />

                      <div className="absolute inset-0 flex flex-col justify-between p-8">
                        <div className="flex justify-between items-start gap-6">
                          <GlassCard accent={NEON.magenta} padding="p-6" className="max-w-md">
                            <div className="flex items-center gap-3 mb-3">
                              <Scan className="h-6 w-6" style={{ color: NEON.magenta }} />
                              <span className="font-mono text-xs uppercase tracking-[0.35em] font-bold" style={{ color: NEON.magenta }}>AR · ACTIVE</span>
                            </div>
                            <div className="text-base text-slate-900 leading-relaxed font-medium">
                              Any smartphone becomes a portal into the Innovation Nexus — 3D startup pavilions, holographic speakers, interactive BDV global map.
                            </div>
                          </GlassCard>
                          <div className="font-mono text-xs uppercase tracking-[0.3em] text-right text-slate-700 font-semibold">
                            <div>LAT 28°32′N</div>
                            <div>LON 81°22′W</div>
                            <div className="mt-1.5 text-sm" style={{ color: NEON.magenta }}>● TRACKING</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-futuristic font-black leading-[0.92] mb-7" style={{ fontSize: '76px', ...PLATINUM_TITLE, textShadow: `0 0 40px ${NEON.magenta}90` }}>
                            Walk through the<br /><span style={{ color: NEON.magenta }}>future of commerce.</span>
                          </h3>

                          {/* AR ROVER VIEWPORT */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="relative rounded-2xl overflow-hidden mb-5"
                            style={{
                              height: '280px',
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
                              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-[0.28em] font-bold"
                              style={{ background: NEON.cyan, color: '#0a1020', boxShadow: `0 0 24px ${NEON.cyan}` }}
                            >
                              <Smartphone className="h-4 w-4" /> Launch Google XR
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
                              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-900 font-bold">AR · SCANNING</span>
                            </div>
                            <div className="absolute top-4 right-4 mr-10 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-800 text-right font-semibold">
                              <div>OBJ · NASA ROVER</div>
                              <div style={{ color: NEON.cyan }}>DIST 4.3M</div>
                            </div>
                            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                              <div>
                                <div className="font-mono text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>// LIVE VIEWPORT</div>
                                <div className="font-futuristic font-black leading-tight mt-1" style={{ ...PLATINUM_TITLE, fontSize: '26px', textShadow: `0 0 14px ${NEON.cyan}` }}>
                                  Mars Rover · Surface Scan
                                </div>
                              </div>
                              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-700 text-right font-semibold">
                                <div>LAT −4.5°  LON 137.4°</div>
                                <div style={{ color: NEON.magenta }}>● TRACKED</div>
                              </div>
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-4 gap-4">
                            {[
                              { i: Smartphone, l: 'WebAR', s: 'No install' },
                              { i: Box, l: '3D Booths', s: 'Startup pavilions' },
                              { i: Globe2, l: 'Global Map', s: 'Interactive 3D' },
                              { i: Sparkles, l: 'Holo Speakers', s: 'Live presence' },
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
                  <PageFrame accent="hsl(var(--primary))" code="11B" label="SUCCESS DASHBOARD" pageNum={12}>
                    <div className="flex-1 flex flex-col gap-4 min-h-0 relative" style={{ background: 'var(--gradient-hero)' }}>
                      {/* Hero insight card */}
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="relative tech-card border-0 rounded-2xl p-5 overflow-hidden shrink-0"
                      >
                        <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-12 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative flex items-center justify-between gap-5">
                          <div className="space-y-2">
                            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1">
                              <Sparkles className="w-3 h-3" /> Year One Trajectory
                            </Badge>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
                              Success <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Dashboard</span>
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-md">
                              Projected outcomes across startups, capital, membership and community impact.
                            </p>
                            <div className="flex items-center gap-2 pt-1 max-w-md">
                              <Progress value={72} className="h-2 flex-1" />
                              <span className="text-xs font-medium text-muted-foreground tabular-nums">72%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 min-w-[300px]">
                            {[
                              { icon: Rocket, value: '100', label: 'Startups', tone: 'text-primary', delta: '+300%', from: '25 Q1' },
                              { icon: Users, value: '1,000', label: 'Members', tone: 'text-emerald-500', delta: '+456%', from: '180 Q1' },
                              { icon: DollarSign, value: '$500M+', label: 'Network Capital', tone: 'text-amber-500', delta: '+525%', from: '$80M Q1' },
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
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="relative tech-card border-0 rounded-2xl p-4 flex flex-col flex-1 min-h-0"
                      >
                        <div className="flex items-center justify-between mb-2 shrink-0">
                          <div>
                            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                              Year One Projections
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 px-1.5 py-0 text-[9px] h-4">
                                  <TrendingUp className="w-2.5 h-2.5" /> +430% YoY
                                </Badge>
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quarterly differential · all six growth vectors</div>
                          </div>
                          <div className="flex items-center gap-2.5 text-[10px] flex-wrap justify-end max-w-[55%]">
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(160 84% 39%)' }} /> Startups</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(160 84% 55%)' }} /> Members</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(38 92% 50%)' }} /> Capital ($M)</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(262 83% 58%)' }} /> Corporate</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(190 90% 45%)' }} /> Int'l</span>
                            <span className="flex items-center gap-1 text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(346 84% 60%)' }} /> Community</span>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[
                                { q: 'Q1', startups: 25, members: 180, capital: 80, corporate: 16, intl: 6, community: 40 },
                                { q: 'Q2', startups: 55, members: 450, capital: 200, corporate: 28, intl: 12, community: 110 },
                                { q: 'Q3', startups: 80, members: 750, capital: 350, corporate: 45, intl: 20, community: 220 },
                                { q: 'Q4', startups: 100, members: 1000, capital: 500, corporate: 60, intl: 30, community: 360 },
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
                              <Area type="monotone" dataKey="community" name="Community" stroke="hsl(346 84% 60%)" strokeWidth={1.75} fill="url(#sCommunity)" />
                              <Area type="monotone" dataKey="members" name="Members" stroke="hsl(160 84% 55%)" strokeWidth={1.75} fill="url(#sMembers)" />
                              <Area type="monotone" dataKey="capital" name="Capital ($M)" stroke="hsl(38 92% 50%)" strokeWidth={2} fill="url(#sCapital)" />
                              <Area type="monotone" dataKey="startups" name="Startups" stroke="hsl(160 84% 39%)" strokeWidth={2} fill="url(#sStartups)" />
                              <Area type="monotone" dataKey="corporate" name="Corporate" stroke="hsl(262 83% 58%)" strokeWidth={1.75} fill="url(#sCorporate)" />
                              <Area type="monotone" dataKey="intl" name="International" stroke="hsl(190 90% 45%)" strokeWidth={1.75} fill="url(#sIntl)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>


                      {/* Category insight cards — explanatory bullets instead of duplicate charts */}
                      <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="grid grid-cols-3 gap-3 shrink-0"
                      >
                        {[
                          {
                            icon: Rocket,
                            title: 'Startup & Innovation',
                            metric: '100 startups',
                            tone: 'text-primary',
                            bg: 'bg-primary/10',
                            accent: 'from-primary to-emerald-400',
                            bullets: [
                              'Driven by accelerator cohorts, venture-studio builds, and university partnerships.',
                              'Every startup is screened for IP potential, market fit, and capital-readiness.',
                              'Target: 25 in Q1 → 100 by Q4 through demo days and AI matchmaking.',
                            ],
                          },
                          {
                            icon: Users,
                            title: 'Membership Growth',
                            metric: '1,000 members',
                            tone: 'text-emerald-500',
                            bg: 'bg-emerald-500/10',
                            accent: 'from-emerald-500 to-teal-400',
                            bullets: [
                              'Tiered access for founders, mentors, investors, and corporate scouts.',
                              'Organic growth from events, referrals, and platform network effects.',
                              'Target: 180 members at launch → 1,000 active profiles by year end.',
                            ],
                          },
                          {
                            icon: Building2,
                            title: 'Corporate Engagement',
                            metric: '60 partners',
                            tone: 'text-violet-500',
                            bg: 'bg-violet-500/10',
                            accent: 'from-violet-500 to-fuchsia-400',
                            bullets: [
                              'Fortune 500 and regional enterprises join for innovation sprints and pilots.',
                              'Revenue streams include sponsorships, R&D contracts, and corporate memberships.',
                              'Target: 16 partners in Q1 → 60 strategic corporate relationships by Q4.',
                            ],
                          },
                          {
                            icon: DollarSign,
                            title: 'Network Capital',
                            metric: '$500M+',
                            tone: 'text-amber-500',
                            bg: 'bg-amber-500/10',
                            accent: 'from-amber-500 to-orange-400',
                            bullets: [
                              'Includes venture rounds, grants, and debt facilities across the portfolio.',
                              'Supported by LP introductions, demo days, and investor office hours.',
                              'Target: $80M deployed in Q1 → $500M+ in tracked capital by Q4.',
                            ],
                          },
                          {
                            icon: Globe2,
                            title: 'International Impact',
                            metric: '30 delegations',
                            tone: 'text-cyan-500',
                            bg: 'bg-cyan-500/10',
                            accent: 'from-cyan-500 to-blue-400',
                            bullets: [
                              'BDV channels bring global delegations, trade missions, and foreign investors.',
                              'Focus on LATAM, EU, and GCC corridors aligned with Orlando trade strengths.',
                              'Target: 6 international touchpoints in Q1 → 30 active engagements by Q4.',
                            ],
                          },
                          {
                            icon: Network,
                            title: 'Community & Facility',
                            metric: '360 touchpoints',
                            tone: 'text-rose-500',
                            bg: 'bg-rose-500/10',
                            accent: 'from-rose-500 to-pink-400',
                            bullets: [
                              'Weekly founder dinners, quarterly summits, and trade expos at the hub.',
                              'Facility convenes capital, talent, and enterprise buyers in one location.',
                              'Target: 40 events in Q1 → 360 total community touchpoints by year end.',
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
                  <PageFrame accent={NEON.cyan} code="12" label="REVENUE ARCHITECTURE" pageNum={13}>
                    <PageTitle kicker="12 · Business Models" title={<>A diversified <span style={{ color: NEON.cyan }}>revenue architecture</span> across twenty engines.</>} accent={NEON.cyan} />

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
                            icon: Users, c: NEON.cyan, code: '01', title: 'Access & Membership',
                            models: ['Membership subscriptions', 'Coworking & workspace', 'Community access', 'Franchising'],
                          },
                          {
                            icon: Rocket, c: NEON.magenta, code: '02', title: 'Venture & Startups',
                            models: ['Accelerator fees & equity', 'Venture studio builds', 'Venture capital carry', 'Corporate innovation programs'],
                          },
                          {
                            icon: GraduationCap, c: NEON.lime, code: '03', title: 'Knowledge & Media',
                            models: ['Education & training', 'Events & conferences', 'Strategic sponsorships', 'Media & content'],
                          },
                          {
                            icon: Cpu, c: NEON.amber, code: '04', title: 'Platform & Services',
                            models: ['Subscriptions', 'Referrals', 'Events', 'Transaction Fees'],
                          },
                          {
                            icon: Globe, c: '#a78bfa', code: '05', title: 'Global & Economic Development',
                            models: ['International soft-landing', 'Economic development', 'Trade & commerce', 'Managed innovation ecosystems'],
                          },
                        ].map((cat, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
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
                                  <div className="font-mono text-[8.5px] uppercase tracking-[0.3em]" style={{ color: cat.c }}>REVENUE NOTE · {cat.code}</div>
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
                                    whileInView={{ width: `${65 + idx * 5}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 0.4 + idx * 0.1, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${cat.c}, ${cat.c}90)`, boxShadow: `0 0 10px ${cat.c}` }}
                                  />
                                </div>
                                <div className="font-mono text-[8.5px] uppercase tracking-[0.25em]" style={{ color: cat.c }}>SFH · LEGAL TENDER</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Hybrid recommendation banner */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
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
                                <div className="font-mono text-[9px] uppercase tracking-[0.35em] mb-1" style={{ color: NEON.lime }}>Recommended Hybrid Model</div>
                                <div className="font-futuristic font-black text-[18px] leading-tight" style={PLATINUM_TITLE}>Nine integrated engines powering the BDV Innovation Hub</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 max-w-[55%]">
                              {['Membership','Innovation Platform','Corporate Innovation','Accelerator','Education','Events','International Trade','Workspace','Venture Capital'].map((tag, i) => (
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
                  <PageFrame accent={NEON.lime} code="13" label="GLOBAL VISIBILITY" pageNum={14}>
                    <PageTitle kicker="13 · Nasdaq Tower · Times Square" title={<>Featured on the <span style={{ color: NEON.lime }}>world's stage.</span></>} />

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
                      {/* Full-bleed hero image */}
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

                      {/* Top-left live badge */}
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                        style={{
                          background: 'rgba(2,4,10,0.65)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${NEON.lime}70`,
                          boxShadow: `0 0 18px ${NEON.lime}50`,
                        }}
                      >
                        <Radio className="h-3 w-3 animate-pulse" style={{ color: NEON.lime }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900">LIVE · TIMES SQUARE</span>
                      </motion.div>

                      {/* Bottom content panel */}
                      <div className="absolute inset-x-0 bottom-0 z-10 p-10">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                        >
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
                            Times Square broadcast —
                          </p>
                        </motion.div>

                        {/* Inline metric strip */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, duration: 0.6, staggerChildren: 0.08 }}
                          className="grid grid-cols-4 gap-3"
                        >
                          {[
                            { k: '350K+', l: 'Daily viewers' },
                            { k: 'NYC', l: 'Times Square' },
                            { k: 'Global', l: 'Press reach' },
                            { k: '24/7', l: 'Brand presence' },
                          ].map((m, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.6 + i * 0.08, duration: 0.45 }}
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
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
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

                      <div className="font-mono text-[11px] uppercase tracking-[0.45em] mb-6" style={{ color: NEON.cyan }}>// CLOSING TRANSMISSION</div>

                      <h1 className="font-futuristic font-black leading-[0.9] tracking-tight" style={{
                        fontSize: '88px',
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
                        Orlando's flagship for innovation and global commerce is ready to be built — together.
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
                        <span className="text-base font-bold tracking-[0.18em] uppercase text-slate-900">Schedule a Presentation</span>
                        <ArrowUpRight className="h-5 w-5" style={{ color: NEON.cyan }} />
                      </a>

                      <div className="mt-12 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />ORLANDO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.magenta }} />SANTIAGO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.lime }} />TOKYO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.amber }} />SEVILLA</div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
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
              <div className="w-full max-w-[700px] mx-auto flex flex-col gap-6">
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
