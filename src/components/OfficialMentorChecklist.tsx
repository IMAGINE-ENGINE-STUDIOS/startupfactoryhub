import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Loader2, Shield, Star, PartyPopper, Download, Linkedin } from 'lucide-react';
import OfficialBadge from './OfficialBadge';
import OfficialBadgeCelebrationDialog from './OfficialBadgeCelebrationDialog';
import { useToast } from '@/hooks/use-toast';

export default function OfficialMentorChecklist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<'mentor' | 'advisor'>('mentor');

  useEffect(() => {
    if (user) fetchStatus();
  }, [user]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.full_name) setUserName(data.full_name);
        });
    }
  }, [user]);

  const fetchStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('official_mentor_status')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setStatus(data);
    setLoading(false);
  };

  const checkStatus = async () => {
    if (!user) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_and_grant_official_status', {
        p_user_id: user.id,
      });
      if (error) throw error;
      const result = data as any;
      if (result) {
        const wasOfficial = status?.is_official;
        setStatus((prev: any) => ({
          ...prev,
          profile_completed: result.profile_completed,
          email_verified: result.email_verified,
          connection_invited: result.connection_invited,
          is_official: result.is_official,
        }));
        if (result.is_official && !wasOfficial) {
          setShowCelebration(true);
        } else if (result.is_official) {
          toast({ title: '🎉 You\'re Official!', description: 'You already have the Official badge.' });
        } else {
          toast({ title: 'Status Updated', description: 'Complete all steps to earn your badge.' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setChecking(false);
  };

  if (loading) return null;
  if (!status) return null;

  if (status.is_official) {
    return (
      <>
        <Card className="tech-card border-amber-400/30 bg-gradient-to-r from-amber-400/5 to-transparent">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <OfficialBadge size="lg" />
              <div>
                <p className="font-semibold text-amber-400 flex items-center gap-1">
                  <PartyPopper className="h-4 w-4" /> Official Member
                </p>
                <p className="text-xs text-muted-foreground">You have full access to all premium perks including 25% referral commission.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                onClick={() => setShowCelebration(true)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Badge
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10"
                onClick={() => setShowCelebration(true)}
              >
                <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
        <OfficialBadgeCelebrationDialog 
          open={showCelebration} 
          onOpenChange={setShowCelebration}
          userName={userName}
        />
      </>
    );
  }

  const steps = [
    { key: 'email_verified', label: 'Verify your email', description: 'Confirm your email address' },
    { key: 'connection_invited', label: 'Make a connection', description: 'Connect with at least 1 member' },
    { key: 'profile_completed', label: 'Upload your avatar', description: 'Add a profile picture' },
  ];

  return (
    <>
      <Card className="tech-card border-amber-400/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Official Member Checklist
          </CardTitle>
          <p className="text-xs text-muted-foreground">Complete these steps to earn your Official badge and unlock premium perks.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step) => {
            const completed = status[step.key];
            return (
              <div key={step.key} className="flex items-start gap-3">
                {completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${completed ? 'text-green-500 line-through' : 'text-foreground'}`}>{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
          <Button onClick={checkStatus} disabled={checking} className="w-full mt-4" variant="outline">
            {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
            Check Status
          </Button>
        </CardContent>
      </Card>
      <OfficialBadgeCelebrationDialog 
        open={showCelebration} 
        onOpenChange={setShowCelebration}
        userName={userName}
      />
    </>
  );
}
