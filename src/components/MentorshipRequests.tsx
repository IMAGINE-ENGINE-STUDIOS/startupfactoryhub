import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StartupProfileDialog from './StartupProfileDialog';

interface MentorshipRequest {
  id: string;
  mentee_id: string;
  status: string;
  goals: string;
  created_at: string;
  mentee: {
    full_name: string;
    avatar_url: string;
    bio: string;
  };
  company: {
    id: string;
    name: string;
    stage: string;
    industry: string;
    description: string;
    logo_url?: string;
    pitch_deck_url?: string;
    website?: string;
    location?: string;
    team_size?: number;
    funding_amount?: number;
    looking_for?: string[];
  };
}

interface MentorshipRequestsProps {
  onRequestHandled?: () => void;
}

export default function MentorshipRequests({ onRequestHandled }: MentorshipRequestsProps = {}) {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentee:profiles!mentorship_relationships_mentee_id_fkey (
          full_name,
          avatar_url,
          bio,
          user_id
        )
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentorship requests:', error);
      return;
    }

    // Fetch company info separately for each mentee
    if (data) {
      const requestsWithCompanies = await Promise.all(
        data.map(async (request: any) => {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', request.mentee?.user_id)
            .single();
          
          return {
            ...request,
            company: companyData || null
          };
        })
      );

      setRequests(requestsWithCompanies as any);
    }
  };

  const handleRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status: action === 'accept' ? 'active' : 'declined',
        start_date: action === 'accept' ? new Date().toISOString() : null
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} mentorship request`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: action === 'accept' ? "Request Accepted!" : "Request Declined",
      description: action === 'accept' 
        ? "You can now schedule sessions with your new mentee."
        : "The mentorship request has been declined.",
    });

    fetchPendingRequests();
    
    // Notify parent component to refresh opportunities list
    if (onRequestHandled) {
      onRequestHandled();
    }
  };

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-primary" />
          <span>Pending Mentorship Requests</span>
          <Badge variant="secondary">{requests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={request.mentee?.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {request.mentee?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {request.mentee?.full_name || 'Anonymous User'}
                      </h3>
                      {request.company && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {request.company.name}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{request.company.stage}</Badge>
                            <Badge variant="outline" className="text-xs">{request.company.industry}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {request.company.description}
                          </p>
                        </>
                      )}
                      {request.goals && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Goals:</span> {request.goals}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons Section */}
                  <div className="flex flex-col gap-2 md:w-48 flex-shrink-0">
                    {request.company && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedCompany(request.company);
                          setDialogOpen(true);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRequest(request.id, 'decline')}
                      >
                        <XCircle className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Decline</span>
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary hover:bg-primary/90"
                        onClick={() => handleRequest(request.id, 'accept')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">Accept</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>

      <StartupProfileDialog 
        company={selectedCompany}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}