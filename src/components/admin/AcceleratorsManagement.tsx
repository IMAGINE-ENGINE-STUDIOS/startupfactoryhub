import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Eye, 
  Building2,
  RefreshCw,
  MoreVertical,
  Globe,
  DollarSign,
  Users,
  Calendar,
  Rocket,
  MapPin,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { getIndustryLabel } from "@/lib/constants";

interface Accelerator {
  id: string;
  organization_name: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
  funding_offered: number | null;
  equity_percentage: number | null;
  program_duration: string | null;
  total_cohorts: number | null;
  total_startups_supported: number | null;
  is_accepting_applications: boolean | null;
  created_at: string;
  user_id: string;
  industries_focus: string[] | null;
  city: string | null;
  country: string | null;
}

interface Cohort {
  id: string;
  name: string;
  status: string | null;
  current_startups: number | null;
  max_startups: number | null;
  application_deadline: string | null;
  accelerator_id: string;
}

const CHART_COLORS = [
  'hsl(160, 70%, 45%)',
  'hsl(200, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(45, 80%, 50%)',
  'hsl(15, 80%, 55%)',
  'hsl(330, 70%, 50%)',
  'hsl(100, 60%, 45%)',
  'hsl(240, 60%, 55%)',
];

const AcceleratorsManagement = () => {
  const { toast } = useToast();
  const [accelerators, setAccelerators] = useState<Accelerator[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccelerator, setSelectedAccelerator] = useState<Accelerator | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Real-time subscriptions
    const acceleratorChannel = supabase
      .channel('admin-accelerators-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accelerator_profiles' }, () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isMounted.current) fetchData();
        }, 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accelerator_cohorts' }, () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isMounted.current) fetchData();
        }, 500);
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(acceleratorChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accResult, cohortResult] = await Promise.all([
        supabase.from('accelerator_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('accelerator_cohorts').select('*').order('created_at', { ascending: false })
      ]);

      if (accResult.error) throw accResult.error;
      if (cohortResult.error) throw cohortResult.error;

      if (isMounted.current) {
        setAccelerators(accResult.data || []);
        setCohorts(cohortResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accelerators",
        variant: "destructive"
      });
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const formatFunding = (amount: number | null) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const filteredAccelerators = accelerators.filter(a => 
    !searchQuery || 
    a.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAcceleratorCohorts = (acceleratorId: string) => {
    return cohorts.filter(c => c.accelerator_id === acceleratorId);
  };

  // Demographics: Accelerators by Country
  const locationData = (() => {
    const counts: Record<string, number> = {};
    accelerators.forEach(a => {
      const country = a.country || a.location?.split(',').pop()?.trim() || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  // Industries Focus Distribution
  const industryData = (() => {
    const counts: Record<string, number> = {};
    accelerators.forEach(a => {
      a.industries_focus?.forEach(ind => {
        counts[ind] = (counts[ind] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: getIndustryLabel(name), key: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Building2 className="h-5 w-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">{accelerators.length}</p>
            <p className="text-xs text-muted-foreground">Accelerators</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Calendar className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{cohorts.length}</p>
            <p className="text-xs text-muted-foreground">Active Cohorts</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Rocket className="h-5 w-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">
              {accelerators.reduce((sum, a) => sum + (a.total_startups_supported || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Startups Supported</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">
              {formatFunding(accelerators.reduce((sum, a) => sum + (a.funding_offered || 0), 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total Funding Offered</p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              Accelerators by Location
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {locationData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData}
                      dataKey="value"
                      nameKey="name"
                      cx="35%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                    >
                      {locationData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value} accelerators</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No location data available
              </div>
            )}
            {locationData.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {locationData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industries Focus Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              Industries Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {industryData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 8 }} 
                      width={90}
                      tickFormatter={(value) => value.length > 14 ? value.slice(0, 14) + '...' : value}
                    />
                    <Bar dataKey="value" fill="hsl(160, 70%, 45%)" radius={[0, 4, 4, 0]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-sm font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value} accelerators</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                No industry data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accelerators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Button variant="outline" onClick={fetchData} className="tech-card border-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accelerators Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Accelerators ({filteredAccelerators.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="hidden md:table-cell">Industries</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead className="hidden sm:table-cell">Equity</TableHead>
                  <TableHead className="hidden lg:table-cell">Cohorts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccelerators.map((accelerator) => (
                  <TableRow key={accelerator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={accelerator.logo_url || ''} />
                          <AvatarFallback>{accelerator.organization_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{accelerator.organization_name}</p>
                          <p className="text-xs text-muted-foreground">{accelerator.program_duration || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {accelerator.city && accelerator.country ? (
                          <>
                            <p>{accelerator.city}</p>
                            <p className="text-xs text-muted-foreground">{accelerator.country}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">{accelerator.location || 'N/A'}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {accelerator.industries_focus?.slice(0, 2).map(ind => (
                          <Badge key={ind} variant="outline" className="text-[10px] px-1.5 py-0">
                            {getIndustryLabel(ind).slice(0, 12)}
                          </Badge>
                        ))}
                        {(accelerator.industries_focus?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{accelerator.industries_focus!.length - 2}
                          </Badge>
                        )}
                        {!accelerator.industries_focus?.length && (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {formatFunding(accelerator.funding_offered)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {accelerator.equity_percentage ? `${accelerator.equity_percentage}%` : 'N/A'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {getAcceleratorCohorts(accelerator.id).length || accelerator.total_cohorts || 0}
                    </TableCell>
                    <TableCell>
                      {accelerator.is_accepting_applications ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          Closed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedAccelerator(accelerator);
                            setShowDialog(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Accelerator Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-lg">
          <DialogHeader>
            <DialogTitle>Accelerator Details</DialogTitle>
          </DialogHeader>
          {selectedAccelerator && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAccelerator.logo_url || ''} />
                  <AvatarFallback className="text-xl">{selectedAccelerator.organization_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedAccelerator.organization_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAccelerator.city && selectedAccelerator.country 
                      ? `${selectedAccelerator.city}, ${selectedAccelerator.country}`
                      : selectedAccelerator.location || 'Location not specified'}
                  </p>
                </div>
              </div>
              
              {selectedAccelerator.description && (
                <p className="text-sm text-muted-foreground">{selectedAccelerator.description}</p>
              )}

              {/* Industries Focus */}
              {selectedAccelerator.industries_focus && selectedAccelerator.industries_focus.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Industries Focus</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAccelerator.industries_focus.map(ind => (
                      <Badge key={ind} variant="outline" className="text-xs">
                        {getIndustryLabel(ind)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Offered</p>
                  <p className="font-medium">{formatFunding(selectedAccelerator.funding_offered)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equity</p>
                  <p className="font-medium">{selectedAccelerator.equity_percentage ? `${selectedAccelerator.equity_percentage}%` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program Duration</p>
                  <p className="font-medium">{selectedAccelerator.program_duration || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Startups Supported</p>
                  <p className="font-medium">{selectedAccelerator.total_startups_supported || 0}</p>
                </div>
              </div>

              {/* Cohorts for this accelerator */}
              {getAcceleratorCohorts(selectedAccelerator.id).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Active Cohorts</p>
                  <div className="space-y-2">
                    {getAcceleratorCohorts(selectedAccelerator.id).slice(0, 3).map(cohort => (
                      <div key={cohort.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{cohort.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {cohort.status || 'Active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AcceleratorsManagement;