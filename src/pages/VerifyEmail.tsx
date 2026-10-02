import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, Rocket, Mail, RefreshCw } from 'lucide-react';
import MatrixBackground from '@/components/MatrixBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Status = 'verifying' | 'success' | 'error';

const RESEND_COOLDOWN_SECONDS = 60;

/** Human-readable message for the error codes Supabase can return on a confirmation link. */
function describeError(code: string | null, description: string | null): string {
  const normalized = (code || '').toLowerCase();
  const desc = description ? decodeURIComponent(description.replace(/\+/g, ' ')) : '';

  if (normalized.includes('otp_expired') || desc.toLowerCase().includes('expired')) {
    return 'This verification link has expired. Links are valid for a limited time — request a new one below.';
  }
  if (normalized.includes('access_denied')) {
    return 'This verification link is no longer valid. It may have already been used (some corporate email filters open links automatically). Request a new one below.';
  }
  if (desc) return desc;
  return 'We could not verify this link. Request a new verification email below.';
}

export default function VerifyEmail() {
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const settledRef = useRef(false);

  const settle = (next: Status, message = '') => {
    if (settledRef.current) return;
    settledRef.current = true;
    setStatus(next);
    setErrorMessage(message);
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const pick = (key: string) => query.get(key) ?? hash.get(key);

    // Remember the email if it came along on the link, so resend can be one click.
    const emailFromLink = pick('email');
    if (emailFromLink) setResendEmail(emailFromLink);

    // Listen for the client auto-handling the token in the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Only treat as success if a session actually exists.
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) settle('success');
        });
      }
    });

    const run = async () => {
      // 1. Explicit error returned by Supabase (query string OR fragment).
      const errorCode = pick('error_code') || pick('error');
      const errorDescription = pick('error_description');
      if (errorCode || errorDescription) {
        settle('error', describeError(errorCode, errorDescription));
        return;
      }

      // 2. Tokens delivered in the URL fragment (implicit flow).
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) settle('error', error.message);
        else settle('success');
        return;
      }

      // 3. PKCE authorization code in the query string.
      const code = query.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          settle(
            'error',
            'This verification link could not be completed in this browser. Open the link in the same browser you signed up with, or request a new one below.',
          );
        } else {
          settle('success');
        }
        return;
      }

      // 4. Hashed token (token_hash / token + type) — verify directly.
      const tokenHash = pick('token_hash') || pick('token');
      const type = (pick('type') || 'signup') as 'signup' | 'email_change' | 'magiclink' | 'invite' | 'recovery';
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) settle('error', describeError(null, error.message));
        else settle('success');
        return;
      }

      // 5. Nothing in the URL — the user may already be verified and signed in.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        settle('success');
        return;
      }

      settle(
        'error',
        'This verification link is missing its security token. It may have been shortened or rewritten by an email filter. Request a new one below.',
      );
    };

    run();

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResend = async () => {
    const target = resendEmail.trim();
    if (!target) {
      toast({
        title: 'Email required',
        description: 'Enter the email address you signed up with.',
        variant: 'destructive',
      });
      return;
    }

    setResending(true);
    const { data: sendData, error: sendError } = await supabase.functions.invoke('send-verification-email', {
      body: { email: target },
    });
    const error = sendError || (sendData?.error ? { message: sendData.error } : null);
    setResending(false);

    if (error) {
      toast({
        title: 'Could not send',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
    toast({
      title: 'Verification email sent',
      description: `A new link is on its way to ${target}. It is valid for a limited time.`,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <MatrixBackground />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="tech-card border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Startup Factory Hub" className="w-16 h-16 glow-effect" />
            </div>
            <CardTitle className="text-xl tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STARTUP FACTORY HUB
            </CardTitle>
            <CardDescription>Email Verification</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-6 py-8">
            {status === 'verifying' && (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Verifying Your Email</h2>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your account...
                  </p>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Email Verified!</h2>
                  <p className="text-sm text-muted-foreground">
                    Your account has been successfully verified. Welcome to the ecosystem!
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <Button onClick={() => navigate('/profile-setup')} className="w-full hover-glow">
                    <Rocket className="h-4 w-4 mr-2" />
                    Set Up Your Profile
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                    Go to Dashboard
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">Verification Failed</h2>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="resend-email" className="text-xs text-muted-foreground">
                      Send a new verification link to
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resend-email"
                        type="email"
                        placeholder="you@company.com"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="w-full hover-glow"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : cooldown > 0 ? (
                      `Resend available in ${cooldown}s`
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resend verification email
                      </>
                    )}
                  </Button>

                  <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                    Back to Sign In
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
