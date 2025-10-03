import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    name: string;
    stage: string;
    industry: string;
    description: string;
  };
}

export default function MentorshipRequests() {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
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
        mentee:mentee_id (
          full_name,
          avatar_url,
          bio
        ),
        company:mentee_id (
          name,
          stage,
          industry,
          description
        )
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as any);
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
            <div key={request.id} className="flex items-start justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
              <div className="flex items-start space-x-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={request.mentee?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {request.mentee?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {request.mentee?.full_name || 'Anonymous User'}
                  </h3>
                  {request.company && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {request.company.name}
                      </p>
                      <div className="flex space-x-2 mt-2">
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
              <div className="flex space-x-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRequest(request.id, 'decline')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  className="pulse-primary"
                  onClick={() => handleRequest(request.id, 'accept')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}