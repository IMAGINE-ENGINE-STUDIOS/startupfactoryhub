import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNavigation from "@/components/DashboardNavigation";
import MentorRoadmapWidget from "@/components/MentorRoadmapWidget";
import StartupRecommendationsWidget from "@/components/StartupRecommendationsWidget";
import MentorCalendarWidget from "@/components/MentorCalendarWidget";
import UnifiedCommunityFeed from "@/components/UnifiedCommunityFeed";
import AIFeaturesHub from "@/components/AIFeaturesHub";
import AIQuickActions from "@/components/AIQuickActions";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Award,
  Clock,
  Target
} from "lucide-react";

const MentorDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, Sarah! 👋</h1>
              <p className="text-muted-foreground mt-1">Ready to guide the next generation of entrepreneurs?</p>
            </div>
            <div className="flex items-center space-x-3">
              <AIQuickActions />
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="hero" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Share Insights
              </Button>
            </div>
          </div>
        </div>

        {/* AI Features Hub */}
        <AIFeaturesHub />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessions This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">8 hours mentoring</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Startups funded</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Impact Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-primary">98</div>
              <p className="text-xs text-muted-foreground">Top 5% mentors</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mentee Progress Overview */}
            <MentorRoadmapWidget />

            {/* Community Feed */}
            <UnifiedCommunityFeed showCreatePost={false} maxHeight="500px" limit={5} />
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Startups
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Mentees
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  View Programs
                </Button>
              </CardContent>
            </Card>

            {/* Startup Recommendations */}
            <StartupRecommendationsWidget />

            {/* Calendar Widget */}
            <MentorCalendarWidget />

            {/* Recent Endorsements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="w-5 h-5 mr-2 text-ocean-primary" />
                  Recent Endorsements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="John" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">John Doe</span> from FinPay Solutions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      "Sarah's guidance was instrumental in our Series A success!"
                    </p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="Emma" />
                    <AvatarFallback>ET</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">Emma Thompson</span> from GreenTech
                    </p>
                    <p className="text-xs text-muted-foreground">
                      "Amazing mentor with deep industry knowledge and connections."
                    </p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  View All Endorsements
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;