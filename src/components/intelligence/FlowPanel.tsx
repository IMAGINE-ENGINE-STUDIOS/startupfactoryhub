import { ReactNode } from 'react';
import { Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlowPanelProps {
  /** Right-side terminal slug, e.g. "market", "charts", "trending", "archives" */
  namespace: string;
  /** Selector / actions to render in the top-right of the HUD bar. */
  hudRight?: ReactNode;
  /** Optional status pill rendered before hudRight. */
  status?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Unified Flow visual shell — used by every Intelligence section so they all share
 * the same glassmorphic console aesthetic, ambient aurora background, and mono
 * terminal header that the Flow engine itself uses.
 */
export function FlowPanel({
  namespace,
  hudRight,
  status,
  children,
  className,
  contentClassName,
}: FlowPanelProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Ambient background: animated aurora + grid (matches Flow) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.25)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl animate-pulse [animation-delay:1.2s]" />
        <div className="absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl animate-pulse [animation-delay:.6s]" />
      </div>

      <div className="w-full animate-fade-in">
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)] overflow-hidden h-full min-h-[560px]">
          {/* HUD top bar — identical to Flow */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-background/40">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 blur opacity-60" />
                <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center">
                  <Cpu className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <span className="ml-1 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                flow://{namespace}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {status}
              {hudRight}
            </div>
          </div>

          <div className={cn('p-4 sm:p-6 overflow-auto', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shared section heading in Flow mono style. */
export function FlowSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[11px] font-mono uppercase tracking-[0.25em] text-muted-foreground/70',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Glass card matching Flow's inner panels. */
export function FlowCard({
  children,
  className,
  interactive,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 transition-all',
        interactive && 'hover:border-violet-400/40 hover:bg-white/[0.07] hover:shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)] cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
