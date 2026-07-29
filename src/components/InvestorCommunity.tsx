import { useState } from 'react';
import lvlupLogo from '@/assets/lvlup-logo.jpg.asset.json';
import nvidiaLogo from '@/assets/nvidia-logo.webp.asset.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShieldCheck, TrendingUp } from 'lucide-react';

interface InvestorFirm {
  id: string;
  name: string;
  description: string;
  logo: string;
  url: string;
  focus: string;
  accent: string;
  cta: string;
}

const FIRMS: InvestorFirm[] = [
  {
    id: 'advantary',
    name: 'Advantary Capital Partners',
    description:
      'Investment partner of Startup Factory Hub. Growth and venture capital for founders scaling beyond the MVP stage.',
    logo: '/partners/advantary-logo.jpg',
    url: 'https://share.hsforms.com/1OFBERDqqS6SpeTBrtJW3pg2bo06?utm_source=chatgpt.com',
    focus: 'Venture & Growth',
    accent: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    cta: 'Apply for funding',
  },
  {
    id: 'lvlup',
    name: 'LvlUp Ventures',
    description:
      'Early-stage venture firm backing bold founders with capital, network access and go-to-market firepower.',
    logo: lvlupLogo.url,
    url: 'https://www.lvlup.vc',
    focus: 'Pre-Seed & Seed',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    cta: 'Visit firm',
  },
  {
    id: 'nvidia-inception',
    name: 'NVIDIA Inception',
    description:
      'Global program for AI and data science startups: GPU credits, technical training, go-to-market support and investor introductions.',
    logo: nvidiaLogo.url,
    url: 'https://www.nvidia.com/en-us/startups/',
    focus: 'AI & Deep Tech',
    accent: 'from-lime-500 via-green-500 to-emerald-500',
    cta: 'Join Inception',
  },
];

function FirmLogo({ firm }: { firm: InvestorFirm }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-sm font-bold text-foreground">
        {firm.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
      </span>
    );
  }
  return (
    <img
      src={firm.logo}
      alt={`${firm.name} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full rounded-[10px] object-contain bg-background p-1"
    />
  );
}

export default function InvestorCommunity() {
  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-indigo-500" aria-label="Community Investors" />
          </div>


          <div>
            <h2 className="text-lg font-semibold text-foreground">Community Investors</h2>
            <p className="text-xs text-muted-foreground">Firms under contract with Startup Factory Hub</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-1 snap-x snap-mandatory -mx-1 px-1">
        {FIRMS.map(firm => (
          <Card
            key={firm.id}
            className="group tech-card border-0 relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)] min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
            onClick={() => window.open(firm.url, '_blank', 'noopener,noreferrer')}
          >
            <div
              className={`pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br ${firm.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px`}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <div
                className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br ${firm.accent} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`}
              />
            </div>
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${firm.accent}`} />

            <CardHeader className="pb-2 pt-4 px-4 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`relative h-9 w-9 rounded-xl bg-gradient-to-br ${firm.accent} p-[1.5px] shrink-0`}>
                      <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                        <FirmLogo firm={firm} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate tracking-tight">{firm.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                          Contracted partner
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{firm.description}</p>
                </div>
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-0.5 shrink-0">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {firm.focus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-1 relative">
              <Button
                size="sm"
                className={`w-full h-8 text-xs gap-1.5 bg-gradient-to-r ${firm.accent} border-0 text-white hover:opacity-90`}
                onClick={e => {
                  e.stopPropagation();
                  window.open(firm.url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {firm.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
