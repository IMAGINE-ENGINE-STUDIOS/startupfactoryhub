import { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import PerformanceMetrics from '@/components/PerformanceMetrics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics & Insights</h1>
            <p className="text-muted-foreground">
              Track your progress and performance metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceMetrics />
          </TabsContent>

          <TabsContent value="insights">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI-Generated Insights</h3>
                </div>

                <div className="space-y-4">
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <h4 className="font-medium mb-2">🎯 Top Opportunity</h4>
                    <p className="text-sm text-muted-foreground">
                      Your response rate increased by 15% this week. Consider scheduling
                      more 1-on-1 sessions to maintain this momentum.
                    </p>
                  </Card>

                  <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                    <h4 className="font-medium mb-2">📈 Growth Trend</h4>
                    <p className="text-sm text-muted-foreground">
                      Your network has grown by 23% this month. FinTech startups are
                      showing the most interest in connecting with you.
                    </p>
                  </Card>

                  <Card className="p-4 bg-green-500/5 border-green-500/20">
                    <h4 className="font-medium mb-2">✨ Engagement Win</h4>
                    <p className="text-sm text-muted-foreground">
                      Your shared resources received 45% more views than average. Keep
                      sharing content on AI/ML topics for maximum impact.
                    </p>
                  </Card>

                  <Card className="p-4 bg-orange-500/5 border-orange-500/20">
                    <h4 className="font-medium mb-2">⚠️ Area to Improve</h4>
                    <p className="text-sm text-muted-foreground">
                      Your event attendance has decreased by 12%. Try joining more virtual
                      events to stay connected with the community.
                    </p>
                  </Card>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
