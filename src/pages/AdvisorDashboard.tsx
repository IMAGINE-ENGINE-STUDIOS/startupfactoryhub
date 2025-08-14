import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, MessageSquare, TrendingUp, Star, Clock, Award } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';

interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  user_id: string;
}

export default function AdvisorDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStartups();
    }
  }, [user]);

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
        user_id
      `)
      .limit(10);

    if (error) {
      console.error('Error fetching startups:', error);
      return;
    }

    setStartups(data || []);
  };

  const stats = [
    { title: 'Active Mentees', value: '12', icon: Users, color: 'text-primary' },
    { title: 'Sessions This Month', value: '24', icon: Calendar, color: 'text-accent' },
    { title: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-500' },
    { title: 'Rating', value: '4.9', icon: Star, color: 'text-yellow-500' },
  ];

  const upcomingSessions = [
    { company: 'TechStart AI', time: '2:00 PM', topic: 'Product Strategy', founder: 'Sarah Chen' },
    { company: 'GreenTech Solutions', time: '4:30 PM', topic: 'Funding Round', founder: 'Mike Johnson' },
    { company: 'DataFlow Pro', time: '6:00 PM', topic: 'Team Building', founder: 'Alex Rivera' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <img src={companyLogo} alt="Company Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Advisor Dashboard
              </h1>
              <p className="text-muted-foreground">Guide the next generation of entrepreneurs</p>
            </div>
          </div>
          
          <Button className="pulse-primary">
            <MessageSquare className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <Tabs defaultValue="mentees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="mentees">My Mentees</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

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
                  {startups.slice(0, 6).map((startup) => (
                    <Card key={startup.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {startup.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{startup.name}</h3>
                            <p className="text-xs text-muted-foreground">Startup Founder</p>
                            <div className="flex space-x-1 mt-2">
                              <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                              <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-3">
                          View Progress
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Today's Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                      <div>
                        <h4 className="font-medium text-foreground">{session.company}</h4>
                        <p className="text-sm text-muted-foreground">{session.topic} • {session.founder}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">{session.time}</p>
                        <Button size="sm" variant="outline" className="mt-1">
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
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

          <TabsContent value="opportunities" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>New Mentorship Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {startups.slice(6, 12).map((startup) => (
                    <div key={startup.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {startup.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
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
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm" className="pulse-primary">
                          Apply to Mentor
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}