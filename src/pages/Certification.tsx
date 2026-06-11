import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Printer, Download, Award, Star, Diamond, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import spacelyLogoAsset from '@/assets/spacely-logo.png.asset.json';

export default function Certification() {
  const navigate = useNavigate();
  const [name, setName] = useState('Nombre del Participante');
  const [date, setDate] = useState(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [program, setProgram] = useState('Tecnologías Convergentes para la Economía Digital y Espacial');
  const [hours, setHours] = useState('40');
  const [code, setCode] = useState(`SFH-ACA-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Inicio</span>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/brochure-academia')} className="text-teal-400 hover:bg-teal-500/10">
            Brochure
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* Editor — hidden on print */}
      <div className="print:hidden pt-20 pb-6 px-6 max-w-[1200px] mx-auto">
        <div className="tech-card border-0 ring-1 ring-teal-500/20 rounded-lg p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-teal-400 tracking-widest uppercase">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-900 border-slate-700" />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs text-teal-400 tracking-widest uppercase">Programa</Label>
            <Input value={program} onChange={(e) => setProgram(e.target.value)} className="bg-slate-900 border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-teal-400 tracking-widest uppercase">Horas</Label>
            <Input value={hours} onChange={(e) => setHours(e.target.value)} className="bg-slate-900 border-slate-700" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-teal-400 tracking-widest uppercase">Fecha</Label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-900 border-slate-700" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs text-teal-400 tracking-widest uppercase">Código de certificación</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="bg-slate-900 border-slate-700 font-mono" />
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="px-4 pb-16 print:p-0 flex justify-center">
        <div
          id="certificate"
          className="cert-sheet relative bg-slate-950 text-white shadow-2xl print:shadow-none"
          style={{
            width: '297mm',
            height: '210mm',
            background: 'radial-gradient(ellipse at top, #0b1a2a 0%, #02060f 60%, #000 100%)',
          }}
        >
          {/* Outer gold/teal frame */}
          <div className="absolute inset-[8mm] border-[3px] border-teal-500/60 rounded-md" />
          <div className="absolute inset-[10mm] border border-amber-400/40 rounded-sm" />

          {/* Decorative corners */}
          {[
            'top-[10mm] left-[10mm]',
            'top-[10mm] right-[10mm]',
            'bottom-[10mm] left-[10mm]',
            'bottom-[10mm] right-[10mm]',
          ].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-16 h-16 pointer-events-none`}>
              <div className="absolute inset-0 border-2 border-amber-400/80" style={{
                clipPath: i === 0 ? 'polygon(0 0, 100% 0, 100% 8%, 8% 8%, 8% 100%, 0 100%)' :
                          i === 1 ? 'polygon(100% 0, 100% 100%, 92% 100%, 92% 8%, 0 8%, 0 0)' :
                          i === 2 ? 'polygon(0 100%, 0 0, 8% 0, 8% 92%, 100% 92%, 100% 100%)' :
                                    'polygon(100% 100%, 0 100%, 0 92%, 92% 92%, 92% 0, 100% 0)'
              }} />
            </div>
          ))}

          {/* Subtle grid pattern */}
          <div className="absolute inset-[12mm] opacity-[0.06] pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* Geometric decorations layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.22]" viewBox="0 0 297 210" preserveAspectRatio="none">
            <g stroke="rgba(20,184,166,0.85)" strokeWidth="0.18" fill="none">
              {[0,1,2,3].map(r => [0,1,2,3,4].map(c => {
                const x = 20 + c * 9 + (r % 2) * 4.5;
                const y = 24 + r * 7.8;
                return <polygon key={`hl-${r}-${c}`} points={`${x},${y-2.6} ${x+2.25},${y-1.3} ${x+2.25},${y+1.3} ${x},${y+2.6} ${x-2.25},${y+1.3} ${x-2.25},${y-1.3}`} />;
              }))}
              {[0,1,2,3].map(r => [0,1,2,3,4].map(c => {
                const x = 277 - c * 9 - (r % 2) * 4.5;
                const y = 24 + r * 7.8;
                return <polygon key={`hr-${r}-${c}`} points={`${x},${y-2.6} ${x+2.25},${y-1.3} ${x+2.25},${y+1.3} ${x},${y+2.6} ${x-2.25},${y+1.3} ${x-2.25},${y-1.3}`} />;
              }))}
            </g>
            <g stroke="rgba(251,191,36,0.6)" strokeWidth="0.2" fill="none">
              {[6,12,18,24,30].map(r => <circle key={`cl-${r}`} cx="22" cy="186" r={r} />)}
              <line x1="22" y1="156" x2="22" y2="216" />
              <line x1="-8" y1="186" x2="52" y2="186" />
              {[6,12,18,24,30].map(r => <circle key={`cr-${r}`} cx="275" cy="186" r={r} />)}
              <line x1="275" y1="156" x2="275" y2="216" />
              <line x1="245" y1="186" x2="305" y2="186" />
            </g>
            <g stroke="rgba(34,211,238,0.65)" strokeWidth="0.2" fill="none">
              <polygon points="148.5,10 158,26 139,26" />
              <polygon points="148.5,200 158,184 139,184" />
              <line x1="148.5" y1="26" x2="148.5" y2="38" />
              <line x1="148.5" y1="172" x2="148.5" y2="184" />
            </g>
            <g stroke="rgba(20,184,166,0.4)" strokeWidth="0.15">
              <line x1="55" y1="12" x2="120" y2="12" />
              <line x1="177" y1="12" x2="242" y2="12" />
              <line x1="55" y1="198" x2="120" y2="198" />
              <line x1="177" y1="198" x2="242" y2="198" />
            </g>
          </svg>

          {/* Top arc / glow */}
          <div className="absolute top-[8mm] left-1/2 -translate-x-1/2 w-[55%] h-[50mm] pointer-events-none opacity-60"
               style={{ background: 'radial-gradient(ellipse at center top, rgba(20,184,166,0.55) 0%, transparent 70%)' }} />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-between px-[18mm] py-[14mm]">
            {/* Header — centered logo */}
            <div className="w-full flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-2xl opacity-70"
                     style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.6) 0%, transparent 65%)' }} />
                <div className="absolute right-full mr-5 flex items-center gap-2">
                  <span className="block w-16 h-px bg-gradient-to-l from-teal-400/80 to-transparent" />
                  <Diamond className="h-2.5 w-2.5 text-teal-400" />
                </div>
                <img src={sfhLogo} alt="Startup Factory Hub" className="relative h-[30mm] object-contain drop-shadow-[0_0_28px_rgba(20,184,166,0.6)]" />
                <div className="absolute left-full ml-5 flex items-center gap-2">
                  <Diamond className="h-2.5 w-2.5 text-teal-400" />
                  <span className="block w-16 h-px bg-gradient-to-r from-teal-400/80 to-transparent" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-400" />
                  <span className="font-mono text-[10px] text-teal-300 tracking-[0.45em] uppercase">Certificado Internacional</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">·</span>
                <div className="flex flex-col items-center gap-1.5">
                  <img src={spacelyLogoAsset.url} alt="Spacely" className="h-5 object-contain opacity-90 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)] mb-0.5" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-cyan-300 tracking-[0.45em] uppercase">Academia Spacely</span>
                    <span className="w-1.5 h-1.5 bg-cyan-400" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] text-slate-500 tracking-[0.3em]">
                <span>N.º {code}</span>
                <span>·</span>
                <span>{hours} HORAS ACADÉMICAS</span>
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/70" />
                <Award className="h-5 w-5 text-amber-400" />
                <span className="font-mono text-[11px] text-amber-300 tracking-[0.5em] uppercase">Certifica que</span>
                <Award className="h-5 w-5 text-amber-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/70" />
              </div>

              <h1
                className="font-bold text-white leading-tight"
                style={{
                  fontSize: '44px',
                  fontFamily: '"Cormorant Garamond", "Times New Roman", serif',
                  textShadow: '0 0 30px rgba(20,184,166,0.35)',
                  letterSpacing: '0.01em',
                }}
              >
                {name}
              </h1>

              <div className="flex items-center justify-center gap-3 my-3 w-full">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/60 to-transparent" />
                <Diamond className="h-3 w-3 text-teal-400" />
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-teal-500/60 to-transparent" />
              </div>

              <p className="text-base text-slate-300 max-w-[180mm] leading-relaxed">
                ha aprobado satisfactoriamente el programa internacional
              </p>

              <h2 className="text-2xl font-black text-teal-300 mt-3 mb-2 tracking-wide uppercase"
                  style={{ textShadow: '0 0 24px rgba(20,184,166,0.5)' }}>
                {program}
              </h2>

              <p className="text-sm text-slate-400 max-w-[170mm] leading-relaxed">
                Programa de formación en <span className="text-cyan-300">Inteligencia Artificial · Robótica · Blockchain · IoT · NewSpace</span>,
                cumpliendo con todos los requisitos académicos, evaluación de caso aplicado y participación activa.
              </p>
            </div>

            {/* Signatures + Seal */}
            <div className="w-full flex items-end justify-between">
              {/* Signature 1 */}
              <div className="flex flex-col items-center w-[60mm]">
                <div className="w-full h-px bg-slate-500" />
                <p className="font-semibold text-sm text-white mt-1.5">Director Académico</p>
                <p className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">Academia Spacely</p>
              </div>

              {/* Seal */}
              <div className="relative flex flex-col items-center">
                <div className="relative w-[34mm] h-[34mm] flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-amber-400/80"
                       style={{ boxShadow: '0 0 30px rgba(251,191,36,0.35), inset 0 0 20px rgba(251,191,36,0.25)' }} />
                  <div className="absolute inset-[3mm] rounded-full border border-amber-400/60" />
                  <div className="absolute inset-[5mm] rounded-full bg-gradient-to-br from-amber-400/30 via-teal-500/20 to-amber-500/30 flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-300" fill="currentColor" />
                  </div>
                  {/* Circular text */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    <defs>
                      <path id="circle-top" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0" fill="none" />
                      <path id="circle-bottom" d="M 50,50 m -40,0 a 40,40 0 1,0 80,0" fill="none" />
                    </defs>
                    <text fill="#fbbf24" fontSize="6" letterSpacing="2" fontFamily="monospace" fontWeight="bold">
                      <textPath href="#circle-top" startOffset="50%" textAnchor="middle">
                        ★ STARTUP FACTORY HUB ★
                      </textPath>
                    </text>
                    <text fill="#fbbf24" fontSize="5" letterSpacing="3" fontFamily="monospace">
                      <textPath href="#circle-bottom" startOffset="50%" textAnchor="middle">
                        ACADEMIA · SPACELY
                      </textPath>
                    </text>
                  </svg>
                </div>
                <p className="font-mono text-[9px] text-amber-400/80 tracking-[0.3em] mt-1">SELLO OFICIAL</p>
              </div>

              {/* Signature 2 */}
              <div className="flex flex-col items-center w-[60mm]">
                <div className="w-full h-px bg-slate-500" />
                <p className="font-semibold text-sm text-white mt-1.5">Coordinación de Programa</p>
                <p className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">Startup Factory Hub</p>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full flex items-center justify-between border-t border-slate-700/50 pt-3 mt-2">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-teal-400" />
                <span className="font-mono text-[10px] text-slate-400 tracking-[0.3em] uppercase">startupfactoryhub.com</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 tracking-[0.3em] uppercase">Emitido · {date}</span>
              <span className="font-mono text-[10px] text-teal-400 tracking-[0.3em] uppercase">Verificación · {code}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: #000 !important; }
          .cert-sheet { box-shadow: none !important; width: 297mm !important; height: 210mm !important; }
        }
      `}</style>
    </div>
  );
}
