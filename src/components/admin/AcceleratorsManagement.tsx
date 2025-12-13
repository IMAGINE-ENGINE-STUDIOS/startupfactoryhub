import { useState, useEffect } from 'react';
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
  Rocket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface Cohort {
  id: string;
  name: string;
  status: string | null;
  current_startups: number | null;
  max_startups: number | null;
  application_deadline: string | null;
}

const AcceleratorsManagement = () => {
  const { toast } = useToast();
  const [accelerators, setAccelerators] = useState<Accelerator[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccelerator, setSelectedAccelerator] = useState<Accelerator | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchData();
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

      setAccelerators(accResult.data || []);
      setCohorts(cohortResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch accelerators",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    a.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAcceleratorCohorts = (acceleratorId: string) => {
    return cohorts.filter(c => c.id === acceleratorId);
  };

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
                  <TableHead>Funding Offered</TableHead>
                  <TableHead>Equity</TableHead>
                  <TableHead>Cohorts</TableHead>
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
                          <p className="font-medium">{accelerator.organization_name}</p>
                          <p className="text-xs text-muted-foreground">{accelerator.program_duration || 'N/A'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{accelerator.location || 'N/A'}</TableCell>
                    <TableCell className="font-medium">
                      {formatFunding(accelerator.funding_offered)}
                    </TableCell>
                    <TableCell>{accelerator.equity_percentage ? `${accelerator.equity_percentage}%` : 'N/A'}</TableCell>
                    <TableCell>{accelerator.total_cohorts || 0}</TableCell>
                    <TableCell>
                      {accelerator.is_accepting_applications ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">{selectedAccelerator.location}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selectedAccelerator.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Funding Offered</p>
                  <p className="font-medium">{formatFunding(selectedAccelerator.funding_offered)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equity</p>
                  <p className="font-medium">{selectedAccelerator.equity_percentage}%</p>
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