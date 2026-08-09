import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Rocket, Handshake, Zap } from 'lucide-react';
import MVPCampaignPanel from '@/components/marketing/MVPCampaignPanel';
import PartnersCampaignPanel from '@/components/marketing/PartnersCampaignPanel';

type CampaignKey = 'mvp' | 'partners';

const CAMPAIGNS: {
  key: CampaignKey;
  label: string;
  detail: string;
  icon: typeof Rocket;
}[] = [
  {
    key: 'mvp',
    label: 'MVP Program',
    detail: 'LinkedIn + SFH feed · every 2 days, 10:00 AM ET',
    icon: Rocket,
  },
  {
    key: 'partners',
    label: 'Accelerator as a Service',
    detail: 'LinkedIn company page · Mon & Wed, 9:00 AM ET',
    icon: Handshake,
  },
];

export default function AutoPostingHub() {
  const [active, setActive] = useState<CampaignKey>('mvp');
  const current = CAMPAIGNS.find((c) => c.key === active)!;

  return (
    <div className="space-y-6">
      <div className="tech-card border-0 rounded-xl p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
              <Radio className="h-4 w-4" /> Auto-Posting Control
            </div>
            <h2 className="text-2xl font-semibold mt-2">Unified Campaign Automation</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              All scheduled LinkedIn and feed campaigns in one place. Posts are generated and
              published automatically — no manual approval required.
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 self-center">
            <Zap className="h-3 w-3 mr-1" /> Auto-publish ON
          </Badge>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2">
          {CAMPAIGNS.map((c) => {
            const Icon = c.icon;
            const isActive = c.key === active;
            return (
              <Button
                key={c.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActive(c.key)}
                className="rounded-lg"
              >
                <Icon className="h-4 w-4 mr-2" />
                {c.label}
              </Button>
            );
          })}
        </div>
        <p className="relative mt-3 text-xs text-muted-foreground">{current.detail}</p>
      </div>

      {active === 'mvp' ? <MVPCampaignPanel /> : <PartnersCampaignPanel />}
    </div>
  );
}
