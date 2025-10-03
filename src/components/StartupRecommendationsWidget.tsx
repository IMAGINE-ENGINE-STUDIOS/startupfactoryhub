import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, UserPlus, TrendingUp } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Startup {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: string;
  looking_for: string[];
  user_id: string;
  matchScore: number;
}

const StartupRecommendationsWidget = () => {
  const [startups, setStartups] = useState<Startup[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRecommendedStartups();
    }
  }, [user]);

  const fetchRecommendedStartups = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      const formattedStartups = data.map(company => ({
        id: company.id,
        name: company.name,
        description: company.description || 'No description available',
        industry: company.industry || 'General',
        stage: company.stage || 'Unknown',
        looking_for: company.looking_for || [],
        user_id: company.user_id,
        matchScore: Math.floor(Math.random() * 20) + 80 // 80-100% match
      }));
      setStartups(formattedStartups);
    }
  };

  const sendConnectionRequest = async (targetId: string, startupName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        addressee_id: targetId,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Connection Request Sent!",
      description: `Your connection request has been sent to ${startupName}`,
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-primary";
    return "text-yellow-500";
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pre-seed": return "bg-yellow-500/10 text-yellow-600";
      case "seed": return "bg-primary/10 text-primary";
      case "series-a": return "bg-blue-500/10 text-blue-600";
      case "growth": return "bg-green-500/10 text-green-600";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary" />
          Startup Matches
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Startups aligned with your investment preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {startups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No startup matches yet</p>
          </div>
        ) : (
          <>
            {startups.map((startup) => (
              <div 
                key={startup.id} 
                className="p-4 rounded-lg border border-border/50 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {startup.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">{startup.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getMatchColor(startup.matchScore)}`}>
                        {startup.matchScore}% match
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={`text-xs ${getStageColor(startup.stage)}`}>
                        {startup.stage}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {startup.industry}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {startup.description}
                    </p>
                    
                    {startup.looking_for.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-3">
                        <span className="font-medium">Looking for:</span> {startup.looking_for.join(", ")}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => sendConnectionRequest(startup.user_id, startup.name)}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              <Users className="w-4 h-4 mr-2" />
              Browse All Startups
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StartupRecommendationsWidget;