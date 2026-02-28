import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Rocket } from 'lucide-react';
import MatrixBackground from '@/components/MatrixBackground';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

export default function VerifyEmail() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleVerification = async () => {
      // Supabase redirects with hash fragments after verification
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const errorDescription = hashParams.get('error_description');

      if (errorDescription) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(errorDescription));
        return;
      }

      if (accessToken && refreshToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('error');
            setErrorMessage(error.message);
          } else {
            setStatus('success');
          }
        } catch (err: any) {
          setStatus('error');
          setErrorMessage(err.message || 'Verification failed');
        }
      } else {
        // Check if already authenticated via onAuthStateChange
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
        } else {
          // Wait briefly for auth state change
          const timeout = setTimeout(() => {
            if (status === 'verifying') {
              setStatus('error');
              setErrorMessage('Verification link may have expired. Please request a new one.');
            }
          }, 5000);
          return () => clearTimeout(timeout);
        }
      }
    };

    // Listen for auth state changes (Supabase may auto-handle the token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setStatus('success');
      }
    });

    handleVerification();

    return () => subscription.unsubscribe();
  }, []);

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
            <CardDescription>
              Email Verification
            </CardDescription>
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
                  <Button 
                    onClick={() => navigate('/profile-setup')} 
                    className="w-full hover-glow"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Set Up Your Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')} 
                    className="w-full"
                  >
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
                <div className="flex flex-col gap-3 w-full">
                  <Button 
                    onClick={() => navigate('/auth')} 
                    className="w-full hover-glow"
                  >
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
