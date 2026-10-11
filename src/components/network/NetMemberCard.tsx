import { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  /** Small icon-only actions (profile, message, meeting...) */
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

/** Compact, consistent member card used across every Net tab. */
export default function NetMemberCard({
  name, avatar, role, meta = [], location, bio, score = 0, badges, actions = [], primary, onOpen,
}: Props) {
  const tags = meta.filter(Boolean) as string[];
  return (
    <div className="tech-card border-0 group flex h-full flex-col p-4 transition-colors hover:bg-muted/30">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 text-left" disabled={!onOpen}>
        <Avatar className="h-11 w-11 shrink-0 ring-1 ring-border">
          <AvatarImage src={avatar || undefined} alt={name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold text-foreground">{name}</h4>
            {badges}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-medium uppercase tracking-[0.12em] text-primary">{cap(role)}</span>
            {location && (
              <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}
          </div>
        </div>
        {score > 0 && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {score}%
          </span>
        )}
      </button>

      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">
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

      <div className="mt-auto flex items-center gap-1 pt-4">
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
  );
}
