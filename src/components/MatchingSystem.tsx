import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, X, Users, MessageSquare, Star, TrendingUp, Building, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Match {
  id: string;
  name: string;
  role: string;
  description: string;
  industry: string;
  stage?: string;
  expertise?: string[];
  compatibility_score: number;
  avatar?: string;
}

export default function MatchingSystem() {
  const [mentorMatches, setMentorMatches] = useState<Match[]>([]);
  const [investorMatches, setInvestorMatches] = useState<Match[]>([]);
  const [startupMatches, setStartupMatches] = useState<Match[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchMatches();
      fetchConnections();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setUserProfile(data);
  };

  const fetchMatches = async () => {
    // Fetch mentor matches (for startups)
    const { data: mentors, error: mentorError } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['advisor'])
      .limit(5);

    if (!mentorError && mentors) {
      const mentorMatches = mentors.map(mentor => ({
        id: mentor.user_id,
        name: mentor.full_name || 'Anonymous Mentor',
        role: 'Mentor',
        description: mentor.bio || 'Experienced mentor ready to guide your startup journey',
        industry: mentor.bio?.split(' ')[0] || 'General',
        expertise: mentor.bio ? [mentor.bio] : [],
        compatibility_score: Math.floor(Math.random() * 40) + 60, // 60-100% compatibility
      }));
      setMentorMatches(mentorMatches);
    }

    // Fetch investor matches (for startups)
    const { data: investors, error: investorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'investor')
      .limit(5);

    if (!investorError && investors) {
      const investorMatches = investors.map(investor => ({
        id: investor.user_id,
        name: investor.full_name || 'Anonymous Investor',
        role: 'Investor',
        description: investor.bio || 'Looking for promising startups to invest in',
        industry: investor.bio?.split(' ')[0] || 'General',
        expertise: investor.bio ? [investor.bio] : [],
        compatibility_score: Math.floor(Math.random() * 30) + 70, // 70-100% compatibility
      }));
      setInvestorMatches(investorMatches);
    }

    // Fetch startup matches (for investors/mentors)
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select(`
        *,
        profiles(full_name, role)
      `)
      .limit(8);

    if (!companyError && companies) {
      const startupMatches = companies.map(company => ({
        id: company.id,
        name: company.name,
        role: 'Startup',
        description: company.description,
        industry: company.industry,
        stage: company.stage,
        compatibility_score: Math.floor(Math.random() * 40) + 60, // 60-100% compatibility
      }));
      setStartupMatches(startupMatches);
    }
  };

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!error && data) {
      setConnections(data);
    }
  };

  const sendConnectionRequest = async (targetId: string, targetName: string) => {
    if (!user) return;

    // Check if this is a mentorship request (connecting with a mentor/advisor)
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', targetId)
      .single();

    if (targetProfile?.role === 'advisor' || targetProfile?.role === 'mentor') {
      // Send mentorship request
      const { error } = await supabase
        .from('mentorship_relationships')
        .insert({
          mentor_id: targetId,
          mentee_id: user.id,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Request Already Sent",
            description: "You've already requested mentorship from this person.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to send mentorship request",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Mentorship Request Sent!",
        description: `Your mentorship request has been sent to ${targetName}`,
      });
    } else {
      // Send regular connection request
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
        description: `Your connection request has been sent to ${targetName}`,
      });
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-primary';
    if (score >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    return 'Fair';
  };

  const MatchCard = ({ match, onConnect, onPass }: { match: Match; onConnect: () => void; onPass: () => void }) => (
    <Card className="tech-card border-0 hover:scale-[1.02] transition-transform">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={match.avatar} alt={match.name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {match.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{match.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{match.role}</p>
            <div className="flex items-center space-x-2 mb-2">
              <Star className={`h-4 w-4 ${getCompatibilityColor(match.compatibility_score)}`} />
              <span className={`text-sm font-medium ${getCompatibilityColor(match.compatibility_score)}`}>
                {match.compatibility_score}% • {getCompatibilityLabel(match.compatibility_score)} Match
              </span>
            </div>
            <div className="flex space-x-1 mb-3">
              <Badge variant="secondary" className="text-xs">{match.industry}</Badge>
              {match.stage && <Badge variant="outline" className="text-xs">{match.stage}</Badge>}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{match.description}</p>
        
        {match.expertise && match.expertise.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-foreground mb-2">Expertise:</p>
            <div className="flex flex-wrap gap-1">
              {match.expertise.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPass} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Pass
          </Button>
          <Button size="sm" onClick={onConnect} className="flex-1 pulse-primary">
            <Heart className="h-4 w-4 mr-2" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Smart Matching System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our AI-powered matching system connects you with the right people based on your profile, 
            industry, stage, and goals. Discover mentors, investors, and collaborators.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="mentors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="startups">Startups</TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Recommended Mentors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mentorMatches.map((mentor) => (
                    <MatchCard
                      key={mentor.id}
                      match={mentor}
                      onConnect={() => sendConnectionRequest(mentor.id, mentor.name)}
                      onPass={() => {
                        setMentorMatches(mentorMatches.filter(m => m.id !== mentor.id));
                        toast({ title: "Mentor passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No mentor matches yet</h3>
                  <p className="text-muted-foreground">Complete your profile to get better matches</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investors" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Recommended Investors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investorMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {investorMatches.map((investor) => (
                    <MatchCard
                      key={investor.id}
                      match={investor}
                      onConnect={() => sendConnectionRequest(investor.id, investor.name)}
                      onPass={() => {
                        setInvestorMatches(investorMatches.filter(i => i.id !== investor.id));
                        toast({ title: "Investor passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No investor matches yet</h3>
                  <p className="text-muted-foreground">Complete your startup profile to attract investors</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="startups" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Recommended Startups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {startupMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {startupMatches.map((startup) => (
                    <MatchCard
                      key={startup.id}
                      match={startup}
                      onConnect={() => sendConnectionRequest(startup.id, startup.name)}
                      onPass={() => {
                        setStartupMatches(startupMatches.filter(s => s.id !== startup.id));
                        toast({ title: "Startup passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No startup matches yet</h3>
                  <p className="text-muted-foreground">Update your investment preferences to see matches</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}