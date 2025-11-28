import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Search, CheckCircle, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvestmentRecorded?: () => void;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  stage: string | null;
  logo_url: string | null;
}

const INVESTMENT_ROUNDS = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C',
  'Series D+',
  'Bridge',
  'Convertible Note',
  'SAFE',
  'Other'
];

export default function RecordInvestmentDialog({ 
  open, 
  onOpenChange,
  onInvestmentRecorded 
}: RecordInvestmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanySearch, setShowCompanySearch] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [equityPercentage, setEquityPercentage] = useState('');
  const [investmentDate, setInvestmentDate] = useState<Date>();
  const [investmentRound, setInvestmentRound] = useState('');
  const [valuationAtInvestment, setValuationAtInvestment] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'verified' | 'unverified'>('none');

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCompanies(searchQuery);
      } else {
        fetchCompanies();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchCompanies = async () => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, stage, logo_url')
      .limit(20);

    if (!error && data) {
      setCompanies(data);
    }
    setIsSearching(false);
  };

  const searchCompanies = async (query: string) => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, stage, logo_url')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (!error && data) {
      setCompanies(data);
    }
    setIsSearching(false);
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanySearch(false);
  };

  const handleVerifyWithAPI = async () => {
    if (!selectedCompany) return;
    
    setIsVerifying(true);
    try {
      // Call the validate-investment edge function
      const { data, error } = await supabase.functions.invoke('validate-investment', {
        body: {
          companyName: selectedCompany.name,
          investmentAmount: parseFloat(amount) || 0,
          investmentRound: investmentRound
        }
      });

      if (error) throw error;

      if (data?.verified) {
        setVerificationStatus('verified');
        toast({
          title: "Verification Successful",
          description: "Investment data matches external records.",
        });
      } else {
        setVerificationStatus('unverified');
        toast({
          title: "Verification Notice",
          description: data?.message || "Could not verify against external data. Investment will be recorded as unverified.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('unverified');
      toast({
        title: "Verification Unavailable",
        description: "External verification service is not configured. Investment will be recorded as unverified.",
        variant: "default",
      });
    }
    setIsVerifying(false);
  };

  const handleSubmit = async () => {
    if (!user || !selectedCompany || !amount || !investmentDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Insert the investment
      const { error: investmentError } = await supabase
        .from('investments')
        .insert({
          investor_id: user.id,
          company_id: selectedCompany.id,
          amount: parseFloat(amount),
          equity_percentage: equityPercentage ? parseFloat(equityPercentage) : null,
          investment_date: format(investmentDate, 'yyyy-MM-dd'),
          investment_round: investmentRound || null,
          valuation_at_investment: valuationAtInvestment ? parseFloat(valuationAtInvestment) : null,
          source: 'manual',
          verified: verificationStatus === 'verified',
          notes: notes || null,
          status: 'active'
        });

      if (investmentError) throw investmentError;

      // If valuation was provided, also record it in company_valuations
      if (valuationAtInvestment && investmentDate) {
        await supabase
          .from('company_valuations')
          .insert({
            company_id: selectedCompany.id,
            valuation_amount: parseFloat(valuationAtInvestment),
            valuation_date: format(investmentDate, 'yyyy-MM-dd'),
            round_name: investmentRound || null,
            source: 'manual',
            verified: verificationStatus === 'verified',
            created_by: user.id
          });
      }

      toast({
        title: "Investment Recorded",
        description: `Successfully recorded $${parseFloat(amount).toLocaleString()} investment in ${selectedCompany.name}.`,
      });

      // Reset form
      resetForm();
      onOpenChange(false);
      onInvestmentRecorded?.();
    } catch (error: any) {
      console.error('Error recording investment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record investment.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setShowCompanySearch(true);
    setSearchQuery('');
    setAmount('');
    setEquityPercentage('');
    setInvestmentDate(undefined);
    setInvestmentRound('');
    setValuationAtInvestment('');
    setNotes('');
    setVerificationStatus('none');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Record Investment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label>Company *</Label>
            {showCompanySearch ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No companies found
                    </div>
                  ) : (
                    companies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => handleSelectCompany(company)}
                        className="w-full p-3 text-left hover:bg-accent flex items-center gap-3 border-b last:border-b-0"
                      >
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Building2 className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {company.industry} {company.stage && `• ${company.stage}`}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/50">
                {selectedCompany?.logo_url ? (
                  <img src={selectedCompany.logo_url} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{selectedCompany?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCompany?.industry} {selectedCompany?.stage && `• ${selectedCompany.stage}`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCompanySearch(true)}>
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equity">Equity Percentage (%)</Label>
              <Input
                id="equity"
                type="number"
                step="0.01"
                placeholder="5.0"
                value={equityPercentage}
                onChange={(e) => setEquityPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Investment Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !investmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {investmentDate ? format(investmentDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={investmentDate}
                    onSelect={setInvestmentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Investment Round</Label>
              <Select value={investmentRound} onValueChange={setInvestmentRound}>
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {INVESTMENT_ROUNDS.map((round) => (
                    <SelectItem key={round} value={round}>{round}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valuation">Company Valuation at Investment ($)</Label>
            <Input
              id="valuation"
              type="number"
              placeholder="5000000"
              value={valuationAtInvestment}
              onChange={(e) => setValuationAtInvestment(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This helps calculate accurate ROI based on valuation changes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about this investment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Verification Section */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  External Verification
                  {verificationStatus === 'verified' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Validate against external data sources (Crunchbase)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerifyWithAPI}
                disabled={!selectedCompany || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : verificationStatus === 'verified' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verified
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Investment'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
