import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Radio,
  Rocket,
  Handshake,
  Zap,
  BarChart3,
  CalendarClock,
  Megaphone,
  Link2,
} from 'lucide-react';
import MVPCampaignPanel from '@/components/marketing/MVPCampaignPanel';
import PartnersCampaignPanel from '@/components/marketing/PartnersCampaignPanel';
import CampaignPerformance from '@/components/marketing/CampaignPerformance';
import LinkedInConnectionCard from '@/components/marketing/LinkedInConnectionCard';
import LinkedInPermissionsPanel from '@/components/marketing/LinkedInPermissionsPanel';
import EventSyncPanel from '@/components/marketing/EventSyncPanel';
import StartupAnnouncementStudio from '@/components/marketing/StartupAnnouncementStudio';
import SocialitePage from '@/pages/Socialite';

type CampaignKey =
  | 'mvp'
  | 'partners'
  | 'events'
  | 'announcements'
  | 'performance'
  | 'connection';

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
    label: 'Partners',
    detail: 'LinkedIn company page · Mon & Wed, 9:00 AM ET',
    icon: Handshake,
  },
  {
    key: 'events',
    label: 'Events',
    detail: 'Two-way LinkedIn event sync · hourly',
    icon: CalendarClock,
  },
  {
    key: 'announcements',
    label: 'Announcements',
    detail: 'Publish a new startup announcement to LinkedIn and the SFH feed',
    icon: Megaphone,
  },
  {
    key: 'performance',
    label: 'Performance',
    detail: 'UTM-tagged links generated for every auto-posted item',
    icon: BarChart3,
  },
  {
    key: 'connection',
    label: 'Connection',
    detail: 'LinkedIn account, company page and permission scopes',
    icon: Link2,
  },
];

export default function AutoPostingHub() {
  // Marketing Control Center hosts Socialite as its main surface
  // (founder direction 2026-10-29). The campaign automation panels stay
  // one switch away — their configuration, queues and content are
  // untouched, and Socialite keeps its own keys, queue and content
  // because this is the same component and the same cloud-synced state
  // as the /socialite page.
  const [hub, setHub] = useState<'socialite' | 'campaigns'>('socialite');
  const [active, setActive] = useState<CampaignKey>('mvp');
  const current = CAMPAIGNS.find((c) => c.key === active)!;

  return (
    <div className="space-y-6">
      <div className="bg-[#0A1418] border border-cyan-400/15 rounded-md p-6 relative overflow-hidden">
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
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-['JetBrains_Mono']">
              <Radio className="h-4 w-4" /> Campaign Automation
            </div>
            <h2 className="text-2xl font-semibold mt-2 font-['Space_Grotesk'] tracking-wide">Marketing Control Center</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Every scheduled LinkedIn and feed campaign lives here. Posts are generated and
              published automatically — no manual approval required.
            </p>
          </div>
          <Badge variant="outline" className="border-[#2EF8A0]/40 text-[#2EF8A0] self-center font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">
            <Zap className="h-3 w-3 mr-1" /> Auto-publish ON
          </Badge>
        </div>

        <div className="relative mt-5 flex gap-2">
          <Button size="sm" variant={hub === 'socialite' ? 'default' : 'outline'} onClick={() => setHub('socialite')} className="rounded-md">
            <Radio className="h-4 w-4 mr-2" /> Socialite
          </Button>
          <Button size="sm" variant={hub === 'campaigns' ? 'default' : 'outline'} onClick={() => setHub('campaigns')} className="rounded-md">
            <Megaphone className="h-4 w-4 mr-2" /> Campaign Automation
          </Button>
        </div>

        {hub === 'campaigns' && (<>
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CAMPAIGNS.map((c) => {
            const Icon = c.icon;
            const isActive = c.key === active;
            return (
              <Button
                key={c.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActive(c.key)}
                className="rounded-md justify-start w-full"
              >
                <Icon className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{c.label}</span>
              </Button>
            );
          })}
        </div>
        <p className="relative mt-3 text-xs text-muted-foreground">{current.detail}</p>
        </>)}
      </div>

      {hub === 'socialite' && <SocialitePage embedded />}

      {hub === 'campaigns' && active === 'mvp' && <MVPCampaignPanel />}
      {hub === 'campaigns' && active === 'partners' && <PartnersCampaignPanel />}
      {hub === 'campaigns' && active === 'events' && <EventSyncPanel />}
      {hub === 'campaigns' && active === 'announcements' && <StartupAnnouncementStudio />}
      {hub === 'campaigns' && active === 'performance' && <CampaignPerformance />}
      {hub === 'campaigns' && active === 'connection' && (
        <div className="space-y-6">
          <LinkedInConnectionCard />
          <LinkedInPermissionsPanel />
        </div>
      )}
    </div>
  );
}
