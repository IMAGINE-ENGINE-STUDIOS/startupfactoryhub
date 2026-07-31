import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { saveRestorePoint, applyRestorePoint } from '@/lib/sessionRestore';

const isDevelopment = import.meta.env.DEV;

// How many times we silently remount the app before giving up and showing UI.
const MAX_SILENT_RECOVERIES = 3;
// Errors further apart than this are treated as unrelated (counter resets).
const RECOVERY_WINDOW_MS = 30_000;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
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
    recoveryKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isDevelopment) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }

    const now = Date.now();
    if (now - this.lastErrorAt > RECOVERY_WINDOW_MS) {
      this.recoveryCount = 0;
    }
    this.lastErrorAt = now;

    // Remember exactly where the user was, then try to recover invisibly.
    saveRestorePoint();

    if (this.recoveryCount < MAX_SILENT_RECOVERIES) {
      this.recoveryCount += 1;
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryKey: prev.recoveryKey + 1,
      }));
      // Restore scroll after the fresh tree paints.
      requestAnimationFrame(() => applyRestorePoint());
      return;
    }

    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.recoveryCount = 0;
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryKey: prev.recoveryKey + 1,
    }));
    requestAnimationFrame(() => applyRestorePoint());
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryKey: this.state.recoveryKey + 1,
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground">
                  We're sorry, but an unexpected error occurred
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm text-destructive mb-2">
                  {this.state.error.toString()}
                </p>
                {isDevelopment && this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      View error details
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={this.handleRetry} className="flex-1">
                Try again
              </Button>
              <Button variant="outline" onClick={this.handleReset} className="flex-1">
                Return to Home
              </Button>
            </div>
          </Card>
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

export default ErrorBoundary;
