import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';
import logo from '@/assets/logo.png';
import MatrixBackground from '@/components/MatrixBackground';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have recovery tokens in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    // Also check query params (some flows use query params instead)
    const queryParams = new URLSearchParams(window.location.search);
    const errorParam = queryParams.get('error');
    const errorDescription = queryParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'The reset link is invalid or has expired. Please request a new one.');
      return;
    }

    // If we have tokens in the hash, set the session manually
    if (accessToken && refreshToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting recovery session:', error);
          setError('The reset link is invalid or has expired. Please request a new one.');
        } else {
          setSessionReady(true);
        }
      });
      return;
    }

    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (event may have fired before mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // We have a session, likely from the recovery flow
        setSessionReady(true);
      }
    });

    // Timeout after 15 seconds
    const timeout = setTimeout(() => {
      if (!sessionReady) {
        setError('The reset link appears to be invalid or has expired. Please request a new password reset.');
      }
    }, 15000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords match.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Password updated!', description: 'Your password has been reset. Redirecting to sign in...' });
      // Sign out after password reset so user logs in with new password
      await supabase.auth.signOut();
      setTimeout(() => navigate('/auth'), 2000);
    }
    setLoading(false);
  };

  const handleRequestNewReset = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <MatrixBackground />
      <div className="w-full max-w-md relative z-10">
        <Card className="tech-card border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Startup Factory Hub" className="w-16 h-16 glow-effect" />
            </div>
            <CardTitle className="text-xl tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              RESET YOUR PASSWORD
            </CardTitle>
            <CardDescription>
              {error ? 'Something went wrong' : sessionReady ? 'Enter your new password below.' : 'Verifying your reset link...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-6 space-y-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button onClick={handleRequestNewReset} className="w-full hover-glow">
                  Back to Sign In
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Please wait while we verify your reset link...</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full hover-glow" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
