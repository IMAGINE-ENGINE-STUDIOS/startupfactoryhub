import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Building2,
  LineChart,
  Loader2,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Valuation {
  id: string;
  company_id: string;
  valuation_amount: number;
  valuation_date: string;
  round_name: string | null;
  source: string;
  verified: boolean;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface PortfolioCompany extends Company {
  valuations: Valuation[];
  latestValuation: number;
  previousValuation: number;
  growthPercentage: number;
}

const ROUND_OPTIONS = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Secondary',
  'Marked to Market',
  'Other'
];

export default function ValuationTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<PortfolioCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingValuation, setIsAddingValuation] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState<Valuation | null>(null);
  const [isEditingValuation, setIsEditingValuation] = useState(false);
  
  // Form state for adding/editing valuation
  const [newValuationAmount, setNewValuationAmount] = useState('');
  const [newValuationDate, setNewValuationDate] = useState<Date>();
  const [newValuationRound, setNewValuationRound] = useState('');

  useEffect(() => {
    if (user) {
      fetchPortfolioWithValuations();
    }
  }, [user]);

  const fetchPortfolioWithValuations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get investments with company details
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          company_id,
          companies (
            id,
            name,
            logo_url
          )
        `)
        .eq('investor_id', user.id);

      if (investmentsError) throw investmentsError;

      if (!investments || investments.length === 0) {
        setPortfolioCompanies([]);
        setIsLoading(false);
        return;
      }

      // Get unique company IDs, filtering out nulls (external companies)
      const companyIds = [...new Set(investments.map(i => i.company_id).filter(Boolean))];

      // Fetch valuations for all portfolio companies (only platform companies)
      let valuations: Valuation[] = [];
      if (companyIds.length > 0) {
        const { data: valuationsData, error: valuationsError } = await supabase
          .from('company_valuations')
          .select('*')
          .in('company_id', companyIds)
          .order('valuation_date', { ascending: true });

        if (valuationsError) throw valuationsError;
        valuations = valuationsData || [];
      }

      // Build portfolio companies with valuation data
      const portfolioData: PortfolioCompany[] = investments
        .filter(inv => inv.companies)
        .map(inv => {
          const company = inv.companies as unknown as Company;
          const companyValuations = (valuations || []).filter(v => v.company_id === company.id);
          
          const latestValuation = companyValuations.length > 0 
            ? companyValuations[companyValuations.length - 1].valuation_amount 
            : 0;
          
          const previousValuation = companyValuations.length > 1 
            ? companyValuations[companyValuations.length - 2].valuation_amount 
            : latestValuation;
          
          const growthPercentage = previousValuation > 0 
            ? ((latestValuation - previousValuation) / previousValuation) * 100 
            : 0;

          return {
            ...company,
            valuations: companyValuations,
            latestValuation,
            previousValuation,
            growthPercentage
          };
        })
        // Remove duplicates
        .filter((company, index, self) => 
          index === self.findIndex(c => c.id === company.id)
        );

      setPortfolioCompanies(portfolioData);
      
      if (portfolioData.length > 0 && !selectedCompany) {
        setSelectedCompany(portfolioData[0]);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleAddValuation = async () => {
    if (!user || !selectedCompany || !newValuationAmount || !newValuationDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingValuation(true);
    try {
      const { error } = await supabase
        .from('company_valuations')
        .insert({
          company_id: selectedCompany.id,
          valuation_amount: parseFloat(newValuationAmount),
          valuation_date: format(newValuationDate, 'yyyy-MM-dd'),
          round_name: newValuationRound || null,
          source: 'manual',
          verified: false,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Valuation Added",
        description: `Added $${parseFloat(newValuationAmount).toLocaleString()} valuation for ${selectedCompany.name}.`,
      });

      // Reset form and refresh data
      setNewValuationAmount('');
      setNewValuationDate(undefined);
      setNewValuationRound('');
      setAddDialogOpen(false);
      fetchPortfolioWithValuations();
    } catch (error: any) {
      console.error('Error adding valuation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add valuation.",
        variant: "destructive",
      });
    }
    setIsAddingValuation(false);
  };

  const handleEditValuation = async () => {
    if (!user || !editingValuation || !newValuationAmount || !newValuationDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsEditingValuation(true);
    try {
      const { error } = await supabase
        .from('company_valuations')
        .update({
          valuation_amount: parseFloat(newValuationAmount),
          valuation_date: format(newValuationDate, 'yyyy-MM-dd'),
          round_name: newValuationRound || null,
        })
        .eq('id', editingValuation.id);

      if (error) throw error;

      toast({
        title: "Valuation Updated",
        description: `Updated valuation to $${parseFloat(newValuationAmount).toLocaleString()}.`,
      });

      // Reset form and refresh data
      setNewValuationAmount('');
      setNewValuationDate(undefined);
      setNewValuationRound('');
      setEditDialogOpen(false);
      setEditingValuation(null);
      fetchPortfolioWithValuations();
    } catch (error: any) {
      console.error('Error updating valuation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update valuation.",
        variant: "destructive",
      });
    }
    setIsEditingValuation(false);
  };

  const openEditDialog = (valuation: Valuation) => {
    setEditingValuation(valuation);
    setNewValuationAmount(valuation.valuation_amount.toString());
    setNewValuationDate(new Date(valuation.valuation_date));
    setNewValuationRound(valuation.round_name || '');
    setEditDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getChartData = () => {
    if (!selectedCompany || selectedCompany.valuations.length === 0) return [];
    
    return selectedCompany.valuations.map(v => ({
      date: format(new Date(v.valuation_date), 'MMM yyyy'),
      valuation: v.valuation_amount,
      round: v.round_name || 'N/A'
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (portfolioCompanies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <LineChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Portfolio Companies</h3>
          <p className="text-muted-foreground">
            Record investments first to track company valuations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Selector */}
      <div className="flex items-center gap-4">
        <Select 
          value={selectedCompany?.id || ''} 
          onValueChange={(id) => {
            const company = portfolioCompanies.find(c => c.id === id);
            if (company) setSelectedCompany(company);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {portfolioCompanies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex items-center gap-2">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="" className="h-5 w-5 rounded" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                  {company.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!selectedCompany}>
              <Plus className="h-4 w-4 mr-2" />
              Add Valuation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Valuation for {selectedCompany?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="valuation-amount">Valuation Amount ($) *</Label>
                <Input
                  id="valuation-amount"
                  type="number"
                  placeholder="10000000"
                  value={newValuationAmount}
                  onChange={(e) => setNewValuationAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Valuation Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newValuationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newValuationDate ? format(newValuationDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newValuationDate}
                      onSelect={setNewValuationDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Round / Event</Label>
                <Select value={newValuationRound} onValueChange={setNewValuationRound}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select round (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUND_OPTIONS.map((round) => (
                      <SelectItem key={round} value={round}>{round}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddValuation} disabled={isAddingValuation} className="flex-1">
                  {isAddingValuation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Valuation'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Valuation Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingValuation(null);
            setNewValuationAmount('');
            setNewValuationDate(undefined);
            setNewValuationRound('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Valuation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-valuation-amount">Valuation Amount ($) *</Label>
                <Input
                  id="edit-valuation-amount"
                  type="number"
                  placeholder="10000000"
                  value={newValuationAmount}
                  onChange={(e) => setNewValuationAmount(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Valuation Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newValuationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newValuationDate ? format(newValuationDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newValuationDate}
                      onSelect={setNewValuationDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Round / Event</Label>
                <Select value={newValuationRound} onValueChange={setNewValuationRound}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select round (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUND_OPTIONS.map((round) => (
                      <SelectItem key={round} value={round}>{round}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEditValuation} disabled={isEditingValuation} className="flex-1">
                  {isEditingValuation ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedCompany && (
        <>
          {/* Current Valuation Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {selectedCompany.logo_url ? (
                  <img src={selectedCompany.logo_url} alt="" className="h-6 w-6 rounded" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
                {selectedCompany.name} Valuation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(selectedCompany.latestValuation)}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Valuation</div>
                </div>
                {selectedCompany.valuations.length > 1 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm px-2 py-1 rounded",
                    selectedCompany.growthPercentage >= 0 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-red-500/10 text-red-600"
                  )}>
                    {selectedCompany.growthPercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(selectedCompany.growthPercentage).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Valuation Chart */}
          {selectedCompany.valuations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valuation History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value)} 
                        className="text-xs"
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Valuation']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valuation" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valuation History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Valuation Events</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCompany.valuations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No valuation history. Add the first valuation above.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...selectedCompany.valuations].reverse().map((valuation, index) => (
                    <div 
                      key={valuation.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {formatCurrency(valuation.valuation_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(valuation.valuation_date), 'MMM d, yyyy')}
                          {valuation.round_name && ` • ${valuation.round_name}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(valuation)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <div className="text-sm text-muted-foreground capitalize">
                          {valuation.source}
                          {valuation.verified && ' ✓'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
