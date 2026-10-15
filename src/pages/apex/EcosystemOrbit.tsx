/**
 * Circular ecosystem animation (from the SFH deck "Ecosystem Overview" slide):
 * SFH logo in the middle, every platform player on a slowly rotating orbit.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef } from 'react';
import { Rocket, Diamond, Lightbulb, Award, GraduationCap, Building2, Handshake, Network } from 'lucide-react';

const PLAYERS = [
  { icon: Rocket, label: 'Startups' },
  { icon: Diamond, label: 'Investors' },
  { icon: Lightbulb, label: 'Mentors' },
  { icon: Award, label: 'Advisors' },
  { icon: GraduationCap, label: 'Students' },
  { icon: Building2, label: 'Accelerators' },
  { icon: Handshake, label: 'Corporates' },
  { icon: Network, label: 'Admins' },
];

export const EcosystemOrbit = ({ logo, size = 300 }: { logo: string; size?: number }) => {
  const c = size / 2;
  const r = size * 0.36;
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  // Positions are computed per frame so labels always stay upright and inside the circle.
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const off = ((t - t0) / 80000) * Math.PI * 2;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const a = (i / PLAYERS.length) * Math.PI * 2 - Math.PI / 2 + off;
        el.style.left = `${c + Math.cos(a) * r}px`;
        el.style.top = `${c + Math.sin(a) * r}px`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c, r]);
  return (
    <div data-bs-lock="" className="relative mx-auto shrink-0" style={{ width: size, height: size }}>
      <style>{`@keyframes eo-spin{to{transform:rotate(360deg)}}@keyframes eo-unspin{to{transform:translate(-50%,-50%) rotate(-360deg)}}`}</style>
      <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(14,165,183,0.35) 0%, rgba(15,23,42,0.95) 62%)', border: '1px solid rgba(94,234,212,0.25)' }} />
      <div className="absolute rounded-full" style={{ inset: size * 0.12, border: '1px dashed rgba(94,234,212,0.35)', animation: 'eo-spin 60s linear infinite' }} />
      <div className="absolute rounded-full" style={{ inset: size * 0.27, border: '1px solid rgba(110,231,183,0.25)' }} />
      <div className="absolute inset-0" style={{ animation: 'eo-spin 40s linear infinite' }}>
        <span className="absolute rounded-full" style={{ left: '50%', top: -4, width: 8, height: 8, background: '#5eead4', boxShadow: '0 0 14px #5eead4' }} />
      </div>
      <img src={logo} alt="Startup Factory Hub" className="absolute object-contain" style={{ left: '50%', top: '50%', width: size * 0.3, height: size * 0.3, transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 0 24px rgba(45,212,191,0.6))' }} />
      <div className="absolute inset-0">
        {PLAYERS.map((p, i) => {
          const a = (i / PLAYERS.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <div key={p.label} ref={(el) => { refs.current[i] = el; }} className="absolute flex flex-col items-center gap-0.5" style={{ left: c + Math.cos(a) * r, top: c + Math.sin(a) * r, transform: 'translate(-50%,-50%)' }}>
              <div className="rounded-full flex items-center justify-center" style={{ width: size * 0.12, height: size * 0.12, background: '#020617', border: '1px solid rgba(94,234,212,0.55)', boxShadow: '0 0 16px rgba(45,212,191,0.4)' }}>
                <p.icon style={{ width: size * 0.055, height: size * 0.055, color: '#5eead4' }} />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textShadow: '0 1px 4px #000' }}>{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
