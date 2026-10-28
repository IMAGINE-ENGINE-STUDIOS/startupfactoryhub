import { Target } from 'lucide-react';
import { useFundabilityScoreForUser } from '@/hooks/useFundabilityScore';
import { cn } from '@/lib/utils';

// Fundability Score shown on a public profile (/u/:userId) — what a
// visitor sees when they open someone's profile. Computed with the
// same computeFundability() as the Analytics > Score tab, from the
// profile owner's company + grant matches and their public signal
// (followers + posts visible on the page). Renders nothing when the
// person has no company profile yet, so profiles stay clean.

interface Props {
  userId: string;
  followers: number;
  posts: number;
  variant?: 'badge' | 'card';
}

function band(score: number): string {
  if (score >= 80) return 'Investor-ready';
  if (score >= 60) return 'Fundable';
  if (score >= 40) return 'Getting fundable';
  return 'Early stage';
}

export default function FundabilityBadge({ userId, followers, posts, variant = 'badge' }: Props) {
  const f = useFundabilityScoreForUser(userId, {
    followers,
    connections: 0,
    posts,
    engagement: 0,
  });

  if (f.loading || !f.hasCompany) return null;

  if (variant === 'badge') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/30"
        title={`Fundability Score for ${f.companyName ?? 'this company'} — profile, investor readiness, market signal and grant readiness`}
      >
        <Target className="h-3.5 w-3.5" />
        Fundability {f.score}/100
        <span className="font-normal text-muted-foreground">· {band(f.score)}</span>
      </span>
    );
  }

  return (
    <div className="tech-card border-0 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            Fundability Score: {f.score}/100
            <span className="ml-2 text-sm font-normal text-muted-foreground">{band(f.score)}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            {f.companyName ? `${f.companyName} · ` : ''}
            {f.unlockedGrantCount > 0
              ? `${f.unlockedGrantCount} grant${f.unlockedGrantCount === 1 ? '' : 's'} unlocked on Startup Factory Hub`
              : 'Scored from company profile, investor readiness, market signal and grant readiness'}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {f.categories.map((cat) => (
          <div key={cat.key}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider text-muted-foreground">{cat.label}</span>
              <span className="font-semibold tabular-nums">{cat.earned}/{cat.max}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/30">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r from-primary via-violet-400 to-emerald-400')}
                style={{ width: `${cat.max ? (cat.earned / cat.max) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
