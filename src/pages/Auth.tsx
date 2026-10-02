import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Home, Mail, Lock, User, UserCheck } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { signInSchema, signUpSchema } from '@/lib/validations';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import MatrixBackground from '@/components/MatrixBackground';

const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = {
  startup: { email: 'demo-startup@startupfactoryhub.com', password: 'Demo123!' },
  investor: { email: 'demo-investor@startupfactoryhub.com', password: 'Demo123!' },
  mentor: { email: 'demo-mentor@startupfactoryhub.com', password: 'Demo123!' },
  advisor: { email: 'demo-advisor@startupfactoryhub.com', password: 'Demo123!' },
  student: { email: 'demo-student@startupfactoryhub.com', password: 'Demo123!' },
  member: { email: 'demo-member@startupfactoryhub.com', password: 'Demo123!' },
  accelerator: { email: 'demo-accelerator@startupfactoryhub.com', password: 'Demo123!' },
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledRole = searchParams.get('role') || '';
  const demo = searchParams.get('demo') || '';
  const defaultTab = searchParams.get('tab') === 'signup' || prefilledEmail ? 'signup' : 'signin';
  const isInviteFlow = redirectPath.includes('official-mentor-invite');

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(prefilledRole);
  const [venezuelaRebuild, setVenezuelaRebuild] = useState(false);
  const [mvpProgram, setMvpProgram] = useState(false);
  const [acceleratedFundraising, setAcceleratedFundraising] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [autoLogging, setAutoLogging] = useState(false);


  const { signIn, signUp, signOut, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const demoAccount = demo ? DEMO_ACCOUNTS[demo] : null;

  // Auto-login when ?demo=... is present
  useEffect(() => {
    if (!demoAccount || authLoading || autoLogging) return;

    const runAutoLogin = async () => {
      setAutoLogging(true);
      try {
        if (user?.email?.toLowerCase() === demoAccount.email.toLowerCase()) {
          navigate(redirectPath);
          return;
        }
        if (user) {
          await signOut();
        }
        const { error } = await signIn(demoAccount.email, demoAccount.password);
        if (error) {
          toast({
            title: 'Demo login failed',
            description: error.message,
            variant: 'destructive',
          });
          setAutoLogging(false);
        } else {
          navigate(redirectPath);
        }
      } catch (e: any) {
        toast({
          title: 'Demo login error',
          description: e?.message || 'Could not start the demo session.',
          variant: 'destructive',
        });
        setAutoLogging(false);
      }
    };

    runAutoLogin();
  }, [demoAccount, authLoading, user, autoLogging, redirectPath, navigate, signIn, signOut, toast]);

  // Re-apply prefill if URL changes
  useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
    if (prefilledRole) setRole(prefilledRole);
  }, [prefilledEmail, prefilledRole]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    const validation = signInSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      const unconfirmed =
        error.message?.toLowerCase().includes('not confirmed') ||
        (error as any)?.code === 'email_not_confirmed';

      setNeedsVerification(unconfirmed);

      toast({
        title: unconfirmed ? "Email not verified" : "Error",
        description: unconfirmed
          ? "Confirm your email address to continue. You can send yourself a new link below."
          : error.message,
        variant: "destructive",
      });
    } else {
      setNeedsVerification(false);
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate(redirectPath);
    }

    
    setLoading(false);
  };

  // Countdown so users can't spam the auth email rate limit
  useEffect(() => {
    if (verificationCooldown <= 0) return;
    const t = setTimeout(() => setVerificationCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [verificationCooldown]);

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Enter the email address you signed up with.",
        variant: "destructive",
      });
      return;
    }

    setResendingVerification(true);
    const { error } = await supabase.functions.invoke('send-verification-email', {
      body: { email, name: fullName || email },
    });
    setResendingVerification(false);

    if (error) {
      toast({
        title: "Could not send",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setVerificationCooldown(60);
    toast({
      title: "Verification email sent",
      description: `A new link is on its way to ${email}.`,
    });
  };

  const clearForm = () => {
    // Preserve invite-flow prefills (email/role come from the invitation link)
    setEmail(prefilledEmail || '');
    setPassword('');
    setFullName('');
    setRole(prefilledRole || '');
    setNeedsVerification(false);
  };


  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // Always use the public production domain for password reset redirect
    const resetRedirectUrl = 'https://startupfactoryhub.com/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl,
    });
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset email sent",
        description: "Check your email for a password reset link.",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    const validation = signUpSchema.safeParse({ email, password, fullName, role });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, role, referralCode, role === 'startup' && venezuelaRebuild, mvpProgram, acceleratedFundraising);
    
    if (error) {
      if (error.message?.includes('already registered')) {
        toast({
          title: "Account exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      setLoading(false);
      return;
    }
    
    // Show verification message instead of auto-login
    toast({
      title: "✉️ Check your email!",
      description: "We've sent a verification link to " + email + ". Please verify your email, then sign in to " + (isInviteFlow ? "accept your Official invitation." : "continue."),
    });

    // The branded verification email is sent by the server during sign-up.

    // If the user signed up for the MVP program, send the application follow-up email in the background
    if (mvpProgram) {
      try {
        await supabase.functions.invoke('send-mvp-welcome', {
          body: { email, name: fullName || email },
        });
      } catch (err: any) {
        console.error('Failed to send MVP welcome email:', err);
      }
    }

    // If the user signed up for the Accelerated Fundraising program, send the thank-you + apply link email
    if (acceleratedFundraising) {
      try {
        await supabase.functions.invoke('send-af-welcome', {
          body: { email, name: fullName || email },
        });
      } catch (err: any) {
        console.error('Failed to send Accelerated Fundraising welcome email:', err);
      }
    }


    clearForm();

    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Matrix animated background */}
      <MatrixBackground />
      
      {/* Top right navigation */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Link to="/">
          <Button variant="ghost" size="icon" className="neon-glow">
            <Home className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="tech-card border-0 relative overflow-hidden">
          {autoLogging && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3" />
              <p className="text-white font-medium">Starting demo session...</p>
            </div>
          )}
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Startup Factory Hub" className="w-16 h-16 glow-effect" />
            </div>
            <CardTitle className="text-xl tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              STARTUP FACTORY HUB
            </CardTitle>
            <CardDescription>
              Join the future of startup acceleration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isInviteFlow && (
              <div className="mb-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-500">
                🌟 You're accepting an Official Member invitation. Use the email it was sent to: <strong>{prefilledEmail}</strong>
              </div>
            )}
            <Tabs defaultValue={defaultTab} className="w-full" onValueChange={clearForm}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  

                  
                  <Button 
                    type="submit" 
                    className="w-full hover-glow"
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>

                  {needsVerification && (
                    <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-3 space-y-2">
                      <p className="text-xs text-amber-500">
                        This account hasn't confirmed its email yet. Corporate spam filters sometimes
                        open the link before you do — send yourself a fresh one.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleResendVerification}
                        disabled={resendingVerification || verificationCooldown > 0}
                      >
                        {resendingVerification
                          ? 'Sending...'
                          : verificationCooldown > 0
                            ? `Resend available in ${verificationCooldown}s`
                            : 'Resend verification email'}
                      </Button>
                    </div>
                  )}
                  

                  
                  <div className="text-center mt-4">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        readOnly={isInviteFlow && !!prefilledEmail}
                      />
                    </div>
                    {isInviteFlow && prefilledEmail && (
                      <p className="text-[11px] text-muted-foreground">
                        This invitation was sent to this email — it can't be changed.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={role} onValueChange={setRole} required>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="startup">Startup Founder</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="investor">Investor</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="accelerator">Accelerator/Incubator</SelectItem>
                          <SelectItem value="member">Team Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>



                  {role === 'startup' && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                      <label htmlFor="vzla-rebuild" className="flex items-start gap-3 cursor-pointer">
                        <input
                          id="vzla-rebuild"
                          type="checkbox"
                          checked={venezuelaRebuild}
                          onChange={(e) => setVenezuelaRebuild(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-amber-500/50 accent-amber-500"
                        />
                        <div className="text-sm">
                          <div className="font-semibold text-foreground">Venezuela Rebuild Initiative</div>
                          <div className="text-xs text-muted-foreground">
                            Are you a startup joining as part of the Venezuela Rebuild Initiative? Your profile will be tagged so the community can recognize you.
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                    <label htmlFor="mvp-program" className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="mvp-program"
                        type="checkbox"
                        checked={mvpProgram}
                        onChange={(e) => setMvpProgram(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-violet-500/50 accent-violet-500"
                      />
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">Join the Startup Factory Hub MVP Program</div>
                        <div className="text-xs text-muted-foreground">
                          Are you here for the MVP Development Program? We'll send you the application link and next steps right after signup.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <label htmlFor="accelerated-fundraising" className="flex items-start gap-3 cursor-pointer">
                      <input
                        id="accelerated-fundraising"
                        type="checkbox"
                        checked={acceleratedFundraising}
                        onChange={(e) => setAcceleratedFundraising(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-amber-500/50 accent-amber-500"
                      />
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">Join the Accelerated Fundraising Program</div>
                        <div className="text-xs text-muted-foreground">
                          Are you joining for the Accelerated Fundraising program for aerospace hardware startups? We'll email you the application link right after you verify your email.
                        </div>
                      </div>
                    </label>
                  </div>

                  

                  
                  <Button 
                    type="submit" 
                    className="w-full hover-glow"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}