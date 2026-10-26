import React, { Component, ErrorInfo, ReactNode } from 'react';
import { saveRestorePoint, applyRestorePoint } from '@/lib/sessionRestore';
import MatrixEffect from '@/components/MatrixEffect';
import {
  diagnose,
  applyRepair,
  recordRepair,
  readLog,
  clearLog,
  purgeCachesAndReload,
  type Diagnosis,
  type DebugEntry,
} from '@/lib/autoDebugger';

const isDevelopment = import.meta.env.DEV;

// How many times we silently repair the app before showing the recovery console.
const MAX_SILENT_RECOVERIES = 3;
// Known-safe signatures get a wider budget — they never loop.
const MAX_SAFE_RECOVERIES = 12;
// Errors further apart than this are treated as unrelated (counter resets).
const RECOVERY_WINDOW_MS = 30_000;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  diagnosis: Diagnosis | null;
  log: DebugEntry[];
  /** Bumped on every silent recovery to force a clean remount of the tree. */
  recoveryKey: number;
}

class ErrorBoundary extends Component<Props, State> {
  private recoveryCount = 0;
  private lastErrorAt = 0;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    diagnosis: null,
    log: [],
    recoveryKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isDevelopment) {
      console.error('Auto Debugger caught an error:', error, errorInfo);
    }

    const now = Date.now();
    if (now - this.lastErrorAt > RECOVERY_WINDOW_MS) {
      this.recoveryCount = 0;
    }
    this.lastErrorAt = now;

    // Remember exactly where the user was, then try to repair invisibly.
    saveRestorePoint();

    const diagnosis = diagnose(error);
    const budget = diagnosis.safeToRepeat ? MAX_SAFE_RECOVERIES : MAX_SILENT_RECOVERIES;
    const autoFixable = diagnosis.strategy !== 'escalate';

    if (autoFixable && this.recoveryCount < budget && applyRepair(diagnosis)) {
      this.recoveryCount += 1;
      recordRepair(error, diagnosis, true);
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        diagnosis: null,
        recoveryKey: prev.recoveryKey + 1,
      }));
      // Restore scroll after the fresh tree paints.
      requestAnimationFrame(() => applyRestorePoint());
      return;
    }

    recordRepair(error, diagnosis, false);
    this.setState({ error, errorInfo, diagnosis, log: readLog() });
  }

  private handleRetry = () => {
    this.recoveryCount = 0;
    clearLog();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      diagnosis: null,
      log: [],
      recoveryKey: prev.recoveryKey + 1,
    }));
    requestAnimationFrame(() => applyRestorePoint());
  };

  private handleDeepRepair = () => {
    void purgeCachesAndReload().then((did) => {
      if (!did) window.location.reload();
    });
  };

  private handleReset = () => {
    clearLog();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const diagnosis = this.state.diagnosis;
      /* NO CONSOLE FLASH (founder report 2026-10-26: a fresh tab shows
       * the error screen for a few seconds, then the site recovers).
       * getDerivedStateFromError renders BEFORE componentDidCatch gets
       * to run the silent repair, so the full "Session held" console
       * used to paint for EVERY fault — including the transient ones
       * the repair fixes a moment later. The diagnosis is only set
       * when a fault actually survives repair; until then, render a
       * neutral restoring splash, never the console. */
      if (!diagnosis) {
        return (
          <div className="min-h-screen w-full bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
              <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-muted-foreground">Restoring your session…</p>
            </div>
          </div>
        );
      }
      const attempts = this.recoveryCount;
      const isStaleBuild = diagnosis?.strategy === 'reload';

      return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center p-4 sm:p-8">
          <MatrixEffect position="absolute" opacity={0.22} />

          <section className="relative z-10 w-full max-w-3xl rounded-2xl border border-primary/25 bg-background/70 backdrop-blur-xl shadow-[0_0_60px_-15px_hsl(var(--primary)/0.45)]">
            {/* Console header bar */}
            <header className="flex items-center justify-between gap-4 border-b border-primary/20 px-5 sm:px-8 py-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <span className="font-display text-[11px] sm:text-xs tracking-[0.35em] text-primary uppercase">
                  Auto Debugger
                </span>
              </div>
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-muted-foreground uppercase">
                {attempts} auto-repair{attempts === 1 ? '' : 's'} run
              </span>
            </header>

            <div className="px-5 sm:px-8 py-7 sm:py-9">
              <p className="font-mono text-[10px] tracking-[0.3em] text-primary/70 uppercase mb-3">
                Session held · nothing lost
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                {diagnosis?.label ?? 'Unclassified fault'}
              </h1>
              <p className="mt-3 max-w-xl font-body text-sm sm:text-base text-muted-foreground">
                {diagnosis?.explanation ??
                  'The automatic repair pipeline could not resolve this on its own. Your place in the app is saved — resume and it will pick up exactly where you left off.'}
              </p>

              {/* Repair pipeline readout */}
              <div className="mt-7 grid gap-2 rounded-xl border border-border/50 bg-muted/30 p-4 font-mono text-[11px] sm:text-xs">
                <Line label="signature" value={diagnosis?.id ?? 'unknown'} />
                <Line label="strategy" value={diagnosis?.strategy ?? 'escalate'} />
                <Line
                  label="fault"
                  value={this.state.error?.message?.slice(0, 220) ?? 'n/a'}
                />
                {/* Diagnostic (added 2026-10-26 while hunting a fault
                    that only reproduces in real browsers): the raw
                    stack names the exact module and call site, turning
                    a held screen into a usable bug report. */}
                <Line
                  label="stack"
                  value={(this.state.error?.stack ?? '').split('\n').slice(0, 5).join(' ⏎ ').slice(0, 600) || 'n/a'}
                />
                <Line label="viewport" value="restore point saved" />
              </div>

              {this.state.log.length > 0 && (
                <details className="mt-4 group">
                  <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                    Repair history ({this.state.log.length})
                  </summary>
                  <ul className="mt-3 space-y-1.5 max-h-40 overflow-auto pr-1">
                    {this.state.log.map((entry, i) => (
                      <li
                        key={`${entry.at}-${i}`}
                        className="flex items-start gap-3 font-mono text-[11px] text-muted-foreground"
                      >
                        <span className={entry.repaired ? 'text-primary' : 'text-destructive'}>
                          {entry.repaired ? '[fixed]' : '[held]'}
                        </span>
                        <span className="truncate">{entry.diagnosis.label}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {isDevelopment && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                    Component stack
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={isStaleBuild ? this.handleDeepRepair : this.handleRetry}
                  className="flex-1 rounded-xl bg-primary px-5 py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-[1.02] active:scale-100"
                >
                  {isStaleBuild ? 'Load the new version' : 'Resume session'}
                </button>
                <button
                  onClick={isStaleBuild ? this.handleRetry : this.handleDeepRepair}
                  className="flex-1 rounded-xl border border-primary/40 px-5 py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/10"
                >
                  {isStaleBuild ? 'Resume session' : 'Deep repair'}
                </button>
                <button
                  onClick={this.handleReset}
                  className="rounded-xl border border-border px-5 py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Home
                </button>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.recoveryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-3">
    <span className="w-20 shrink-0 uppercase tracking-[0.2em] text-primary/70">{label}</span>
    <span className="min-w-0 flex-1 break-words text-foreground/80">{value}</span>
  </div>
);

export default ErrorBoundary;
