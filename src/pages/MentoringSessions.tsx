import DashboardNavigation from '@/components/DashboardNavigation';
import CalendarIntegration from '@/components/CalendarIntegration';
import VideoConferencing from '@/components/VideoConferencing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, User, CheckCircle2, XCircle } from 'lucide-react';

export default function MentoringSessions() {
  const upcomingSessions = [
    {
      id: '1',
      title: 'Product Strategy Review',
      mentor: 'Sarah Chen',
      mentee: 'Alex Johnson',
      date: 'Today at 2:00 PM',
      duration: '60 min',
      status: 'confirmed',
      type: 'video',
    },
    {
      id: '2',
      title: 'Marketing Plan Discussion',
      mentor: 'Mike Rodriguez',
      mentee: 'Emily Davis',
      date: 'Tomorrow at 10:00 AM',
      duration: '45 min',
      status: 'pending',
      type: 'video',
    },
  ];

  const pastSessions = [
    {
      id: '3',
      title: 'Tech Stack Decisions',
      mentor: 'David Lee',
      mentee: 'Chris Taylor',
      date: 'Yesterday',
      duration: '60 min',
      status: 'completed',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mentoring Sessions</h1>
            <p className="text-muted-foreground">
              Manage your mentoring schedule and video calls
            </p>
          </div>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past Sessions</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-6 space-y-4">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>Mentor: {session.mentor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={session.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{session.date}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <Video className="h-4 w-4 mr-2" />
                          Join Session
                        </Button>
                        <Button variant="outline">Reschedule</Button>
                        <Button variant="outline" size="icon">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="past" className="mt-6 space-y-4">
                {pastSessions.map((session) => (
                  <Card key={session.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{session.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>Mentor: {session.mentor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{session.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex">
                          {[...Array(session.rating)].map((_, i) => (
                            <span key={i} className="text-yellow-500">★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <VideoConferencing />
            <CalendarIntegration />
          </div>
        </div>
      </div>
    </div>
  );
}
