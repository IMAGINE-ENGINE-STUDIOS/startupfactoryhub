import { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligence from '@/components/MarketIntelligence';
import NetworkCompanies from '@/components/NetworkCompanies';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommunityAnalytics } from '@/hooks/useCommunityAnalytics';
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
  const [timeRange, setTimeRange] = useState('30d');
  const { stats } = useCommunityAnalytics();

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Discover Startups & Market Intelligence
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore our network of innovative startups, track funding activity, and access AI-powered market research
          </p>
        </div>

        {/* Key Stats */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20">
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <Badge className="text-sm font-medium">This month on our platform</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-1">{stats.totalStartups.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">startups in network</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">{stats.totalInvestments.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">funding rounds tracked</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-1">{stats.totalInvestors.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">active investors</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Market Intelligence Search - TOP */}
        <div className="mb-12">
          <MarketIntelligence />
        </div>

        {/* Companies Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Startups in Our Network</h2>
              <p className="text-sm text-muted-foreground">
                Browse innovative companies seeking funding and partnerships
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]">
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <NetworkCompanies />
        </div>

        {/* Community Analytics - BOTTOM */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1">Community Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Detailed metrics and trends across the entire platform
            </p>
          </div>
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  );
}
