import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, MessageSquare, TrendingUp, Star, Clock, Award } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import MentorshipRequests from '@/components/MentorshipRequests';
import AvailabilityManager from '@/components/AvailabilityManager';
import FloatingChat from '@/components/FloatingChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import StartupProfileDialog from '@/components/StartupProfileDialog';

interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  user_id: string;
  logo_url?: string | null;
}

export default function AdvisorDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [activeMentorships, setActiveMentorships] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile: profileWithRole } = useProfileWithRole();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMentorProfile();
      fetchStartups();
      fetchActiveMentorships();
      fetchUpcomingSessions();
    }
  }, [user]);

  const fetchMentorProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setMentorProfile(data);
    }
  };

  const fetchActiveMentorships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentee:profiles!mentorship_relationships_mentee_id_fkey (
          full_name,
          avatar_url,
          user_id
        )
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching active mentorships:', error);
      return;
    }

    // Fetch company info separately for each mentee
    if (data) {
      const mentorshipsWithCompanies = await Promise.all(
        data.map(async (mentorship: any) => {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name, description, stage, industry')
            .eq('user_id', mentorship.mentee?.user_id)
            .single();
          
          return {
            ...mentorship,
            companies: companyData || null
          };
        })
      );

      setActiveMentorships(mentorshipsWithCompanies);
    }
  };

  const fetchUpcomingSessions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentoring_sessions')
      .select(`
        *,
        mentee:profiles!mentoring_sessions_mentee_id_fkey (
          full_name,
          user_id
        )
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (error) {
      console.error('Error fetching upcoming sessions:', error);
      return;
    }

    // Fetch company info separately for each mentee
    if (data) {
      const sessionsWithCompanies = await Promise.all(
        data.map(async (session: any) => {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('user_id', session.mentee?.user_id)
            .single();
          
          return {
            ...session,
            companies: companyData || null
          };
        })
      );

      setUpcomingSessions(sessionsWithCompanies);
    }
  };

  const acceptMentorshipRequest = async (relationshipId: string) => {
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ status: 'active', start_date: new Date().toISOString() })
      .eq('id', relationshipId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept mentorship request",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mentorship Accepted!",
      description: "You can now schedule sessions with your new mentee.",
    });

    fetchActiveMentorships();
    fetchStartups();
  };

  const fetchProfile = async () => {
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

    setProfile(data);
  };

  const fetchStartups = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        stage,
        industry,
        user_id,
        logo_url,
        pitch_deck_url,
        website,
        location,
        team_size,
        funding_amount,
        looking_for
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching startups:', error);
      return;
    }

    setStartups(data || []);
  };

  const stats = [
    { 
      title: 'Active Mentees', 
      value: activeMentorships.length.toString(), 
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      title: 'Sessions This Month', 
      value: mentorProfile?.total_sessions?.toString() || '0', 
      icon: Calendar, 
      color: 'text-accent' 
    },
    { 
      title: 'Total Sessions', 
      value: mentorProfile?.total_sessions?.toString() || '0', 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      title: 'Rating', 
      value: mentorProfile?.average_rating?.toFixed(1) || '0.0', 
      icon: Star, 
      color: 'text-yellow-500' 
    },
  ];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-2 sm:p-4 pb-20 lg:pb-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <RoleBasedAvatar 
            avatarUrl={profileWithRole?.avatar_url} 
            role="advisor"
            fallbackText={user?.email || 'A'}
            className="h-12 w-12 sm:h-16 sm:w-16"
          />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {profileWithRole?.full_name || 'Advisor'} Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Guide the next generation of entrepreneurs</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-6 max-w-3xl">
              <TabsTrigger value="requests" className="flex-shrink-0">Requests</TabsTrigger>
              <TabsTrigger value="mentees" className="flex-shrink-0">My Mentees</TabsTrigger>
              <TabsTrigger value="schedule" className="flex-shrink-0">Schedule</TabsTrigger>
              <TabsTrigger value="community" className="flex-shrink-0">Community</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0">Intelligence</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="space-y-4">
            <MentorshipRequests />
            
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>New Mentorship Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {startups.map((startup) => (
                    <div key={startup.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <RoleBasedAvatar 
                          avatarUrl={startup.logo_url}
                          role="startup"
                          fallbackText={startup.name}
                          className="h-12 w-12"
                        />
                        <div>
                          <h3 className="font-semibold text-foreground">{startup.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>
                          <div className="flex space-x-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                            <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedStartup(startup);
                            setDialogOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          className="pulse-primary"
                          onClick={() => {
                            toast({
                              title: "Feature Coming Soon",
                              description: "The mentorship application process is being finalized.",
                            });
                          }}
                        >
                          Offer Mentorship
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentees" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Active Mentorship Programs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMentorships.length > 0 ? (
                    activeMentorships.map((mentorship: any) => (
                      <Card key={mentorship.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={mentorship.mentee?.avatar_url} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                {mentorship.mentee?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {mentorship.mentee?.full_name || 'Anonymous'}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {mentorship.companies?.name || 'Startup Founder'}
                              </p>
                              {mentorship.companies && (
                                <div className="flex space-x-1 mt-2">
                                  <Badge variant="secondary" className="text-xs">{mentorship.companies.stage}</Badge>
                                  <Badge variant="outline" className="text-xs">{mentorship.companies.industry}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full mt-3">
                            View Progress
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No active mentees yet</h3>
                      <p className="text-muted-foreground">Check the Opportunities tab to find startups seeking mentorship</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Availability Manager */}
              <AvailabilityManager />
              
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Today's Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {session.companies?.name || session.mentee?.full_name || 'Session'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {session.topic || 'Mentoring Session'} • {session.mentee?.full_name || 'Mentee'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">{formatTime(session.scheduled_at)}</p>
                          <Button size="sm" variant="outline" className="mt-1">
                            Join
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming sessions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-accent" />
                    <span>Recent Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">TechStart AI raised $2M Series A</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">GreenTech launched MVP</p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">DataFlow Pro acquired first enterprise client</p>
                        <p className="text-xs text-muted-foreground">2 weeks ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>
        </Tabs>
      </div>

      <StartupProfileDialog
        company={selectedStartup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}