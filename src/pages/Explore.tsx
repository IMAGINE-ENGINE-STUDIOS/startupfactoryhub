import DashboardNavigation from '@/components/DashboardNavigation';
import AdvancedMatchingFilters from '@/components/AdvancedMatchingFilters';
import RoleBasedMatching from '@/components/RoleBasedMatching';
import StartupRecommendationsWidget from '@/components/StartupRecommendationsWidget';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Building, TrendingUp } from 'lucide-react';

export default function Explore() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore & Connect</h1>
          <p className="text-muted-foreground">
            Discover opportunities and make meaningful connections
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <AdvancedMatchingFilters />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <Tabs defaultValue="matches" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="matches">
                  <Users className="h-4 w-4 mr-2" />
                  Matches
                </TabsTrigger>
                <TabsTrigger value="startups">
                  <Building className="h-4 w-4 mr-2" />
                  Startups
                </TabsTrigger>
                <TabsTrigger value="trending">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matches" className="mt-6">
                <RoleBasedMatching />
              </TabsContent>

              <TabsContent value="startups" className="mt-6">
                <StartupRecommendationsWidget />
              </TabsContent>

              <TabsContent value="trending" className="mt-6">
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Trending This Week</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { name: 'AI/ML Startups', growth: '+45%', category: 'Industry' },
                        { name: 'Series A Funding', growth: '+32%', category: 'Stage' },
                        { name: 'HealthTech', growth: '+28%', category: 'Industry' },
                        { name: 'Remote Teams', growth: '+24%', category: 'Location' },
                      ].map((item) => (
                        <Card key={item.name} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-green-500 font-medium">{item.growth}</p>
                              <p className="text-xs text-muted-foreground">This week</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
