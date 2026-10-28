import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Target,
  Share2,
  Check,
  Lock,
  Unlock,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFundabilityScore, type FundabilitySignal } from '@/hooks/useFundabilityScore';
import { cn } from '@/lib/utils';

// Fundability Score panel — lives inside AnalyticsDashboard (all role
// dashboards that mount it inherit this). Score logic is in
// useFundabilityScore; this component is presentation only.

interface Props {
  signal: FundabilitySignal;
}

function band(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: 'Investor-ready', tone: 'text-emerald-400' };
  if (score >= 60) return { label: 'Fundable — polish stage', tone: 'text-primary' };
  if (score >= 40) return { label: 'Getting fundable', tone: 'text-amber-400' };
  return { label: 'Early — big gains available', tone: 'text-rose-400' };
}

export default function FundabilityScorePanel({ signal }: Props) {
  const f = useFundabilityScore(signal);
  const [copied, setCopied] = useState(false);
  const [, setSearchParams] = useSearchParams();

  const share = async () => {
    const text = f.companyName
      ? `My startup ${f.companyName} just scored ${f.score}/100 on the Startup Factory Hub Fundability Score — with ${f.unlockedGrantCount} grants unlocked. Check yours: https://startupfactoryhub.com`
      : `I just checked my Fundability Score on Startup Factory Hub: ${f.score}/100. Check yours: https://startupfactoryhub.com`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (permissions) — leave the button state alone.
    }
  };

  if (f.loading) {
    return (
      <div className="tech-card border-0 rounded-2xl p-5 sm:p-6">
        <div className="h-5 w-40 rounded-full bg-muted/40 animate-pulse mb-3" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!f.hasCompany) {
    return (
      <div className="tech-card border-0 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">Get your Fundability Score</h3>
          <p className="text-sm text-muted-foreground">
            Create your company profile and Startup Factory Hub scores how fundable you are —
            profile, investor readiness, market signal, and the grants you unlock.
          </p>
        </div>
        <Button className="rounded-full shrink-0" onClick={() => setSearchParams({ tab: 'profile' })}>
          <Building2 className="w-4 h-4 mr-1.5" /> Create company profile
        </Button>
      </div>
    );
  }

  const b = band(f.score);
  const radial = [{ name: 'fundability', value: f.score, fill: 'hsl(var(--primary))' }];

  return (
    <div className="relative tech-card border-0 rounded-2xl p-5 sm:p-6 overflow-hidden">
      <div className="absolute -top-20 -left-16 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Score dial + share */}
        <div className="flex lg:flex-col items-center gap-4">
          <div className="relative w-[150px] h-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={radial} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--muted) / 0.3)' }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold tabular-nums">{f.score}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</div>
            </div>
          </div>
          <div className="text-center">
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1 mb-2">
              <Target className="w-3 h-3" /> Fundability Score
            </Badge>
            <div className={cn('text-sm font-semibold', b.tone)}>{b.label}</div>
            {f.companyName && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {f.companyName}{f.companyStage ? ` · ${String(f.companyStage).replace('-', ' ')}` : ''}
              </div>
            )}
            <Button variant="outline" size="sm" className="rounded-full mt-3" onClick={share}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? 'Copied — post it' : 'Share my score'}
            </Button>
          </div>
        </div>

        {/* Breakdown + gaps + grants */}
        <div className="space-y-5 min-w-0">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {f.categories.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground uppercase tracking-wider">{cat.label}</span>
                  <span className="font-semibold tabular-nums">{cat.earned}/{cat.max}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-violet-400 to-emerald-400 transition-all"
                    style={{ width: `${cat.max ? (cat.earned / cat.max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {f.gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Fix these to raise your score</h4>
              <div className="space-y-1.5">
                {f.gaps.map((g) => (
                  <div key={g.key} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 inline-flex items-center justify-center min-w-9 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold tabular-nums">
                      +{g.points - g.earned}
                    </span>
                    <span className="text-muted-foreground">{g.fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {f.grants.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">
                Grants matched to you
                <span className="text-muted-foreground font-normal"> — {f.unlockedGrantCount} unlocked</span>
              </h4>
              <div className="space-y-1.5">
                {f.grants.slice(0, 3).map((g) => (
                  <div key={g.resource_id} className="flex items-center gap-2 text-sm min-w-0">
                    {g.unlocked
                      ? <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      : <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <span className="truncate">{g.title}</span>
                    {g.amount_text && <span className="text-muted-foreground shrink-0">· {g.amount_text}</span>}
                    <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                      {g.score}% match
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
