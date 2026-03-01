import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Users, ExternalLink } from 'lucide-react';
import StartupProfileDialog from './StartupProfileDialog';
import InvestorBookPitchDialog from './InvestorBookPitchDialog';
import { useInvestorNetwork } from '@/hooks/useInvestorNetwork';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function InvestorStartupNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { startups, loading, refetch } = useInvestorNetwork(user?.id);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const [selectedPitchStartup, setSelectedPitchStartup] = useState<{
    userId: string;
    name: string;
    companyId: string;
    companyName: string;
  } | null>(null);

  const handleExpressInterest = async (companyId: string) => {
    if (!user || !selectedStartup) return;

    try {
      // Get the company owner's user_id
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Insert investment interest
      const { error } = await supabase
        .from('investment_interests')
        .insert({
          investor_id: user.id,
          company_id: companyId,
          status: 'interested'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Interested",
            description: "You've already expressed interest in this startup.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Get user's profile and role for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const primaryRole = userRoles?.[0]?.role || 'investor';
      const userName = profile?.full_name || 'Someone';

      const roleLabels: Record<string, string> = {
        investor: 'Investor Interest',
        mentor: 'Mentor Interest',
        advisor: 'Advisor Interest',
        accelerator: 'Accelerator Interest',
      };
      const roleLabel = roleLabels[primaryRole] || 'Interest';

      // Create notification for the startup owner
      await supabase
        .from('notifications')
        .insert({
          user_id: company.user_id,
          type: 'investment_interest',
          title: `New ${roleLabel}`,
          message: `${userName} has expressed interest in ${selectedStartup.name}`,
          data: {
            investor_id: user.id,
            company_id: companyId,
            company_name: selectedStartup.name,
            investor_name: userName
          }
        });

      toast({
        title: "Interest Registered!",
        description: `Your interest in ${selectedStartup.name} has been recorded. The startup owner will be notified.`,
      });

      setDialogOpen(false);
      refetch(); // Refresh the list to show updated connection status
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSchedulePitch = (companyId: string, companyName: string) => {
    if (!selectedStartup) return;
    
    // Get the startup's user_id from the selected startup
    const startupUserId = selectedStartup.user_id || selectedStartup.userId;
    
    setSelectedPitchStartup({
      userId: startupUserId,
      name: selectedStartup.name,
      companyId: companyId,
      companyName: companyName
    });
    setPitchDialogOpen(true);
    setDialogOpen(false); // Close the profile dialog
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading network...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Your Startup Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        {startups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No startups in your network yet</p>
            <p className="text-sm mt-1">Start by expressing interest in startups</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map((startup) => (
              <Card key={startup.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      {startup.logo_url ? (
                        <AvatarImage src={startup.logo_url} alt={startup.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                          {startup.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                      <Badge
                        variant={
                          startup.connection_type === 'invested' ? 'default' : 
                          startup.connection_type === 'interested' ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs mt-1"
                      >
                        {startup.connection_type === 'invested' ? 'Invested' : 
                         startup.connection_type === 'interested' ? 'Interested' : 
                         'Available'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {startup.description}
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">{startup.stage}</Badge>
                    <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedStartup(startup);
                      setDialogOpen(true);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      <StartupProfileDialog 
        company={selectedStartup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onExpressInterest={handleExpressInterest}
        onSchedulePitch={handleSchedulePitch}
      />

      {selectedPitchStartup && (
        <InvestorBookPitchDialog
          open={pitchDialogOpen}
          onOpenChange={setPitchDialogOpen}
          startupId={selectedPitchStartup.userId}
          startupName={selectedPitchStartup.name}
          companyId={selectedPitchStartup.companyId}
          companyName={selectedPitchStartup.companyName}
        />
      )}
    </CardContent>
  </Card>
  );
}
