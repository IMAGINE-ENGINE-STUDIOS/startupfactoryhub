import { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligence from '@/components/MarketIntelligence';
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
  const [timeRange, setTimeRange] = useState('30d');

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Community Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Real-time community analytics tracking startups, mentors, investors, and activity across industries
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

        {/* Main Content - Community Analytics */}
        <AnalyticsDashboard />

        {/* Market Intelligence Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Market Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered market research with real-time data from web sources and US government databases
            </p>
          </div>
          <MarketIntelligence />
        </div>
      </div>
    </div>
  );
}
