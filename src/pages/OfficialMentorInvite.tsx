import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Star, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OfficialMentorInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) verifyToken();
  }, [token]);

  const verifyToken = async () => {
    const { data, error } = await supabase
      .from('official_mentor_invitations')
      .select('*')
      .eq('invitation_token', token)
      .maybeSingle();

    if (error || !data) {
      setError('Invalid invitation link. Please contact the admin to receive a new one.');
      setLoading(false);
      return;
    }

    if (data.status === 'accepted') {
      setError('This invitation has already been accepted. You can sign in normally.');
      setLoading(false);
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('This invitation link has expired. Please ask the admin to send you a fresh invitation.');
      setLoading(false);
      return;
    }

    setInvitation(data);
    setLoading(false);
  };

  const acceptInvitation = async () => {
    if (!user || !invitation) return;
    
    // Validate that the logged-in user's email matches the invitation email
    if (user.email?.toLowerCase() !== invitation.email?.toLowerCase()) {
      toast({ 
        title: 'Wrong Account', 
        description: `This invitation was sent to ${invitation.email}. Please sign in with that email to accept it.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    setAccepting(true);

    try {
      // Update invitation
      const { error: invError } = await supabase
        .from('official_mentor_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', invitation.id);
      if (invError) throw invError;

      // Create official_mentor_status row
      const { error: statusError } = await supabase
        .from('official_mentor_status')
        .insert({
          user_id: user.id,
          invitation_id: invitation.id,
        });
      if (statusError && !statusError.message.includes('duplicate')) throw statusError;

      toast({ title: '🎉 Welcome!', description: 'Invitation accepted! Complete your checklist to earn the Official badge.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full tech-card">
          <CardContent className="flex flex-col items-center py-8 gap-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-semibold">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full tech-card border-amber-400/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-16 w-16 text-amber-400" />
              <Star className="h-8 w-8 text-amber-300 fill-amber-300 absolute inset-0 m-auto" />
            </div>
          </div>
          <CardTitle className="text-2xl">Official Mentor Program</CardTitle>
          <p className="text-muted-foreground mt-2">
            You've been invited to join the Official Mentor/Advisor Program on Startup Factory Hub.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="font-medium">Benefits include:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Access to all platform perks</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Free bank account (HSBC introduction)</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> 25% referral commission (instead of 20%)</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Direct startup introductions via venture fund</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Official badge on your profile and posts</li>
            </ul>
          </div>

          {user ? (
            user.email?.toLowerCase() === invitation?.email?.toLowerCase() ? (
              <Button onClick={acceptInvitation} disabled={accepting} className="w-full" size="lg">
                {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Accept Invitation
              </Button>
            ) : (
              <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-center">
                  You're signed in as <strong>{user.email}</strong>, but this invitation was sent to <strong>{invitation?.email}</strong>.
                </p>
                <Button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    const redirect = `/official-mentor-invite?token=${token}`;
                    navigate(`/auth?redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(invitation?.email || '')}&tab=signup`);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Sign out & continue with {invitation?.email}
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Please sign in or create an account using <strong>{invitation?.email}</strong> to accept this invitation.
              </p>
              <Button
                onClick={() => {
                  const redirect = `/official-mentor-invite?token=${token}`;
                  navigate(`/auth?redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(invitation?.email || '')}&tab=signup`);
                }}
                className="w-full"
                size="lg"
              >
                Sign In / Sign Up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
