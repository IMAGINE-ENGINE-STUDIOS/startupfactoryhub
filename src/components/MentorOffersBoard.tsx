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
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    if (!user) return;

    // Fetch all companies
    const { data: allCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
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

    // Filter out companies where mentorship already exists
    const existingMenteeIds = new Set(
      (existingRelationships || []).map(r => r.mentee_id)
    );

    const availableStartups = allCompanies.filter(
      company => !existingMenteeIds.has(company.user_id)
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
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Offer Mentorship to Startups</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Browse startups and proactively offer your mentorship to those that match your expertise.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup) => (
              <Card key={startup.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {startup.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                        <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {startup.description}
                  </p>
                  
                  {startup.looking_for && startup.looking_for.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-foreground mb-1">Looking for:</p>
                      <div className="flex flex-wrap gap-1">
                        {startup.looking_for.slice(0, 2).map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
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
                    className="w-full pulse-primary"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {processingStartupId === startup.id ? 'Processing...' : 'Offer Mentorship'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {startups.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No startups found</h3>
              <p className="text-muted-foreground">Check back later for new startups to mentor.</p>
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
