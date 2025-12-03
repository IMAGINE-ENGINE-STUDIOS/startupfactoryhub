import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Rocket, 
  Users, 
  FileText, 
  Briefcase, 
  Calendar,
  BarChart3,
  Settings,
  Globe,
  MessageSquare,
  Sparkles,
  Building2,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAcceleratorProfile } from '@/hooks/useAcceleratorProfile';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { CohortManagement } from '@/components/accelerator/CohortManagement';
import { CohortApplicationsManager } from '@/components/accelerator/CohortApplicationsManager';
import { StartupJourneyTracker } from '@/components/accelerator/StartupJourneyTracker';
import { AcceleratorPortfolio } from '@/components/accelerator/AcceleratorPortfolio';
import { MentorAdvisorAssignment } from '@/components/accelerator/MentorAdvisorAssignment';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import DashboardNavigation from '@/components/DashboardNavigation';
import { DashboardHeader } from '@/components/DashboardHeader';
import AIFeaturesHub from '@/components/AIFeaturesHub';

const AcceleratorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { profile: userProfile } = useProfileWithRole();
  const {
    profile,
    cohorts,
    applications,
    portfolioStartups,
    loading,
    createCohort,
    updateCohort,
    updateApplicationStatus,
    acceptStartupToCohort,
    assignMentor,
    assignAdvisor,
    addMilestone,
    updateMilestone
  } = useAcceleratorProfile();

  const [selectedCohort, setSelectedCohort] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accelerator dashboard...</p>
        </div>
      </div>
    );
  }

  // Stats
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const activeStartups = portfolioStartups.filter(s => s.current_stage === 'active').length;
  const activeCohorts = cohorts.filter(c => c.status === 'in_progress' || c.status === 'applications_open').length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="flex">
        <DashboardNavigation />
        
        <main className="flex-1 p-6 ml-16 md:ml-64">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  {profile?.organization_name || 'Accelerator Dashboard'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your cohorts, applications, and portfolio companies
                </p>
              </div>

              <TabsList className="glass-morphism">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cohorts" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Cohorts
                </TabsTrigger>
                <TabsTrigger value="applications" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Applications
                  {pendingApplications > 0 && (
                    <Badge className="ml-1 bg-emerald-500">{pendingApplications}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="journey" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Journey
                </TabsTrigger>
                <TabsTrigger value="mentors" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Mentors
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-morphism border-border/50 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Cohorts</p>
                        <p className="text-3xl font-bold text-emerald-400">{activeCohorts}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-emerald-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50 hover:border-blue-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Applications</p>
                        <p className="text-3xl font-bold text-blue-400">{pendingApplications}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50 hover:border-purple-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Startups</p>
                        <p className="text-3xl font-bold text-purple-400">{activeStartups}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50 hover:border-amber-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Supported</p>
                        <p className="text-3xl font-bold text-amber-400">
                          {profile?.total_startups_supported || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Applications */}
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      Recent Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {applications.slice(0, 5).map((app) => (
                        <div 
                          key={app.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={app.startup?.logo_url || undefined} />
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                              {app.startup?.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{app.startup?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {app.startup?.industry || 'Technology'}
                            </p>
                          </div>
                          <Badge className={
                            app.status === 'pending' ? 'bg-slate-500/20 text-slate-400' :
                            app.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                          }>
                            {app.status}
                          </Badge>
                        </div>
                      ))}
                      {applications.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No applications yet
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab('applications')}
                    >
                      View All Applications
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Cohorts */}
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      Your Cohorts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cohorts.slice(0, 5).map((cohort) => (
                        <div 
                          key={cohort.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedCohort(cohort);
                            setActiveTab('cohorts');
                          }}
                        >
                          <div>
                            <p className="font-medium">{cohort.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cohort.current_startups} / {cohort.max_startups} startups
                            </p>
                          </div>
                          <Badge className={
                            cohort.status === 'applications_open' ? 'bg-emerald-500/20 text-emerald-400' :
                            cohort.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }>
                            {cohort.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      {cohorts.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No cohorts created yet
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => setActiveTab('cohorts')}
                    >
                      Manage Cohorts
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Community Feed */}
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    Community Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UnifiedCommunityFeed />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cohorts Tab */}
            <TabsContent value="cohorts">
              <CohortManagement
                cohorts={cohorts}
                onCreateCohort={createCohort}
                onUpdateCohort={updateCohort}
                onSelectCohort={setSelectedCohort}
              />
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <CohortApplicationsManager
                applications={applications}
                cohorts={cohorts}
                onUpdateStatus={updateApplicationStatus}
                onAcceptStartup={acceptStartupToCohort}
              />
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <AcceleratorPortfolio
                startups={portfolioStartups}
                cohorts={cohorts}
                totalFundingRaised={profile?.total_funding_raised || 0}
                onViewStartup={(startup) => {
                  setActiveTab('journey');
                }}
              />
            </TabsContent>

            {/* Journey Tab */}
            <TabsContent value="journey">
              <StartupJourneyTracker
                startups={portfolioStartups}
                onAddMilestone={addMilestone}
                onUpdateMilestone={updateMilestone}
              />
            </TabsContent>

            {/* Mentors Tab */}
            <TabsContent value="mentors">
              <MentorAdvisorAssignment
                startups={portfolioStartups}
                onAssignMentor={assignMentor}
                onAssignAdvisor={assignAdvisor}
              />
            </TabsContent>

            {/* Resources Tab */}
            {activeTab === "resources" && (
              <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
                <div className="absolute inset-0">
                  <GlobalResourcesMap />
                </div>
              </TabsContent>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <TabsContent value="calendar">
                <UnifiedCalendar userRole="accelerator" />
              </TabsContent>
            )}

            {/* AI Tools Tab */}
            {activeTab === "ai-tools" && (
              <TabsContent value="ai-tools">
                <AIFeaturesHub />
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AcceleratorDashboard;
