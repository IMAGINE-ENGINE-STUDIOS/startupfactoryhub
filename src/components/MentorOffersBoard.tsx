import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Users, Send, Building, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Startup {
  id: string;
  user_id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  logo_url?: string;
  looking_for?: string[];
}

export default function MentorOffersBoard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStartupId, setProcessingStartupId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchStartups();
    }
  }, [user]);

  // Real-time subscription for mentorship relationship changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mentor-offers-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_relationships',
          filter: `mentor_id=eq.${user.id}`,
        },
        () => {
          fetchStartups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchStartups = async () => {
    if (!user) return;

    // Fetch all companies (now unique per user due to constraint)
    const { data: allCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (companiesError || !allCompanies) {
      console.error('Error fetching companies:', companiesError);
      return;
    }

    // Fetch existing mentorship relationships for this mentor
    const { data: existingRelationships } = await supabase
      .from('mentorship_relationships')
      .select('mentee_id')
      .eq('mentor_id', user.id);

    // Filter out companies where mentorship already exists and the current user's own company
    const existingMenteeIds = new Set(
      (existingRelationships || []).map(r => r.mentee_id)
    );

    const availableStartups = allCompanies.filter(
      company => company.user_id !== user.id && !existingMenteeIds.has(company.user_id)
    );

    setStartups(availableStartups.slice(0, 20));
  };

  const offerMentorship = async () => {
    if (!user || !selectedStartup) return;

    setLoading(true);

    // Check if relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('mentorship_relationships')
      .select('id, status')
      .eq('mentor_id', user.id)
      .eq('mentee_id', selectedStartup.user_id)
      .maybeSingle();

    if (existing) {
      const statusMessage = existing.status === 'pending' 
        ? 'You already have a pending offer with this startup.'
        : existing.status === 'active'
        ? 'You already have an active mentorship with this startup.'
        : 'You previously had a mentorship with this startup.';
        
      toast({
        title: "Already Connected",
        description: statusMessage,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Create mentorship offer
    const { error } = await supabase
      .from('mentorship_relationships')
      .insert({
        mentor_id: user.id,
        mentee_id: selectedStartup.user_id,
        status: 'pending',
        goals: goals,
        notes: notes,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send mentorship offer.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Offer Sent! 🎉",
      description: `Your mentorship offer has been sent to ${selectedStartup.name}`,
    });

    // Remove the startup from the list immediately
    setStartups(prevStartups => 
      prevStartups.filter(s => s.id !== selectedStartup.id)
    );

    setDialogOpen(false);
    setGoals('');
    setNotes('');
    setLoading(false);
    setProcessingStartupId(null);
  };

  return (
    <>
      <Card className="tech-card border-0 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-teal-500/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 ring-2 ring-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold">Offer Mentorship to Startups</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Browse startups and proactively offer your mentorship
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup) => (
              <div 
                key={startup.id} 
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-4 pl-5">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground font-bold">
                        {startup.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {startup.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {startup.stage}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-border/50">
                          {startup.industry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                    {startup.description || 'No description available'}
                  </p>
                  
                  {startup.looking_for && startup.looking_for.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-foreground/80 mb-1.5 uppercase tracking-wide">Looking for:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {startup.looking_for.slice(0, 2).map((item, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs bg-secondary/50 hover:bg-secondary/70"
                          >
                            {item}
                          </Badge>
                        ))}
                        {startup.looking_for.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-muted/50">
                            +{startup.looking_for.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      setProcessingStartupId(startup.id);
                      setSelectedStartup(startup);
                      setDialogOpen(true);
                    }}
                    disabled={processingStartupId === startup.id}
                    className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {processingStartupId === startup.id ? 'Processing...' : 'Offer Mentorship'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {startups.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-4">
                <Building className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No startups available</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Check back later for new startups seeking mentorship guidance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offer Mentorship Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offer Mentorship to {selectedStartup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goals">Mentorship Goals</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What do you hope to help them achieve? (e.g., Product-market fit, fundraising strategy, team building)"
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="notes">Your Message</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Introduce yourself and explain why you'd be a good mentor for this startup..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={offerMentorship} 
                disabled={loading || !goals.trim()}
                className="pulse-primary"
              >
                {loading ? 'Sending...' : 'Send Offer'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
