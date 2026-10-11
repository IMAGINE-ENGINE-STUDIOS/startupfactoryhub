import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, LucideIcon } from 'lucide-react';

export interface NetCardAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface Props {
  name: string;
  avatar?: string | null;
  role?: string | null;
  meta?: (string | null | undefined)[];
  location?: string | null;
  bio?: string | null;
  score?: number;
  badges?: ReactNode;
  /** Small icon-only actions (profile, meeting, pass...) */
  actions?: NetCardAction[];
  /** Main call to action on the right of the footer */
  primary?: ReactNode;
  onOpen?: () => void;
}

const initials = (n: string) =>
  n.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'U';

const cap = (s?: string | null) => {
  if (!s) return 'Member';
  const v = s.toLowerCase();
  if (v === 'user' || v === 'all') return 'Member';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Photo-led member card used across every Net tab. */
export default function NetMemberCard({
  name, avatar, role, meta = [], location, bio, score = 0, badges, actions = [], primary, onOpen,
}: Props) {
  const tags = meta.filter(Boolean) as string[];
  return (
    <div className="tech-card border-0 group flex h-full flex-col overflow-hidden p-0">
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
        aria-label={`Open ${name}`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
            <span className="text-4xl font-semibold tracking-tight text-primary">{initials(name)}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/90 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary backdrop-blur">
          {cap(role)}
        </span>
        {score > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {score}%
          </span>
        )}
        <div className="absolute inset-x-3 bottom-2 text-left">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-base font-semibold text-foreground">{name}</h4>
            {badges}
          </div>
          {location && (
            <span className="mt-0.5 flex min-w-0 items-center gap-0.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">
          {bio || '\u00A0'}
        </p>

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 2).map(t => (
              <span key={t} className="max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 pt-3">
          {actions.map(a => (
            <Button
              key={a.label}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={a.onClick}
              title={a.label}
              aria-label={a.label}
            >
              <a.icon className="h-4 w-4" />
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-1">{primary}</div>
        </div>
      </div>
    </div>
  );
}
