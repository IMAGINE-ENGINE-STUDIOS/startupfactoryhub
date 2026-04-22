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

export default function Auth() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const prefilledEmail = searchParams.get('email') || '';
  const prefilledRole = searchParams.get('role') || '';
  const defaultTab = searchParams.get('tab') === 'signup' || prefilledEmail ? 'signup' : 'signin';
  const isInviteFlow = redirectPath.includes('official-mentor-invite');

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(prefilledRole);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate(redirectPath);
    }
    
    setLoading(false);
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole('');
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

    const { error } = await signUp(email, password, fullName, role, referralCode);
    
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
      description: "We've sent a verification link to " + email + ". Please verify your email before signing in.",
    });
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
        <Card className="tech-card border-0">
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
            <Tabs defaultValue="signin" className="w-full" onValueChange={clearForm}>
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
                      />
                    </div>
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
                        </SelectContent>
                      </Select>
                    </div>
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