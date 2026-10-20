/**
 * APEX brochure page 04 — "The cost of fragmented ecosystems" (system-audit design).
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import { Building2, Rocket, ArrowUpRight, Check, Coins, Compass, EyeOff, FileSpreadsheet, FolderOpen, Gift, GraduationCap, Handshake, Library, Mail, Search, Triangle, Users } from 'lucide-react';
import { ScaledA4 } from './PartnersPages';
import { loadFlipFonts } from '@/components/brochure-studio/fonts';

const MONO = "'JetBrains Mono', monospace";
const HEAD = "'Space Grotesk', 'Inter', sans-serif";
const BODY = "'Inter', sans-serif";
const V = '#7C3AED';

const mono = (size: number, color = '#8B8B8B', extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: MONO, fontSize: size, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color, ...extra,
});

const NoSync = ({ style, vertical }: { style: React.CSSProperties; vertical?: boolean }) => (
  <div className="absolute flex items-center gap-[5px] rounded-full bg-white" style={{
    border: '1px solid #FECACA', padding: vertical ? '8px 4px' : '4px 10px', boxShadow: '0 2px 8px rgba(239,68,68,0.12)',
    writingMode: vertical ? 'vertical-rl' : undefined, ...style,
  }}>
    <span className="rounded-full" style={{ width: 5, height: 5, background: '#EF4444' }} />
    <span style={mono(9, '#DC2626', { letterSpacing: '0.1em' })}>No sync</span>
  </div>
);

const Tool = ({ icon: I, label, tint, style, children, rot }: { icon: typeof Mail; label: string; tint: string; style: React.CSSProperties; children?: React.ReactNode; rot: number }) => (
  <div className="absolute rounded-[12px] bg-white" style={{ width: 160, padding: 12, border: '1px solid #E8E8E6', boxShadow: '0 6px 18px rgba(15,23,42,0.07)', transform: `rotate(${rot}deg)`, ...style }}>
    <div className="flex items-center justify-between mb-[10px]">
      <span className="flex items-center justify-center rounded-[8px]" style={{ width: 26, height: 26, background: `${tint}18`, color: tint }}><I size={13} /></span>
      <span className="rounded-full" style={{ width: 6, height: 6, background: tint }} />
    </div>
    {children}
    <div className="flex items-center justify-between mt-[10px]">
      <span style={mono(10, '#1F2937', { letterSpacing: '0.1em' })}>{label}</span>
      <ArrowUpRight size={11} color="#9CA3AF" />
    </div>
  </div>
);

const bar = (w: string) => <div className="rounded-full mb-[5px]" style={{ height: 4, width: w, background: '#ECECEA' }} />;

const PROBLEMS = [
  { icon: Search, tint: V, title: 'Missed connections', text: 'Founders struggle to find the right investors, mentors and partners for their stage.' },
  { icon: Users, tint: '#2563EB', title: 'Isolated players', text: 'Investors, mentors and corporates each work in their own circle, unaware of each other.' },
  { icon: Compass, tint: '#D97706', title: 'Duplicated effort', text: 'Programs and partners repeat work because no one sees what others already offer.' },
  { icon: EyeOff, tint: '#DC2626', title: 'No shared view', text: 'APEX cannot see how players interact, or which connections drive outcomes.' },
];

const PILLARS = [
  { icon: Coins, t: 'Funding', d: 'Capital stack' },
  { icon: GraduationCap, t: 'Mentorship', d: 'Guided growth' },
  { icon: Library, t: 'Resources', d: 'Stack & docs' },
  { icon: Handshake, t: 'Partners', d: 'Expert network' },
];

export const FragmentedToolsPage = ({ total }: { total: string }) => {
  loadFlipFonts(['Inter', 'JetBrains Mono', 'Space Grotesk']);
  return (
    <ScaledA4>
      <div className="absolute inset-0 flex flex-col [&>*]:shrink-0" style={{ background: '#FFFFFF', fontFamily: BODY }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#7C3AED,#3B82F6,#06B6D4)' }} />
        <div className="flex items-center justify-between" style={{ padding: '22px 40px 0' }}>
          <span className="flex items-center gap-[8px]" style={mono(10)}><span className="rounded-full" style={{ width: 6, height: 6, background: '#A78BFA' }} />Ecosystem audit — fragmentation</span>
          <span style={mono(10)}>04 / {total} · The opportunity</span>
        </div>
        <div className="flex justify-center" style={{ marginTop: 18 }}>
          <span className="flex items-center gap-[10px] rounded-full" style={{ padding: '7px 16px', background: V, boxShadow: '0 6px 18px rgba(124,58,237,0.35)', ...mono(10, '#FFFFFF') }}>
            <span className="rounded-full bg-white" style={{ width: 5, height: 5 }} />The opportunity · APEX Accelerators
          </span>
        </div>

        <div style={{ padding: '24px 52px 0' }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 52, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.03em', color: '#0A0A0A' }}>The cost of<br />fragmented ecosystems</h2>
          <p style={{ marginTop: 18, maxWidth: '58ch', fontSize: 18, lineHeight: 1.6, color: '#3F3F46' }}>
            Startups, investors, mentors, corporates, government and support programs all work toward the same goal, but rarely connect with each other. Each player operates in its own silo. This creates four problems.
          </p>
        </div>

        {/* Disconnected tools diagram */}
        <div className="relative mx-[30px] rounded-[20px]" style={{ marginTop: 20, height: 262, background: '#FAFAF8', border: '1px solid #ECECEA', backgroundImage: 'radial-gradient(#E4E4E0 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <line x1="200" y1="80" x2="580" y2="80" stroke="#D4D4D0" strokeDasharray="5 5" />
            <line x1="200" y1="196" x2="580" y2="196" stroke="#D4D4D0" strokeDasharray="5 5" />
          </svg>
          <Tool icon={Rocket} label="Startups" tint="#7C3AED" rot={-1.2} style={{ left: 40, top: 24 }}>{bar('80%')}{bar('55%')}</Tool>
          <Tool icon={Coins} label="Investors" tint="#16A34A" rot={1.2} style={{ left: 40, top: 130 }}>{bar('65%')}{bar('40%')}</Tool>
          <Tool icon={GraduationCap} label="Mentors" tint="#2563EB" rot={1.4} style={{ right: 40, top: 24 }}>{bar('70%')}{bar('45%')}</Tool>
          <Tool icon={Building2} label="Corporates" tint="#EF4444" rot={-1.5} style={{ right: 40, top: 130 }}>{bar('60%')}{bar('35%')}</Tool>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full" style={{ width: 92, height: 92, border: '1px dashed #E0E0DC' }}>
            <div className="flex items-center justify-center rounded-full" style={{ width: 54, height: 54, background: '#EEF2FF', border: '1px solid #E0E7FF' }}><Triangle size={18} color="#0A0A0A" /></div>
          </div>
          <NoSync style={{ left: '50%', top: 68, transform: 'translateX(-50%)' }} />
          <NoSync style={{ left: '50%', top: 184, transform: 'translateX(-50%)' }} />
          <NoSync vertical style={{ left: 120, top: 92 }} />
          <NoSync vertical style={{ right: 120, top: 92 }} />
        </div>

        {/* Four problems */}
        <div className="flex items-center gap-[12px]" style={{ padding: '18px 34px 10px' }}>
          <span style={mono(9.5)}>Identified friction</span>
          <span className="flex-1" style={{ height: 1, background: '#E8E8E6' }} />
          <span className="rounded-full" style={{ padding: '3px 10px', border: '1px solid #DDD6FE', background: '#F5F3FF', ...mono(9, V) }}>4 issues</span>
        </div>
        <div className="grid grid-cols-2 gap-[12px]" style={{ padding: '0 34px' }}>
          {PROBLEMS.map(({ icon: I, tint, title, text }, i) => (
            <div key={title} className="rounded-[14px] bg-white" style={{ padding: '14px 20px', border: '1px solid #E8E8E6' }}>
              <div className="flex items-center gap-[10px]">
                <span className="flex items-center justify-center rounded-[8px]" style={{ width: 30, height: 30, background: `${tint}14`, color: tint }}><I size={14} /></span>
                <span style={mono(10.5, V)}>0{i + 1}</span>
                <ArrowUpRight size={13} color="#C4C4C0" className="ml-auto" />
              </div>
              <div style={{ marginTop: 10, fontFamily: HEAD, fontSize: 17, fontWeight: 600, color: '#0A0A0A' }}>{title}</div>
              <p style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: '#3F3F46' }}>{text}</p>
              <div style={{ marginTop: 12, height: 2, background: 'linear-gradient(90deg,#C4B5FD,transparent)' }} />
            </div>
          ))}
        </div>

        {/* Integrated platform strip */}
        <div className="mt-auto" style={{ background: 'linear-gradient(135deg,#0B0B12,#111827 60%,#0B1A1F)', borderTop: '1px solid #7C3AED', padding: '20px 34px 18px' }}>
          <div className="flex items-center gap-[12px]">
            <span className="flex items-center gap-[8px] rounded-full" style={{ padding: '5px 12px', border: '1px solid rgba(255,255,255,0.15)', ...mono(9.5, '#E5E7EB') }}><span className="rounded-full" style={{ width: 5, height: 5, background: '#22D3EE' }} />Integrated platform</span>
            <span style={mono(9.5, '#6B7280', { textTransform: 'none', letterSpacing: '0.04em' })}>— Connects every ecosystem player</span>
          </div>
          <div className="grid grid-cols-4" style={{ marginTop: 18 }}>
            {PILLARS.map(({ icon: I, t, d }) => (
              <div key={t}>
                <span className="flex items-center justify-center rounded-[8px]" style={{ width: 28, height: 28, border: '1px solid rgba(255,255,255,0.18)', color: '#F9FAFB' }}><I size={13} /></span>
                <div style={{ marginTop: 10, fontFamily: HEAD, fontSize: 14, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F9FAFB' }}>{t}</div>
                <div style={{ marginTop: 2, ...mono(9.5, '#6B7280', { textTransform: 'none', letterSpacing: '0.04em' }) }}>{d}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-[12px]" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: '#3B82F6' }}><Check size={11} color="#fff" /></span>
            <span style={{ fontSize: 13, color: '#E5E7EB' }}>One connected ecosystem for every player</span>
          </div>
        </div>
        <div className="flex items-center justify-between" style={{ padding: '12px 34px', background: '#FCFCFA', borderTop: '1px solid #E8E8E6' }}>
          <span style={mono(9)}>Startup Factory Hub × APEX Accelerators</span>
          <span style={mono(9)}>{total} pp.</span>
        </div>
      </div>
    </ScaledA4>
  );
};
