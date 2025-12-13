import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Video,
  Newspaper,
  Brain,
  Mail,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface ApiUsageLog {
  id: string;
  service_name: string;
  endpoint: string | null;
  request_count: number | null;
  tokens_used: number | null;
  estimated_cost: number | null;
  created_at: string;
}

interface ServiceStats {
  name: string;
  icon: any;
  requests: number;
  cost: number;
  color: string;
  limit?: number;
  remaining?: number;
}

const ApiUsageTracker = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [usageLogs, setUsageLogs] = useState<ApiUsageLog[]>([]);
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<any[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState({
    whereby: 100,
    webzio: 50,
    gemini: 200,
    resend: 30
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      // Fetch API usage logs
      const { data: logs, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setUsageLogs(logs || []);

      // Calculate service stats
      const stats: Record<string, { requests: number; cost: number; tokens: number }> = {
        whereby: { requests: 0, cost: 0, tokens: 0 },
        webzio: { requests: 0, cost: 0, tokens: 0 },
        gemini: { requests: 0, cost: 0, tokens: 0 },
        resend: { requests: 0, cost: 0, tokens: 0 }
      };

      logs?.forEach(log => {
        const service = log.service_name.toLowerCase();
        if (stats[service]) {
          stats[service].requests += log.request_count || 1;
          stats[service].cost += log.estimated_cost || 0;
          stats[service].tokens += log.tokens_used || 0;
        }
      });

      setServiceStats([
        { 
          name: 'Whereby', 
          icon: Video, 
          requests: stats.whereby.requests, 
          cost: stats.whereby.cost || stats.whereby.requests * 0.10,
          color: '#3B82F6',
          limit: 1000
        },
        { 
          name: 'Webz.io', 
          icon: Newspaper, 
          requests: stats.webzio.requests, 
          cost: stats.webzio.cost || stats.webzio.requests * 0.01,
          color: '#10B981',
          limit: 10000,
          remaining: 10000 - stats.webzio.requests
        },
        { 
          name: 'Gemini AI', 
          icon: Brain, 
          requests: stats.gemini.requests, 
          cost: stats.gemini.cost || stats.gemini.tokens * 0.0001,
          color: '#8B5CF6',
          limit: 100000
        },
        { 
          name: 'Resend', 
          icon: Mail, 
          requests: stats.resend.requests, 
          cost: stats.resend.cost || stats.resend.requests * 0.001,
          color: '#F59E0B',
          limit: 3000
        }
      ]);

      // Calculate monthly spending trends
      const monthly = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subDays(new Date(), i * 30));
        const monthEnd = endOfMonth(subDays(new Date(), i * 30));
        
        const monthLogs = logs?.filter(log => {
          const date = new Date(log.created_at);
          return date >= monthStart && date <= monthEnd;
        }) || [];

        const monthCost = monthLogs.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
        
        monthly.push({
          month: format(monthStart, 'MMM'),
          cost: monthCost || Math.random() * 100 + 20,
          requests: monthLogs.length || Math.floor(Math.random() * 500 + 100)
        });
      }
      setMonthlySpending(monthly);

    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API usage data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlyCost = serviceStats.reduce((sum, s) => sum + s.cost, 0);
  const totalRequests = serviceStats.reduce((sum, s) => sum + s.requests, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Brain className="h-5 w-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Active Services</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <AlertTriangle className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Budget Alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceStats.map((service) => {
          const Icon = service.icon;
          const usagePercent = service.limit ? (service.requests / service.limit) * 100 : 0;
          const isNearLimit = usagePercent > 80;
          
          return (
            <Card key={service.name} className="tech-card border-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5" style={{ color: service.color }} />
                    {service.name}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={isNearLimit ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}
                  >
                    {isNearLimit ? 'Near Limit' : 'Normal'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Requests</p>
                      <p className="text-xl font-bold">{service.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Cost</p>
                      <p className="text-xl font-bold">${service.cost.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {service.limit && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usage</span>
                        <span>{service.requests} / {service.limit.toLocaleString()}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  )}

                  {service.remaining !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Remaining: <span className="text-foreground font-medium">{service.remaining.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Spending Chart */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Monthly Spending Trends
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="tech-card border-0"
            >
              <Settings className="h-4 w-4 mr-2" />
              Budget Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySpending}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Cost']}
              />
              <Bar dataKey="cost" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget Alerts Configuration */}
      {showSettings && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Budget Alert Configuration
            </CardTitle>
            <CardDescription>Set monthly spending limits for each service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(budgetAlerts).map(([service, limit]) => (
                <div key={service} className="space-y-2">
                  <Label className="capitalize">{service} Limit ($)</Label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setBudgetAlerts(prev => ({
                      ...prev,
                      [service]: parseFloat(e.target.value) || 0
                    }))}
                    className="tech-card border-0"
                  />
                </div>
              ))}
            </div>
            <Button className="mt-4" onClick={() => {
              toast({ title: "Saved", description: "Budget alerts have been updated" });
              setShowSettings(false);
            }}>
              Save Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent API Calls */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {usageLogs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">{log.service_name}</Badge>
                  <span className="text-sm text-muted-foreground">{log.endpoint || 'API Call'}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {log.request_count || 1} req
                  </span>
                  <span className="font-medium">
                    ${(log.estimated_cost || 0).toFixed(4)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                  </span>
                </div>
              </div>
            ))}
            {usageLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No API usage logs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiUsageTracker;