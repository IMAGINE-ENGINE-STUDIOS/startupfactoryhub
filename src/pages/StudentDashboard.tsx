import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Trophy, Target, Play, CheckCircle, Clock, Star } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';

import Leaderboard from '@/components/Leaderboard';
import StudyGroups from '@/components/StudyGroups';
import FloatingChat from '@/components/FloatingChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';

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
  user_id: string;
}

export default function StudentDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile: profileWithRole } = useProfileWithRole();

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
      fetchStartups();
      fetchEnrollments();
      fetchCertificates();
    }
  }, [user]);

  const fetchStudentProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setStudentProfile(data);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description,
          instructor_name,
          difficulty,
          category,
          duration_hours
        )
      `)
      .eq('student_id', user.id)
      .order('last_accessed_at', { ascending: false });

    if (!error && data) {
      setEnrollments(data);
      const coursesData = data.map((enrollment: any) => ({
        id: enrollment.course?.id || '',
        title: enrollment.course?.title || '',
        description: enrollment.course?.description || '',
        progress: enrollment.progress_percentage || 0,
        instructor: enrollment.course?.instructor_name || '',
        difficulty: enrollment.course?.difficulty || 'Beginner'
      }));
      setCourses(coursesData);
    }
  };

  const fetchCertificates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        course:course_id (
          title
        )
      `)
      .eq('student_id', user.id);

    if (!error && data) {
      setCertificates(data);
    }
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
      .limit(6);

    if (!error && data) {
      setStartups(data);
    }
  };

  const stats = [
    { 
      title: 'Courses Enrolled', 
      value: enrollments.length.toString(), 
      icon: BookOpen, 
      color: 'text-primary' 
    },
    { 
      title: 'Learning Streak', 
      value: `${studentProfile?.learning_streak_days || 0} days`, 
      icon: Target, 
      color: 'text-accent' 
    },
    { 
      title: 'Certificates', 
      value: certificates.length.toString(), 
      icon: Trophy, 
      color: 'text-yellow-500' 
    },
    { 
      title: 'Avg Progress', 
      value: enrollments.length > 0 
        ? `${Math.round(enrollments.reduce((acc, e) => acc + e.progress_percentage, 0) / enrollments.length)}%`
        : '0%', 
      icon: Star, 
      color: 'text-purple-500' 
    },
  ];

  const assignments = [
    { title: 'Business Model Canvas', dueDate: 'Tomorrow', status: 'pending' },
    { title: 'Market Research Report', dueDate: 'In 3 days', status: 'in-progress' },
    { title: 'Pitch Deck Review', dueDate: 'Next week', status: 'completed' },
  ];

  const enrollInCourse = async (courseId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Enrolled",
          description: "You're already enrolled in this course.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enroll in course. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Enrolled Successfully!",
      description: "You can now start learning.",
    });

    fetchEnrollments();
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-2 sm:p-4 pb-20 lg:pb-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="student"
              fallbackText={user?.email || 'S'}
              className="h-12 w-12 sm:h-16 sm:w-16"
            />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profileWithRole?.full_name || 'Student'} Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Learn, practice, and build your startup skills</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="pulse-primary flex-1 sm:flex-none">
              <Play className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Continue Learning</span>
            </Button>
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

        <Tabs defaultValue="courses" className="space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-10 max-w-5xl">
              <TabsTrigger value="courses" className="flex-shrink-0">Courses</TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-shrink-0">Leaderboard</TabsTrigger>
              <TabsTrigger value="groups" className="flex-shrink-0">Study Groups</TabsTrigger>
              <TabsTrigger value="assignments" className="flex-shrink-0">Assignments</TabsTrigger>
              <TabsTrigger value="startups" className="flex-shrink-0">Startups</TabsTrigger>
              <TabsTrigger value="community" className="flex-shrink-0">Community</TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0">Network</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0">Intelligence</TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0">Tools</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="groups">
            <StudyGroups />
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>My Courses</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
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
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course</p>
                    <Button className="pulse-primary">
                      Browse Courses
                    </Button>
                  </div>
                )}
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
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {startup.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                            <p className="text-xs text-muted-foreground">Startup Founder</p>
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
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
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

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}