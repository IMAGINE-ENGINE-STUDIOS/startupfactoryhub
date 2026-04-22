import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
  X,
} from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { getTourSteps, type TourStep, type TourSide } from '@/lib/tourSteps';
import { cn } from '@/lib/utils';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_W = 340;
const TOOLTIP_GAP = 18;
const SPOTLIGHT_PAD = 8;

function pickSide(rect: Rect, preferred: TourSide | undefined): Exclude<TourSide, 'auto'> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const space = {
    top: rect.top,
    bottom: vh - (rect.top + rect.height),
    left: rect.left,
    right: vw - (rect.left + rect.width),
  };
  if (preferred && preferred !== 'auto') {
    if (space[preferred] > 160) return preferred;
  }
  // Pick the side with the most room.
  return (Object.entries(space).sort((a, b) => b[1] - a[1])[0][0] as Exclude<
    TourSide,
    'auto'
  >);
}

function computeTooltipPosition(rect: Rect, side: Exclude<TourSide, 'auto'>) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0;
  let left = 0;
  if (side === 'bottom') {
    top = rect.top + rect.height + TOOLTIP_GAP;
    left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  } else if (side === 'top') {
    top = rect.top - TOOLTIP_GAP - 220;
    left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
  } else if (side === 'right') {
    top = rect.top + rect.height / 2 - 100;
    left = rect.left + rect.width + TOOLTIP_GAP;
  } else {
    top = rect.top + rect.height / 2 - 100;
    left = rect.left - TOOLTIP_GAP - TOOLTIP_W;
  }
  // Clamp to viewport with 16px margin.
  left = Math.max(16, Math.min(left, vw - TOOLTIP_W - 16));
  top = Math.max(16, Math.min(top, vh - 240));
  return { top, left };
}

function ArrowFor({ side }: { side: Exclude<TourSide, 'auto'> }) {
  const Icon =
    side === 'bottom'
      ? ArrowUp
      : side === 'top'
      ? ArrowDown
      : side === 'right'
      ? ArrowLeft
      : ArrowRight;
  return (
    <Icon className="h-7 w-7 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] animate-bounce" />
  );
}

export default function InteractiveTour() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [missingTarget, setMissingTarget] = useState(false);
  const retryCountRef = useRef(0);

  const steps = useMemo(() => getTourSteps(role as any), [role]);
  const step: TourStep | undefined = steps[stepIndex];

  const stop = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    setRect(null);
    setMissingTarget(false);
    retryCountRef.current = 0;
    try {
      localStorage.setItem('sfh.tour.completed', '1');
    } catch {
      /* ignore */
    }
  }, []);

  // Listen for global start event from the Help button.
  useEffect(() => {
    const onStart = () => {
      setStepIndex(0);
      setActive(true);
    };
    window.addEventListener('sfh:start-tour', onStart);
    return () => window.removeEventListener('sfh:start-tour', onStart);
  }, []);

  // Esc to quit.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
      if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, stop, steps.length]);

  // Navigate / set tab when step changes.
  useEffect(() => {
    if (!active || !step) return;
    retryCountRef.current = 0;
    setMissingTarget(false);

    const targetRoute = step.route ?? location.pathname;
    const targetSearch = step.tab ? `?tab=${encodeURIComponent(step.tab)}` : '';
    const needsNav =
      location.pathname !== targetRoute ||
      (step.tab && !location.search.includes(`tab=${step.tab}`));

    if (needsNav) {
      navigate(`${targetRoute}${targetSearch}`);
    }
  }, [active, step, navigate, location.pathname, location.search]);

  // Locate target + recompute on resize/scroll.
  useEffect(() => {
    if (!active || !step) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let raf = 0;

    const measure = () => {
      if (cancelled) return;
      if (!step.selector) {
        setRect(null);
        setMissingTarget(false);
        return;
      }
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (!el) {
        if (retryCountRef.current < 12) {
          retryCountRef.current += 1;
          raf = window.setTimeout(measure, 200) as unknown as number;
        } else {
          setMissingTarget(true);
        }
        return;
      }
      // Bring it into view the first time we find it.
      if (retryCountRef.current === 0) {
        try {
          el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        } catch {
          /* ignore */
        }
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
      setMissingTarget(false);
    };

    measure();
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    const interval = window.setInterval(measure, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(raf);
      window.clearInterval(interval);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [active, step, location.pathname, location.search]);

  if (!active || !step) return null;
  // Only show for signed-in users (Help button only renders there anyway).
  if (!user) return null;

  const isCentered = !step.selector || missingTarget || !rect;
  const side = !isCentered && rect ? pickSide(rect, step.side) : 'bottom';
  const tooltipPos =
    !isCentered && rect ? computeTooltipPosition(rect, side) : null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      {/* Backdrop with optional spotlight cut-out */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={stop}
        style={
          !isCentered && rect
            ? {
                background: 'transparent',
                boxShadow: `0 0 0 9999px hsl(0 0% 0% / 0.72)`,
                clipPath: `polygon(
                  0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                  ${rect.left - SPOTLIGHT_PAD}px ${rect.top - SPOTLIGHT_PAD}px,
                  ${rect.left - SPOTLIGHT_PAD}px ${rect.top + rect.height + SPOTLIGHT_PAD}px,
                  ${rect.left + rect.width + SPOTLIGHT_PAD}px ${rect.top + rect.height + SPOTLIGHT_PAD}px,
                  ${rect.left + rect.width + SPOTLIGHT_PAD}px ${rect.top - SPOTLIGHT_PAD}px,
                  ${rect.left - SPOTLIGHT_PAD}px ${rect.top - SPOTLIGHT_PAD}px
                )`,
              }
            : undefined
        }
      />

      {/* Spotlight ring around target */}
      {!isCentered && rect && (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.6)] animate-pulse"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
          }}
        />
      )}

      {/* Arrow */}
      {!isCentered && rect && (
        <div
          className="pointer-events-none absolute"
          style={{
            top:
              side === 'bottom'
                ? rect.top + rect.height + 6
                : side === 'top'
                ? rect.top - 32
                : rect.top + rect.height / 2 - 14,
            left:
              side === 'right'
                ? rect.left + rect.width + 6
                : side === 'left'
                ? rect.left - 32
                : rect.left + rect.width / 2 - 14,
          }}
        >
          <ArrowFor side={side} />
        </div>
      )}

      {/* Tooltip / centered card */}
      <div
        className={cn(
          'absolute glass-morphism border border-ocean-border rounded-2xl shadow-2xl p-5 animate-scale-in bg-background/95 backdrop-blur-xl',
        )}
        style={
          isCentered
            ? {
                width: TOOLTIP_W,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            : { width: TOOLTIP_W, top: tooltipPos!.top, left: tooltipPos!.left }
        }
      >
        <button
          onClick={stop}
          aria-label="Close tour"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-primary">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider font-medium">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>

        <h3 className="text-lg font-semibold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          {step.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.description}
        </p>

        {missingTarget && step.selector && (
          <p className="text-xs text-muted-foreground/80 italic mb-3">
            Couldn't locate this element on the current view — continuing the tour.
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={stop}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isFirst}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            <Button
              size="sm"
              variant="hero"
              onClick={() => {
                if (isLast) stop();
                else setStepIndex((i) => i + 1);
              }}
            >
              {isLast ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
