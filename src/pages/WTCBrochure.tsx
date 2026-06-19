import { useState, useRef, useEffect, useCallback, forwardRef, Children } from 'react';
import {
  Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail,
  Network, BarChart3, GraduationCap, Building2, Diamond, Cpu, DollarSign,
  Handshake, MapPin, Star, Brain, Briefcase, ShieldCheck, Sparkles,
  Globe2, Scan, Box, Eye, Layers, QrCode, Wand2, Smartphone,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';
import conferenceHall from '@/assets/conference-hall-bg.webp';
import coworkingSpace from '@/assets/coworking-space.jpg';
import dashboardMockup from '@/assets/mockup-dashboard.png';

// ---- Matrix backdrop (same as Brochure) ----
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

// ---- Geometric overlays ----
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

const IconBadge = ({ icon: Icon, color = "teal" }: { icon: React.ComponentType<{ className?: string }>; color?: string }) => {
  const colorClasses: Record<string, string> = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  };
  return (
    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClasses[color] || colorClasses.teal}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
};

const TechCard = ({ children, className = "", glowColor = "teal" }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const ring: Record<string, string> = {
    teal: "ring-teal-500/20", cyan: "ring-cyan-500/20", emerald: "ring-emerald-500/20", amber: "ring-amber-500/20",
  };
  return (
    <div className={`relative tech-card border-0 ring-1 ${ring[glowColor] || ring.teal} backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
};

const SectionHeader = ({ kicker, title, color = "teal" }: { kicker: string; title: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-500 text-teal-400",
    cyan: "bg-cyan-500 text-cyan-400",
    amber: "bg-amber-500 text-amber-400",
    emerald: "bg-emerald-500 text-emerald-400",
  };
  const [dot, text] = colorMap[color].split(' ');
  return (
    <>
      <div className="flex items-center gap-2 justify-center mb-2">
        <div className={`w-2 h-2 ${dot} rotate-45`} />
        <span className={`text-[11px] font-semibold ${text} tracking-[0.3em] uppercase`}>{kicker}</span>
        <div className={`w-2 h-2 ${dot} rotate-45`} />
      </div>
      <h2 className="text-4xl font-bold text-white text-center mb-3">{title}</h2>
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-teal-500/60" />
        <Diamond className="h-3 w-3 text-teal-400" />
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-teal-500/60" />
      </div>
    </>
  );
};

// ---- A4 Portrait wrapper ----
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
    <div ref={containerRef} className="w-full bg-slate-950" style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
      <div style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: '50%',
        marginLeft: -(BASE_W / 2), marginTop: -(BASE_H / 2),
        transform: `scale(${scale})`, transformOrigin: 'center center',
      }}>
        <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
        <MatrixSymbolLayer density={0.07} columns={28} />
        <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm absolute inset-0 pointer-events-none" />
        {children}
      </div>
    </div>
  );
};

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="bg-slate-950 overflow-hidden">{children}</div>
));
BookPage.displayName = "BookPage";

// ---- Common page shell ----
const PageShell = ({ children, accent = "teal" }: { children: React.ReactNode; accent?: string }) => {
  const borderMap: Record<string, string> = {
    teal: "border-teal-500/30", cyan: "border-cyan-500/30", amber: "border-amber-500/30", emerald: "border-emerald-500/30",
  };
  return (
    <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className={`absolute inset-[0.8%] border ${borderMap[accent]} rounded-lg`} />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
        {children}
      </div>
    </section>
  );
};

export default function WTCBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(13);
  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

  useEffect(() => {
    document.title = "WTC × Startup Factory Hub — Innovation Hub Brochure";
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav bar */}
      <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={flipPrev} className="h-8 w-8 text-teal-400 hover:bg-teal-500/10" disabled={!flipbookSupported}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-teal-400 font-medium tracking-wide tabular-nums">
              {flipbookSupported
                ? `${String(currentPage + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`
                : `${String(totalPages).padStart(2, '0')} pages`}
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
        {(() => {
          const pages = (
            <>
              {/* ===== PAGE 1: COVER ===== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 flex flex-col items-center justify-between p-[6%] py-[8%] overflow-hidden">
                    <MatrixSymbolLayer density={0.22} columns={36} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(20,184,166,0.18) 0%, rgba(2,6,23,0.85) 55%, rgba(2,6,23,0.95) 100%)' }} />
                    <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(20,184,166,0.04) 3px, rgba(20,184,166,0.04) 4px)' }} />
                    <div className="absolute inset-[0.8%] border-2 border-teal-500/50 rounded-lg" />
                    <TechGrid /><FloatingHexagons /><EnergyLines /><CornerAccents />

                    <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-teal-400 pointer-events-none" />
                    <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-teal-400 pointer-events-none" />
                    <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-teal-400 pointer-events-none" />
                    <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-teal-400 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/15 border border-teal-500/50 rounded-full mb-2 backdrop-blur-sm shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                        <Star className="h-3 w-3 text-teal-300" />
                        <span className="text-[11px] font-bold text-teal-300 tracking-[0.35em] uppercase">Confidential · Joint Venture Proposal</span>
                        <Star className="h-3 w-3 text-teal-300" />
                      </div>
                      <div className="font-mono text-[10px] text-teal-500/70 tracking-[0.4em]">// JUNE 2026 // ORLANDO, FL //</div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-teal-500/40 blur-[80px] rounded-full scale-150" />
                        <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[300px] max-w-full object-contain drop-shadow-[0_0_60px_rgba(20,184,166,0.7)]" />
                      </div>

                      <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-teal-300/80 mb-2">In partnership with</div>
                      <h2 className="font-futuristic text-[26px] font-black tracking-[0.08em] uppercase bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
                        World Trade Center
                      </h2>
                      <h2 className="font-futuristic text-[22px] font-black tracking-[0.12em] uppercase text-white/80 mb-6">
                        Club Orlando
                      </h2>

                      <div className="relative tech-card border-0 ring-1 ring-teal-500/40 rounded-xl px-8 py-4 backdrop-blur-sm shadow-[0_0_40px_rgba(20,184,166,0.25)]">
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-teal-400" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-400" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-teal-400" />
                        <p className="font-futuristic text-lg font-black text-white tracking-[0.2em] mb-1">INNOVATION HUB</p>
                        <p className="text-xs text-slate-400 tracking-wide">Orlando's flagship for innovation & global commerce</p>
                      </div>
                    </div>

                    <div className="relative z-10 w-full">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center">
                          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal-400/70">Prepared for</div>
                          <div className="mt-1 text-xs text-white/80">Leadership · WTC Club Orlando</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal-400/70">Prepared by</div>
                          <div className="mt-1 text-xs text-white/80">Startup Factory Hub Accelerator</div>
                        </div>
                      </div>
                      <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm w-full flex items-center justify-between px-4 py-2 border-t border-b">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="font-mono text-[10px] text-emerald-300 tracking-widest">PROPOSAL READY</span>
                        </div>
                        <span className="font-mono text-[10px] text-teal-400/80 tracking-widest">// JV · 50/50 //</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-cyan-300 tracking-widest">CONFIDENTIAL</span>
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </section>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 2: EXECUTIVE SUMMARY ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="01 · Executive Summary" title="A first-of-its-kind innovation destination" />

                    <TechCard glowColor="teal" className="mb-3">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={Rocket} color="teal" />
                        <p className="text-[14px] text-slate-200 leading-relaxed flex-1">
                          Startup Factory Hub Accelerator proposes a strategic <span className="text-teal-400 font-bold">Joint Venture</span> with the <span className="text-white font-semibold">World Trade Center Club Orlando</span> to create the <span className="text-white font-semibold">WTC Innovation Hub powered by Startup Factory Hub</span> — a premier destination for entrepreneurship, international trade, investment, and corporate collaboration.
                        </p>
                      </div>
                    </TechCard>

                    <TechCard glowColor="cyan" className="mb-3">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={Network} color="cyan" />
                        <p className="text-[14px] text-slate-200 leading-relaxed flex-1">
                          The Joint Venture will establish a <span className="text-cyan-400 font-semibold">globally connected innovation ecosystem</span> designed to accelerate startup growth, foster corporate innovation, attract investment, and generate measurable economic impact across Central Florida.
                        </p>
                      </div>
                    </TechCard>

                    <TechCard glowColor="emerald" className="mb-4">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={Handshake} color="emerald" />
                        <p className="text-[14px] text-slate-200 leading-relaxed flex-1">
                          By combining the <span className="text-emerald-400 font-semibold">prestige and global reach of the World Trade Center</span> with the accelerator capabilities of Startup Factory Hub, the partnership creates a first-of-its-kind platform where founders, corporations, investors, universities, government, and international organizations converge.
                        </p>
                      </div>
                    </TechCard>

                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { icon: Rocket, label: "Entrepreneurship" },
                        { icon: Globe2, label: "Gateway" },
                        { icon: Building2, label: "Corporate" },
                        { icon: DollarSign, label: "Capital" },
                      ].map((p, i) => (
                        <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm flex flex-col items-center gap-1.5 rounded-lg py-3 px-2">
                          <IconBadge icon={p.icon} color="teal" />
                          <span className="text-[12px] font-semibold text-slate-300 text-center tracking-wide">{p.label}</span>
                        </div>
                      ))}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 3: STRATEGIC PARTNERSHIP ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell accent="cyan">
                    <SectionHeader kicker="02 · Strategic Partnership" title="A transformative public–private platform" color="cyan" />

                    <TechCard glowColor="cyan" className="mb-3">
                      <p className="text-[14px] text-slate-200 leading-relaxed">
                        The WTC Club Orlando and Startup Factory Hub have a unique opportunity to establish a <span className="text-cyan-400 font-semibold">transformative public-private innovation platform</span> that positions Orlando as a leading destination for entrepreneurship, global commerce, investment, and corporate innovation.
                      </p>
                    </TechCard>

                    <TechCard glowColor="teal" className="mb-4">
                      <p className="text-[14px] text-slate-200 leading-relaxed">
                        Rather than a traditional service-provider relationship, this initiative is envisioned as a <span className="text-teal-400 font-semibold">strategic Joint Venture</span> in which both organizations contribute complementary assets, capabilities, networks, and expertise to co-create a world-class innovation ecosystem.
                      </p>
                    </TechCard>

                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-400/70 text-center mb-3">Four Strategic Pillars</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Rocket, label: "Entrepreneurship", body: "Orlando's center for startup growth", color: "teal" },
                        { icon: Globe2, label: "Gateway", body: "International companies entering the U.S.", color: "cyan" },
                        { icon: Building2, label: "Corporate", body: "Industry collaboration & innovation", color: "emerald" },
                        { icon: DollarSign, label: "Capital", body: "Investor deal flow & venture formation", color: "amber" },
                      ].map((p, i) => (
                        <TechCard key={i} glowColor={p.color}>
                          <div className="flex items-start gap-3">
                            <IconBadge icon={p.icon} color={p.color} />
                            <div>
                              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">{p.label}</div>
                              <div className="text-[13px] text-slate-200 mt-1">{p.body}</div>
                            </div>
                          </div>
                        </TechCard>
                      ))}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 4: FOUNDING PRINCIPLES ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="03 · Founding Principles" title="Built for long-term impact" />

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Handshake, title: "Equal Strategic Partnership", body: "Both organizations participate as equal strategic partners committed to long-term success." },
                        { icon: Users, title: "Shared Governance", body: "Strategic decisions made jointly through an agreed governance structure ensuring alignment & accountability." },
                        { icon: TrendingUp, title: "Shared Value Creation", body: "Both organizations participate in the economic and strategic value created through the Joint Venture." },
                        { icon: Lightbulb, title: "Complementary Contributions", body: "Each partner contributes unique capabilities that combined create greater value than either alone." },
                        { icon: Building2, title: "Long-Term Institutional Development", body: "Building a permanent innovation institution serving Central Florida and global business." },
                        { icon: ShieldCheck, title: "Mutual Accountability", body: "Transparent reporting, shared KPIs, and joint review of strategic and operational outcomes." },
                      ].map((p, i) => (
                        <div key={i} className="relative tech-card border-0 ring-1 ring-teal-500/25 backdrop-blur-sm rounded-lg p-4 group hover:ring-teal-400/60 transition-all">
                          <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-teal-400" />
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-teal-400" />
                          <span className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-teal-400 opacity-60" />
                          <span className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-teal-400 opacity-60" />
                          <div className="flex items-start gap-3">
                            <IconBadge icon={p.icon} color="teal" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-teal-400/70 tracking-widest">P/{String(i + 1).padStart(2, '0')}</span>
                              </div>
                              <h3 className="text-sm font-bold text-white mt-1 leading-tight">{p.title}</h3>
                              <p className="text-[12px] text-slate-300 leading-snug mt-1.5">{p.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 5: STRATEGIC RATIONALE ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell accent="amber">
                    <SectionHeader kicker="04 · Strategic Rationale" title="Orlando has the growth. It needs the convergence." color="amber" />

                    <p className="text-sm text-center text-slate-300 mb-5 max-w-2xl mx-auto leading-relaxed">
                      Global competitiveness depends on innovation ecosystems that connect <span className="text-amber-400 font-semibold">entrepreneurs, capital, corporations, talent, and international markets</span>. Orlando lacks a centralized destination integrating these stakeholders within one globally connected platform.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Rocket, title: "Startup creation & acceleration" },
                        { icon: Building2, title: "Corporate innovation & adoption" },
                        { icon: TrendingUp, title: "Venture capital formation" },
                        { icon: Globe2, title: "International trade expansion" },
                        { icon: Users, title: "Economic development & jobs" },
                        { icon: Network, title: "Academic & government collaboration" },
                      ].map((p, i) => (
                        <TechCard key={i} glowColor="amber" className="text-center">
                          <div className="flex flex-col items-center gap-2">
                            <IconBadge icon={p.icon} color="amber" />
                            <h3 className="text-[13px] font-bold text-white leading-tight">{p.title}</h3>
                          </div>
                        </TechCard>
                      ))}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 6: VISION & MISSION ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="05 · Vision & Mission" title="A globally recognized center" />

                    <div className="grid grid-cols-1 gap-5">
                      <TechCard glowColor="teal" className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="h-4 w-4 text-teal-400" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-400">Vision</span>
                        </div>
                        <p className="text-xl text-white leading-tight font-light">
                          To establish Orlando as a <span className="text-teal-400 italic font-semibold">globally recognized center</span> for entrepreneurship, innovation, international business, investment, and economic development.
                        </p>
                      </TechCard>

                      <TechCard glowColor="cyan" className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-cyan-400" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">Mission</span>
                        </div>
                        <p className="text-xl text-white leading-tight font-light">
                          To build a world-class ecosystem that empowers founders, corporations, investors, and international organizations to <span className="text-cyan-400 italic font-semibold">connect, collaborate, and grow.</span>
                        </p>
                      </TechCard>
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 7: JV STRUCTURE 50/50 ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="06 · Joint Venture Structure" title="An equal strategic partnership" />
                    <p className="text-sm text-center text-slate-300 mb-6 max-w-2xl mx-auto">
                      A dedicated operating entity will develop, manage, and expand the Innovation Hub, its programs, partnerships, and revenue opportunities.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <TechCard glowColor="teal" className="p-6 text-center">
                        <Building2 className="h-7 w-7 text-teal-400 mx-auto mb-3" />
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 mb-1">Partner</div>
                        <div className="text-base text-white font-semibold mb-4">WTC Club Orlando</div>
                        <div className="text-6xl font-black bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">50%</div>
                        <div className="text-xs text-slate-400 mt-2">Ownership Interest</div>
                      </TechCard>
                      <TechCard glowColor="cyan" className="p-6 text-center">
                        <Rocket className="h-7 w-7 text-cyan-400 mx-auto mb-3" />
                        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50 mb-1">Partner</div>
                        <div className="text-base text-white font-semibold mb-4">Startup Factory Hub</div>
                        <div className="text-6xl font-black bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">50%</div>
                        <div className="text-xs text-slate-400 mt-2">Ownership Interest</div>
                      </TechCard>
                    </div>

                    <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg p-4 text-center">
                      <p className="text-xs text-slate-300">
                        Reflecting the <span className="text-teal-400 font-semibold">complementary strategic assets</span>, capabilities, and long-term commitments contributed by each organization.
                      </p>
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 8: STRATEGIC CONTRIBUTIONS ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="07 · Strategic Contributions" title="Two organizations. Complementary strengths." />

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          org: "WTC Club Orlando", code: "WTC", icon: Globe2,
                          tag: "Institutional · Physical · International",
                          items: [
                            { icon: Building2, label: "Premium HQ & Facilities" },
                            { icon: Briefcase, label: "Executive Meeting Spaces" },
                            { icon: Network, label: "WTC Global Network Access" },
                            { icon: Handshake, label: "Trade Relationships" },
                            { icon: Users, label: "Corporate Membership" },
                            { icon: ShieldCheck, label: "Government Relations" },
                            { icon: Award, label: "Global Brand Credibility" },
                            { icon: MapPin, label: "International Delegations" },
                          ],
                        },
                        {
                          org: "Startup Factory Hub", code: "SFH", icon: Rocket,
                          tag: "Entrepreneurial · Platform · Ecosystem",
                          items: [
                            { icon: Rocket, label: "Accelerator Operations" },
                            { icon: Target, label: "Startup Recruitment" },
                            { icon: GraduationCap, label: "Mentor Network" },
                            { icon: DollarSign, label: "Investor Relations" },
                            { icon: Lightbulb, label: "Corporate Innovation" },
                            { icon: BarChart3, label: "Executive Programming" },
                            { icon: Cpu, label: "Digital Platform" },
                            { icon: TrendingUp, label: "Marketing & Growth" },
                          ],
                        },
                      ].map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.code} className="relative tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal-400/70">{card.tag}</div>
                                  <h3 className="text-base font-bold text-white mt-1">{card.org}</h3>
                                </div>
                                <div className="w-9 h-9 rounded-lg border border-teal-500/40 bg-teal-500/10 flex items-center justify-center">
                                  <Icon className="h-4 w-4 text-teal-400" />
                                </div>
                              </div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-teal-400">
                                {card.code}–{String(card.items.length).padStart(2, '0')} Capabilities
                              </div>
                            </div>
                            <div className="p-2 grid grid-cols-1 gap-1">
                              {card.items.map((item, i) => {
                                const ItemIcon = item.icon;
                                return (
                                  <div key={i} className="flex items-center gap-2 p-1.5 rounded hover:bg-teal-500/5">
                                    <span className="font-mono text-[9px] text-teal-500/60 w-5">{String(i + 1).padStart(2, '0')}</span>
                                    <ItemIcon className="h-3 w-3 text-teal-400 shrink-0" />
                                    <span className="text-[12px] text-slate-200">{item.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 9: TRACK RECORD ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell accent="cyan">
                    <SectionHeader kicker="08 · Track Record" title="A proven accelerator — recognized globally" color="cyan" />

                    <div className="tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-sm rounded-lg overflow-hidden mb-4">
                      <div className="flex items-center gap-3 p-3 bg-teal-500/5">
                        <div className="shrink-0 overflow-hidden rounded border border-teal-500/40">
                          <img src={nasdaqFeature} alt="Nasdaq" className="h-14 w-24 object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal-400/70">As Featured On</div>
                          <div className="text-base font-bold text-white">Nasdaq — <span className="text-teal-400">World's Leading Accelerator Platform</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: Users, value: "4,000+", label: "Central Florida Network" },
                        { icon: Rocket, value: "40+", label: "Startups Accelerated" },
                        { icon: DollarSign, value: "$200M", label: "Capital Raised" },
                      ].map((m, i) => (
                        <TechCard key={i} glowColor="teal" className="text-center">
                          <m.icon className="h-5 w-5 text-teal-400 mx-auto mb-2" />
                          <div className="text-3xl font-black bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">{m.value}</div>
                          <div className="text-[11px] text-slate-300 mt-1 font-semibold">{m.label}</div>
                        </TechCard>
                      ))}
                    </div>

                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/70 text-center mb-3">Platform Community</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Mentors", value: "150+" },
                        { label: "Startups", value: "40+" },
                        { label: "Investors", value: "300+" },
                        { label: "Interns", value: "200+" },
                        { label: "Legacy Startups", value: "120+" },
                        { label: "Investor Directory", value: "1,500+" },
                      ].map((s) => (
                        <div key={s.label} className="tech-card border-0 ring-1 ring-cyan-500/25 backdrop-blur-sm rounded-lg p-3">
                          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">{s.label}</div>
                          <div className="text-xl font-bold text-cyan-300 mt-1">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-400/70 text-center mb-2">Network Partners</div>
                    <div className="grid grid-cols-6 gap-1">
                      {["UCF", "Orlando EP", "StarterStudio", "Florida HTC", "FundRise", "NVIDIA Inception", "AWS Activate", "MS Startups", "Google Startups", "Stripe", "HubSpot", "Nasdaq"].map((n) => (
                        <div key={n} className="h-10 flex items-center justify-center bg-teal-500/5 border border-teal-500/15 rounded text-[10px] text-slate-300 text-center px-1 font-semibold">
                          {n}
                        </div>
                      ))}
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 10: OPERATING MODEL ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="09 · Operating Model" title="SFH as Innovation Operating Partner" />
                    <p className="text-sm text-center text-slate-300 mb-5 max-w-2xl mx-auto">
                      Startup Factory Hub leads day-to-day activation and management of the Innovation Hub.
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: Rocket, title: "Accelerator Ops", body: "Program design & execution end-to-end." },
                        { icon: Users, title: "Community", body: "Ecosystem development & activation." },
                        { icon: Briefcase, title: "Membership", body: "Acquisition and long-term retention." },
                        { icon: Sparkles, title: "Events", body: "Signature events and conferences." },
                        { icon: TrendingUp, title: "Investor Relations", body: "Capital access initiatives." },
                        { icon: Building2, title: "Corporate Innovation", body: "Programs for enterprise partners." },
                        { icon: Handshake, title: "Partnerships", body: "Sponsorships and alliances." },
                        { icon: Target, title: "Founder Success", body: "Startup support services." },
                        { icon: Network, title: "Communications", body: "Marketing and ecosystem voice." },
                      ].map((p, i) => (
                        <TechCard key={i} glowColor="teal">
                          <p.icon className="h-4 w-4 text-teal-400 mb-2" />
                          <h3 className="text-[13px] font-bold text-white leading-tight">{p.title}</h3>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">{p.body}</p>
                        </TechCard>
                      ))}
                    </div>

                    <div className="tech-card border-0 ring-1 ring-cyan-500/40 backdrop-blur-sm rounded-lg p-4 bg-cyan-500/[0.04]">
                      <div className="flex items-start gap-3">
                        <IconBadge icon={ShieldCheck} color="cyan" />
                        <div>
                          <h3 className="text-sm font-bold text-white">WTC Club Orlando provides</h3>
                          <p className="text-[12px] text-slate-300 mt-1 leading-relaxed">
                            Strategic oversight, facility infrastructure, international business engagement, and executive relationship development. Both organizations jointly oversee strategy, governance, financial performance, and long-term expansion.
                          </p>
                        </div>
                      </div>
                    </div>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 11: ONLINE PLATFORM + AR ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell accent="cyan">
                    <SectionHeader kicker="10 · Platform & AR" title="A proprietary digital layer beyond the walls" color="cyan" />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <TechCard glowColor="cyan" className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Scan className="h-4 w-4 text-cyan-400" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400">AR Experience</span>
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight">Point. Scan. Step inside the Innovation Hub.</h3>
                        <p className="text-[12px] text-slate-300 mt-2 leading-relaxed">
                          Any smartphone becomes a portal. Through markerless AR and QR-anchored experiences, members visualize startup portfolios in 3D, walk through virtual booths, and explore the WTC global network as an interactive world map.
                        </p>
                      </TechCard>

                      <TechCard glowColor="teal" className="p-0 overflow-hidden">
                        <div className="relative h-32 overflow-hidden">
                          <img src={dashboardMockup} alt="Platform" className="w-full h-full object-cover object-top" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Cpu className="h-4 w-4 text-teal-400" />
                            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-teal-400">Online Platform</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">SFH Digital Infrastructure</h3>
                          <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
                            <li>• Member, founder & investor portals</li>
                            <li>• Live deal flow & startup discovery</li>
                            <li>• AI-powered matchmaking</li>
                            <li>• Global WTC directory access</li>
                          </ul>
                        </div>
                      </TechCard>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { icon: Smartphone, title: "Mobile-First AR", body: "WebAR launches instantly — no install." },
                        { icon: Box, title: "3D Booths", body: "Portfolio companies as 3D pavilions." },
                        { icon: Globe2, title: "Global Network Map", body: "WTC's 300+ cities as 3D globe." },
                        { icon: Wand2, title: "Event Activations", body: "AR signage & holographic speakers." },
                      ].map((p, i) => (
                        <TechCard key={i} glowColor="cyan">
                          <p.icon className="h-4 w-4 text-cyan-400 mb-1.5" />
                          <h3 className="text-[12px] font-bold text-white leading-tight">{p.title}</h3>
                          <p className="text-[10.5px] text-slate-300 mt-1 leading-snug">{p.body}</p>
                        </TechCard>
                      ))}
                    </div>

                    <p className="mt-4 text-center text-sm italic text-cyan-300/90 font-light">
                      "Where the physical, digital, and augmented realities of global commerce converge."
                    </p>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 12: WORKSPACE ===== */}
              <BookPage>
                <A4Wrapper>
                  <PageShell>
                    <SectionHeader kicker="11 · Workspace Ecosystem" title="Local prestige. Global access." />

                    <div className="tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-sm rounded-lg overflow-hidden">
                      <div className="relative h-56 overflow-hidden">
                        <img src={coworkingSpace} alt="Innovation hub workspace" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal-300">Flagship Destination</div>
                          <h3 className="text-2xl font-bold text-white">World Trade Center Club Orlando</h3>
                        </div>
                      </div>
                      <div className="p-5 grid grid-cols-2 gap-3">
                        {[
                          { icon: Rocket, label: "Innovation & entrepreneurship" },
                          { icon: Users, label: "Executive networking" },
                          { icon: Globe2, label: "International trade & diplomacy" },
                          { icon: DollarSign, label: "Investor engagement" },
                          { icon: Building2, label: "Corporate collaboration" },
                          { icon: Sparkles, label: "Signature events & conferences" },
                        ].map((b, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded bg-teal-500/5 border border-teal-500/15">
                            <b.icon className="h-4 w-4 text-teal-400 shrink-0" />
                            <span className="text-[13px] text-slate-200">{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="mt-5 text-center text-base italic text-teal-300/90 font-light">
                      "A combined platform with a value proposition unmatched within the Central Florida market."
                    </p>
                  </PageShell>
                </A4Wrapper>
              </BookPage>

              {/* ===== PAGE 13: CTA ===== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 flex flex-col items-center justify-center p-[6%] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
                    <div className="absolute inset-[0.8%] border border-teal-500/40 rounded-lg" />
                    <TechGrid /><FloatingHexagons /><EnergyLines /><CornerAccents />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.15), transparent 60%)' }} />

                    <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/15 border border-teal-500/40 rounded-full mb-5">
                        <Star className="h-3 w-3 text-teal-400" />
                        <span className="text-[11px] font-bold text-teal-400 tracking-[0.3em] uppercase">Next Step</span>
                        <Star className="h-3 w-3 text-teal-400" />
                      </div>

                      <h2 className="text-3xl font-black text-white leading-tight mb-3">
                        Let's build Orlando's flagship for{' '}
                        <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent italic">
                          innovation and global commerce.
                        </span>
                      </h2>
                      <p className="text-sm text-slate-300 mb-7 leading-relaxed">
                        We welcome the opportunity to present this proposal in person to the leadership of the World Trade Center Club Orlando and discuss the path forward.
                      </p>

                      <a
                        href="mailto:partnerships@startupfactoryhub.com"
                        className="tech-card border-0 ring-1 ring-teal-500/40 backdrop-blur-sm inline-flex items-center gap-3 px-6 py-4 rounded-xl hover:ring-teal-400 transition mb-6 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
                      >
                        <Mail className="h-5 w-5 text-teal-400" />
                        <span className="text-sm text-white font-semibold tracking-wider">Schedule a Presentation</span>
                      </a>

                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full scale-150" />
                        <img src={sfhLogo} alt="SFH" className="relative w-20 h-20 object-contain" />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-3 w-3 text-cyan-400" />
                        <span className="text-xs text-slate-400">Orlando · Santiago · Tokyo · Sevilla</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono tracking-widest">// startupfactoryhub.com //</p>
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
