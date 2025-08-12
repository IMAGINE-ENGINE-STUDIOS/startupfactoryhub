import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Users, Trophy, Target, Play, CheckCircle, Clock, Star } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  instructor: string;
  difficulty: string;
}

interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  } | null;
}

export default function StudentDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStartups();
    }
  }, [user]);

  const fetchStartups = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .limit(6);

    if (!error && data) {
      setStartups(data);
    }
  };

  const stats = [
    { title: 'Courses Completed', value: '12', icon: BookOpen, color: 'text-primary' },
    { title: 'Learning Streak', value: '28 days', icon: Target, color: 'text-accent' },
    { title: 'Certificates', value: '5', icon: Trophy, color: 'text-yellow-500' },
    { title: 'Community Rank', value: '#247', icon: Star, color: 'text-purple-500' },
  ];

  const courses = [
    {
      id: '1',
      title: 'Startup Fundamentals',
      description: 'Learn the basics of starting and scaling a business',
      progress: 85,
      instructor: 'Sarah Chen',
      difficulty: 'Beginner'
    },
    {
      id: '2',
      title: 'Product Management',
      description: 'Master the art of building products users love',
      progress: 60,
      instructor: 'Mike Johnson',
      difficulty: 'Intermediate'
    },
    {
      id: '3',
      title: 'Fundraising & VC',
      description: 'Navigate the world of venture capital and fundraising',
      progress: 30,
      instructor: 'Alex Rivera',
      difficulty: 'Advanced'
    },
    {
      id: '4',
      title: 'Marketing & Growth',
      description: 'Scale your startup with proven marketing strategies',
      progress: 0,
      instructor: 'Emma Davis',
      difficulty: 'Intermediate'
    }
  ];

  const assignments = [
    { title: 'Business Model Canvas', dueDate: 'Tomorrow', status: 'pending' },
    { title: 'Market Research Report', dueDate: 'In 3 days', status: 'in-progress' },
    { title: 'Pitch Deck Review', dueDate: 'Next week', status: 'completed' },
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
                Student Dashboard
              </h1>
              <p className="text-muted-foreground">Learn, practice, and build your startup skills</p>
            </div>
          </div>
          
          <Button className="pulse-primary">
            <Play className="h-4 w-4 mr-2" />
            Continue Learning
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

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="startups">Startups</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Current Courses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-foreground">{course.title}</h3>
                            <Badge 
                              variant={course.difficulty === 'Beginner' ? 'secondary' : 
                                     course.difficulty === 'Intermediate' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {course.difficulty}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                          
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs text-muted-foreground">by {course.instructor}</span>
                            <Button size="sm" variant={course.progress > 0 ? "default" : "outline"}>
                              {course.progress > 0 ? 'Continue' : 'Start'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Upcoming Assignments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                      <div className="flex items-center space-x-3">
                        {assignment.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h4 className="font-medium text-foreground">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={assignment.status === 'completed' ? 'default' : 
                               assignment.status === 'in-progress' ? 'secondary' : 'outline'}
                      >
                        {assignment.status === 'completed' ? 'Completed' : 
                         assignment.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="startups" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Featured Startups to Learn From</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {startups.map((startup) => (
                    <Card key={startup.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={startup.profiles?.avatar_url} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {startup.profiles?.full_name?.charAt(0) || startup.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                            <p className="text-xs text-muted-foreground">{startup.profiles?.full_name}</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{startup.description}</p>
                        
                        <div className="flex space-x-1 mb-3">
                          <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                          <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                        </div>
                        
                        <Button size="sm" variant="outline" className="w-full">
                          View Case Study
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Alex Chen', points: 2847, rank: 1 },
                      { name: 'Sarah Johnson', points: 2654, rank: 2 },
                      { name: 'Mike Davis', points: 2543, rank: 3 },
                      { name: 'You', points: 2156, rank: 247 },
                    ].map((student, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        student.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-card'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            student.rank <= 3 ? 'bg-yellow-500 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {student.rank}
                          </span>
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{student.points} pts</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-accent" />
                    <span>Study Groups</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Product Management Circle', members: 24, next: 'Today 3PM' },
                      { name: 'Startup Pitch Practice', members: 18, next: 'Tomorrow 2PM' },
                      { name: 'Tech Entrepreneur Hub', members: 42, next: 'Friday 4PM' },
                    ].map((group, index) => (
                      <div key={index} className="p-3 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-foreground">{group.name}</h4>
                          <Badge variant="secondary" className="text-xs">{group.members} members</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Next session: {group.next}</p>
                        <Button size="sm" variant="outline" className="w-full">
                          Join Group
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}